from django.db import migrations, models


def populate_course_metadata(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    for course in Course.objects.select_related('instrument').all():
        instrument = course.instrument
        if instrument:
            course.level = 'Beginner'
            course.what_you_will_learn = instrument.description or ''
            course.target_audience = f'Beginners who want to learn {instrument.name} and its musical tradition.'
            course.requirements = f'No previous experience required. A {instrument.name} is helpful for practice.'
        else:
            course.level = 'Beginner'
            course.what_you_will_learn = course.description or 'Build a foundation in Nepali musical traditions.'
            course.target_audience = 'Curious beginners and culture learners.'
            course.requirements = 'No previous experience required.'
        course.save(update_fields=['level', 'what_you_will_learn', 'target_audience', 'requirements'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0026_reorganize_instrument_learning'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='level',
            field=models.CharField(default='Beginner', max_length=80),
        ),
        migrations.AddField(
            model_name='course',
            name='estimated_duration_minutes',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='course',
            name='what_you_will_learn',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='course',
            name='target_audience',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='course',
            name='requirements',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.RunPython(populate_course_metadata, migrations.RunPython.noop),
    ]
