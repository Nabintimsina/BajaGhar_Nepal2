from django.db import migrations
from django.utils.text import slugify


def reorganize_instrument_learning(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Instrument = apps.get_model('catalog', 'Instrument')
    Lesson = apps.get_model('catalog', 'Lesson')

    for instrument in Instrument.objects.prefetch_related('tutorials').all():
        instrument_slug = slugify(instrument.name)
        existing_course = Course.objects.filter(instrument_id=instrument.pk).order_by('order', 'id').first()
        course_slug = existing_course.slug if existing_course else f'learn-{instrument_slug}-beginner'
        course_title = existing_course.title if existing_course else f'Learn {instrument.name} - Beginner'
        course_description = (
            existing_course.description
            if existing_course and existing_course.description
            else f'A beginner learning path for {instrument.name}, its history, technique, and living musical tradition.'
        )
        course, _ = Course.objects.get_or_create(
            slug=course_slug,
            defaults={
                'title': course_title,
                'description': course_description,
                'instrument_id': instrument.pk,
                'is_premium': False,
                'order': instrument.pk,
                'is_visible': True,
            },
        )

        if course.instrument_id != instrument.pk:
            course.instrument_id = instrument.pk
            course.save(update_fields=['instrument'])

        tutorials = list(instrument.tutorials.order_by('id'))
        base_lessons = [
            ('Introduction to the Instrument', instrument.description, instrument.description, 10),
            ('History and Cultural Context', 'Explore the history and cultural role of this instrument.', instrument.history, 12),
            ('Materials and Construction', 'Learn how traditional makers shape the instrument.', instrument.materials, 10),
            ('Playing Technique', 'Understand the posture, handling, and basic approach to playing.', instrument.playing_technique, 15),
            ('Cultural Significance', 'Connect the instrument to communities, ceremonies, and musical life.', instrument.cultural_significance, 12),
        ]

        if instrument.name == 'Dhime' and len(tutorials) >= 2:
            base_lessons = [
                ('Meet the Dhime', instrument.description, instrument.description, 10),
                ('Holding and Striking', tutorials[1].description, '', 15),
                ('Festival Rhythm Basics', tutorials[2].description if len(tutorials) > 2 else tutorials[0].description, '', 20),
            ]

        lesson_specs = [
            {
                'title': title,
                'description': description or f'Explore {instrument.name} through this guided lesson.',
                'content': content or '',
                'duration_minutes': duration,
                'video_url': '',
                'is_premium': False,
            }
            for title, description, content, duration in base_lessons
        ]

        if instrument.name != 'Dhime':
            lesson_specs.extend(
                {
                    'title': tutorial.title or f'{instrument.name} demonstration',
                    'description': tutorial.description or 'Watch a demonstration from the BajaGhar archive.',
                    'content': '',
                    'duration_minutes': 15,
                    'video_url': tutorial.video_url,
                    'is_premium': False,
                }
                for tutorial in tutorials
            )
        else:
            for index, tutorial in enumerate(tutorials[:2], start=1):
                lesson_specs[index]['video_url'] = tutorial.video_url

        for order, lesson_data in enumerate(lesson_specs, start=1):
            lesson, _ = Lesson.objects.get_or_create(course=course, order=order, defaults=lesson_data)
            updates = {}
            if not lesson.description:
                updates['description'] = lesson_data['description']
            if lesson_data['content'] and not lesson.content:
                updates['content'] = lesson_data['content']
            if lesson_data['video_url'] and not lesson.video_url:
                updates['video_url'] = lesson_data['video_url']
            if not lesson.duration_minutes:
                updates['duration_minutes'] = lesson_data['duration_minutes']
            if updates:
                for field, value in updates.items():
                    setattr(lesson, field, value)
                lesson.save(update_fields=list(updates))


def reverse_reorganize_instrument_learning(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Lesson = apps.get_model('catalog', 'Lesson')
    seeded_slugs = ['learn-bansuri-beginner', 'learn-sarangi-beginner']
    Lesson.objects.filter(course__slug__in=seeded_slugs).delete()
    Course.objects.filter(slug__in=seeded_slugs).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0025_complete_dhime_lessons'),
    ]

    operations = [
        migrations.RunPython(reorganize_instrument_learning, reverse_reorganize_instrument_learning),
    ]
