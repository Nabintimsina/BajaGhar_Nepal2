from pathlib import Path
import shutil

from django.conf import settings
from django.core.management.base import BaseCommand

from catalog.models import Lesson


FIELD_TARGETS = {
    'photo': 'lessons/photos',
    'attachment_photo': 'lessons/attachments/photos',
    'attachment_3d_model': 'lessons/attachments/models',
}


class Command(BaseCommand):
    help = 'Copy lesson media into field-specific folders and update database paths.'

    def handle(self, *args, **options):
        media_root = Path(settings.MEDIA_ROOT)
        changed = 0

        for field_name, target_directory in FIELD_TARGETS.items():
            target_root = media_root / target_directory
            target_root.mkdir(parents=True, exist_ok=True)

            for lesson in Lesson.objects.exclude(**{f'{field_name}__isnull': True}).exclude(**{field_name: ''}):
                field = getattr(lesson, field_name)
                source_path = Path(field.path)
                target_name = f'{target_directory}/{source_path.name}'
                target_path = media_root / target_name

                if not source_path.exists():
                    self.stdout.write(self.style.WARNING(f'Missing source: {source_path}'))
                    continue

                if source_path.resolve() != target_path.resolve():
                    if not target_path.exists():
                        shutil.copy2(source_path, target_path)
                    field.name = target_name.replace('\\', '/')
                    lesson.save(update_fields=[field_name])
                    changed += 1
                    self.stdout.write(f'{lesson.pk}: {field_name} -> {field.name}')

        self.stdout.write(self.style.SUCCESS(f'Normalized {changed} lesson media references.'))
