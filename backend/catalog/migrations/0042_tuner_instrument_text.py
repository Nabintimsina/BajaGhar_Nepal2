from django.db import migrations, models


def copy_instrument_names(apps, schema_editor):
    TunerConfiguration = apps.get_model('catalog', 'TunerConfiguration')
    for config in TunerConfiguration.objects.select_related('instrument').all():
        config.instrument_name = config.instrument.name
        config.save(update_fields=['instrument_name'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0041_remove_category_and_course_instrument'),
    ]

    operations = [
        migrations.AddField(
            model_name='tunerconfiguration',
            name='instrument_name',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.RunPython(copy_instrument_names, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='tunerconfiguration',
            name='instrument',
        ),
        migrations.RenameField(
            model_name='tunerconfiguration',
            old_name='instrument_name',
            new_name='instrument',
        ),
        migrations.AlterField(
            model_name='tunerconfiguration',
            name='instrument',
            field=models.CharField(max_length=150),
        ),
    ]
