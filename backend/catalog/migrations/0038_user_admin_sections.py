from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0037_expert_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='NormalUser',
            fields=[],
            options={
                'verbose_name': 'Normal user',
                'verbose_name_plural': 'Normal users',
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=(settings.AUTH_USER_MODEL,),
        ),
        migrations.CreateModel(
            name='StaffUser',
            fields=[],
            options={
                'verbose_name': 'Staff user',
                'verbose_name_plural': 'Staff users',
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=(settings.AUTH_USER_MODEL,),
        ),
        migrations.CreateModel(
            name='ExpertUser',
            fields=[],
            options={
                'verbose_name': 'Expert user',
                'verbose_name_plural': 'Expert users',
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=(settings.AUTH_USER_MODEL,),
        ),
    ]
