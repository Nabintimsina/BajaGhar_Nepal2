from django.db import migrations
from django.db.models import Sum


def complete_existing_course_metadata(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Lesson = apps.get_model('catalog', 'Lesson')

    for course in Course.objects.select_related('instrument').all():
        duration = course.lessons.aggregate(total=Sum('duration_minutes')).get('total') or 0
        if not course.estimated_duration_minutes and duration:
            course.estimated_duration_minutes = duration
            course.save(update_fields=['estimated_duration_minutes'])

        instrument = course.instrument
        if not instrument:
            continue

        source_content = [
            instrument.description,
            instrument.history,
            instrument.materials,
            instrument.playing_technique,
            instrument.cultural_significance,
        ]
        tutorials = list(instrument.tutorials.order_by('id'))

        for lesson in course.lessons.order_by('order', 'id'):
            updates = {}
            source_index = lesson.order - 1
            if source_index < len(source_content) and not lesson.content and source_content[source_index]:
                updates['content'] = source_content[source_index]
            if source_index >= len(source_content):
                tutorial_index = source_index - len(source_content)
                if tutorial_index < len(tutorials):
                    tutorial = tutorials[tutorial_index]
                    if not lesson.video_url and tutorial.video_url:
                        updates['video_url'] = tutorial.video_url
                    if not lesson.description and tutorial.description:
                        updates['description'] = tutorial.description
            if updates:
                for field, value in updates.items():
                    setattr(lesson, field, value)
                lesson.save(update_fields=list(updates))


def reverse_complete_existing_course_metadata(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0027_add_course_learning_metadata'),
    ]

    operations = [
        migrations.RunPython(complete_existing_course_metadata, reverse_complete_existing_course_metadata),
    ]
