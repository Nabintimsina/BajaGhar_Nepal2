from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0028_complete_existing_course_metadata'),
    ]

    operations = [
        migrations.DeleteModel(
            name='LearningContent',
        ),
    ]
