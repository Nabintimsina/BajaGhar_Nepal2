from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0040_course_photo_and_featured'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='course',
            name='instrument',
        ),
        migrations.RemoveField(
            model_name='instrument',
            name='category',
        ),
        migrations.DeleteModel(
            name='Category',
        ),
    ]
