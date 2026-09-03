from django.db import migrations
from django.utils.text import slugify


COURSE_ORDER = {
    'Madal': 1,
    'Sarangi': 2,
    'Bansuri': 3,
    'Dhime': 4,
}


def normalize_instrument_courses(apps, schema_editor):
    Instrument = apps.get_model('catalog', 'Instrument')
    Course = apps.get_model('catalog', 'Course')
    Lesson = apps.get_model('catalog', 'Lesson')
    Tutorial = apps.get_model('catalog', 'Tutorial')

    instruments = list(Instrument.objects.order_by('id'))
    kept_course_ids = []

    for instrument in instruments:
        course = Course.objects.filter(instrument_id=instrument.pk).order_by('order', 'id').first()
        if course is None:
            course = Course.objects.create(
                title=f'Learn {instrument.name} - Beginner',
                slug=f'course-{instrument.pk}-{slugify(instrument.name)}',
                instrument_id=instrument.pk,
            )

        kept_course_ids.append(course.pk)
        course.title = f'Learn {instrument.name} - Beginner'
        course.slug = f'course-{instrument.pk}-{slugify(instrument.name)}'
        course.description = f'A guided beginner course covering the {instrument.name}, its cultural context, and first techniques.'
        course.level = 'Beginner'
        course.estimated_duration_minutes = 0
        course.what_you_will_learn = f'Understand the {instrument.name}, explore its cultural place, and build practical foundations through guided lessons.'
        course.target_audience = 'Curious beginners and culture learners starting their journey with Nepali traditional music.'
        course.requirements = 'No previous experience is required.'
        course.is_premium = False
        course.is_visible = True
        course.order = COURSE_ORDER.get(instrument.name, instrument.pk)
        expert = instrument.experts.order_by('id').first()
        course.reference_expert_id = expert.pk if expert else None
        course.save()

    Course.objects.exclude(pk__in=kept_course_ids).delete()

    for instrument in instruments:
        course = Course.objects.get(pk=kept_course_ids[instruments.index(instrument)])
        Lesson.objects.filter(course_id=course.pk).delete()
        tutorials = list(Tutorial.objects.filter(instrument_id=instrument.pk).order_by('id')[:3])

        lesson_specs = [
            {
                'title': f'Meet the {instrument.name}',
                'description': instrument.description or f'An introduction to the {instrument.name}.',
                'content': instrument.description or '',
                'photo': instrument.primary_image.name if instrument.primary_image else None,
                'attachment_type': 'photo' if instrument.primary_image else 'none',
                'attachment_photo': instrument.primary_image.name if instrument.primary_image else None,
                'duration_minutes': 10,
            },
            {
                'title': f'Explore the {instrument.name} in 3D',
                'description': f'Explore the shape and construction of the {instrument.name} with the interactive 3D model.',
                'content': instrument.materials or '',
                'attachment_type': '3d_model' if instrument.model_3d else 'none',
                'attachment_3d_model': instrument.model_3d.name if instrument.model_3d else None,
                'duration_minutes': 10,
            },
        ]

        for index, tutorial in enumerate(tutorials, start=1):
            lesson_specs.append({
                'title': tutorial.title or f'{instrument.name} video lesson {index}',
                'description': tutorial.description or f'Watch a guided {instrument.name} demonstration.',
                'content': '',
                'video_url': tutorial.video_url,
                'duration_minutes': 15,
            })

        while len(lesson_specs) < 5:
            index = len(lesson_specs) - 1
            lesson_specs.append({
                'title': f'{instrument.name} video lesson {index}',
                'description': f'Watch a guided {instrument.name} demonstration.',
                'content': '',
                'video_url': '',
                'duration_minutes': 15,
            })

        for order, lesson_data in enumerate(lesson_specs[:5], start=1):
            Lesson.objects.create(
                course_id=course.pk,
                order=order,
                is_premium=False,
                **lesson_data,
            )


def restore_previous_courses(apps, schema_editor):
    # The prior course and lesson rows cannot be reconstructed without the original database state.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0033_lessonattachment'),
    ]

    operations = [
        migrations.RunPython(normalize_instrument_courses, restore_previous_courses),
    ]
