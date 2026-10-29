from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0039_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='courses/photos/'),
        ),
        migrations.AddField(
            model_name='course',
            name='is_featured',
            field=models.BooleanField(default=False),
        ),
    ]
