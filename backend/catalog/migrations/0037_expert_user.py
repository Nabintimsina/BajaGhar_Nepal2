from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0036_keep_videos_in_final_lessons'),
    ]

    operations = [
        migrations.AddField(
            model_name='expert',
            name='user',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='expert_profile',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
