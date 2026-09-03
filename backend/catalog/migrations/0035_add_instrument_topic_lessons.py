from django.db import migrations


def add_instrument_topic_lessons(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Lesson = apps.get_model('catalog', 'Lesson')

    topic_fields = [
        ('History and Cultural Context', 'history', 'Explore the history and cultural roots of this instrument.'),
        ('Materials and Construction', 'materials', 'Learn about the materials and traditional craftsmanship used to make this instrument.'),
        ('Playing Technique', 'playing_technique', 'Understand the basic posture, handling, and playing approach for this instrument.'),
        ('Cultural Significance', 'cultural_significance', 'Discover how this instrument connects communities, ceremonies, and musical life.'),
    ]

    for course in Course.objects.select_related('instrument').all():
        instrument = course.instrument
        if instrument is None:
            continue

        existing_lessons = list(Lesson.objects.filter(course_id=course.pk).order_by('order', 'id'))
        if len(existing_lessons) < 5:
            continue

        # Keep the first two lessons as image and 3D lessons, and move videos to the end.
        video_lessons = existing_lessons[2:5]
        for index, lesson in enumerate(video_lessons, start=7):
            lesson.order = index
            lesson.save(update_fields=['order'])

        for index, (title, field_name, fallback) in enumerate(topic_fields, start=3):
            content = getattr(instrument, field_name, '') or ''
            lesson, created = Lesson.objects.get_or_create(
                course_id=course.pk,
                order=index,
                defaults={
                    'title': title,
                    'description': content or fallback,
                    'content': content,
                    'is_premium': False,
                    'duration_minutes': 10,
                },
            )
            if not created:
                updates = {}
                if not lesson.title or lesson.title in [item.title for item in existing_lessons]:
                    updates['title'] = title
                if not lesson.description:
                    updates['description'] = content or fallback
                if not lesson.content:
                    updates['content'] = content
                if updates:
                    for field, value in updates.items():
                        setattr(lesson, field, value)
                    lesson.save(update_fields=list(updates))


def reverse_add_instrument_topic_lessons(apps, schema_editor):
    Lesson = apps.get_model('catalog', 'Lesson')
    Lesson.objects.filter(order__in=[3, 4, 5, 6]).delete()
    for course_id in Lesson.objects.values_list('course_id', flat=True).distinct():
        for index, lesson in enumerate(
            Lesson.objects.filter(course_id=course_id).order_by('order', 'id'),
            start=3,
        ):
            lesson.order = index
            lesson.save(update_fields=['order'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0034_normalize_instrument_courses'),
    ]

    operations = [
        migrations.RunPython(add_instrument_topic_lessons, reverse_add_instrument_topic_lessons),
    ]
