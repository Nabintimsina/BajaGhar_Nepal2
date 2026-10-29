import os


os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    os.environ.get('DJANGO_SETTINGS_MODULE', 'nepali_platform.settings_production'),
)

import django

django.setup()

from django.contrib.auth import get_user_model


def main() -> None:
    user_model = get_user_model()
    username = 'admin'
    password = 'admin123'

    try:
        user = user_model.objects.get(username=username)
    except user_model.DoesNotExist:
        raise SystemExit(f"Admin user '{username}' was not found.")

    if not user.is_superuser:
        raise SystemExit(f"User '{username}' is not a superuser.")

    user.set_password(password)
    user.save(update_fields=['password'])
    print(f"Password changed successfully for admin '{username}'.")


if __name__ == '__main__':
    main()
