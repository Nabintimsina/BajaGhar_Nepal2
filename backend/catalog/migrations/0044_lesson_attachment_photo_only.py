from django.db import migrations


def copy_lesson_photos(apps, schema_editor):
    Lesson = apps.get_model('catalog', 'Lesson')
    for lesson in Lesson.objects.all():
        if lesson.photo and not lesson.attachment_photo:
            lesson.attachment_photo = lesson.photo.name
            lesson.save(update_fields=['attachment_photo'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0043_lesson_content_only'),
    ]

    operations = [
        migrations.RunPython(copy_lesson_photos, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='lesson',
            name='photo',
        ),
    ]
