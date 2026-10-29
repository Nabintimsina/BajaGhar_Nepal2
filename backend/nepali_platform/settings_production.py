"""Production settings override - minimal, focused on HTTPS and security."""
from .settings import *


# Production Security Settings (overrides settings.py defaults)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


STATIC_URL = '/api/static/'
STATIC_ROOT = Path('/home2/bajanepa/public_html/api/static')
MEDIA_URL = '/api/media/'
MEDIA_ROOT = Path('/home2/bajanepa/public_html/api/media')
MEDIA_SYMLINK_PATH = '/home2/bajanepa/public_html/api/media'
MEDIA_TARGET_PATH = '/home2/bajanepa/bajanepal/backend/media'

# Keep this aligned with the API request limit in public/.htaccess.
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
