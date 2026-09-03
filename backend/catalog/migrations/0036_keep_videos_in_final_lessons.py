from django.db import migrations


def keep_videos_in_final_lessons(apps, schema_editor):
    Lesson = apps.get_model('catalog', 'Lesson')
    LessonAttachment = apps.get_model('catalog', 'LessonAttachment')

    early_lessons = Lesson.objects.filter(order__lt=7)
    early_lessons.update(video_url='', attachment_video=None)
    LessonAttachment.objects.filter(lesson__order__lt=7, attachment_type='video').delete()


def reverse_keep_videos_in_final_lessons(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0035_add_instrument_topic_lessons'),
    ]

    operations = [
        migrations.RunPython(keep_videos_in_final_lessons, reverse_keep_videos_in_final_lessons),
    ]
