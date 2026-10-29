from django.db import migrations


def copy_lesson_descriptions(apps, schema_editor):
    Lesson = apps.get_model('catalog', 'Lesson')
    for lesson in Lesson.objects.all():
        if lesson.description and not lesson.content:
            lesson.content = lesson.description
            lesson.save(update_fields=['content'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0042_tuner_instrument_text'),
    ]

    operations = [
        migrations.RunPython(copy_lesson_descriptions, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='lesson',
            name='description',
        ),
    ]
