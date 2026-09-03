from pathlib import Path
import os
from urllib.parse import unquote, urlparse
from datetime import timedelta


BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent


def _load_env_file(env_path: Path) -> None:
    try:
        lines = env_path.read_text(encoding='utf-8').splitlines()
    except OSError:
        return

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = line.split('=', 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]

        os.environ[key] = value


def _selected_env_file() -> Path:
    settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', '')
    if settings_module.endswith('settings_production'):
        return BASE_DIR / '.env.production'
    return BASE_DIR / '.env.local'


_load_env_file(_selected_env_file())


def _env(name: str, default: str = '') -> str:
    value = os.environ.get(name, default)
    return value if value is not None else default


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def _env_int(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None or value.strip() == '':
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _env_list(name: str, default: list[str] | None = None) -> list[str]:
    value = os.environ.get(name)
    if value is None or value.strip() == '':
        return list(default or [])
    return [item.strip() for item in value.split(',') if item.strip()]


def _env_path(name: str, default: str | None = None, base_dir: Path | None = None) -> Path | None:
    value = os.environ.get(name)
    if value is None or value.strip() == '':
        if default is None:
            return None
        value = default

    path = Path(value).expanduser()
    if path.is_absolute():
        return path
    return (base_dir or BASE_DIR) / path


def _database_settings(default_sqlite_name: str = 'db.sqlite3') -> dict[str, dict[str, object]]:
    database_url = os.environ.get('DATABASE_URL', '').strip()
    if database_url:
        parsed = urlparse(database_url)
        scheme = parsed.scheme.lower()

        if scheme in {'sqlite', 'sqlite3'}:
            raw_path = unquote(parsed.path or '').lstrip('/')
            if not raw_path:
                database_name = BASE_DIR / default_sqlite_name
            else:
                database_name = Path(raw_path).expanduser()
                if not database_name.is_absolute():
                    database_name = (BASE_DIR / database_name).resolve()

            return {
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': database_name,
                }
            }

        engine_map = {
            'postgres': 'django.db.backends.postgresql',
            'postgresql': 'django.db.backends.postgresql',
            'postgresql_psycopg2': 'django.db.backends.postgresql',
            'mysql': 'django.db.backends.mysql',
            'sqlite': 'django.db.backends.sqlite3',
            'sqlite3': 'django.db.backends.sqlite3',
        }
        engine = engine_map.get(scheme, scheme)
        database_name = unquote(parsed.path.lstrip('/'))

        return {
            'default': {
                'ENGINE': engine,
                'NAME': database_name,
                'USER': unquote(parsed.username or ''),
                'PASSWORD': unquote(parsed.password or ''),
                'HOST': parsed.hostname or '',
                'PORT': str(parsed.port or ''),
            }
        }

    database_name = os.environ.get('DJANGO_DB_NAME', str(BASE_DIR / default_sqlite_name))
    if database_name and not Path(database_name).is_absolute() and ('/' not in database_name and '\\' not in database_name):
        database_name = str(BASE_DIR / database_name)

    return {
        'default': {
            'ENGINE': os.environ.get('DJANGO_DB_ENGINE', 'django.db.backends.sqlite3'),
            'NAME': database_name,
            'USER': os.environ.get('DJANGO_DB_USER', ''),
            'PASSWORD': os.environ.get('DJANGO_DB_PASSWORD', ''),
            'HOST': os.environ.get('DJANGO_DB_HOST', ''),
            'PORT': os.environ.get('DJANGO_DB_PORT', ''),
        }
    }


# ==================== DJANGO CORE ====================
SECRET_KEY = _env('DJANGO_SECRET_KEY', 'dev-secret-key')
DEBUG = _env_bool('DJANGO_DEBUG', True)
ALLOWED_HOSTS = _env_list('DJANGO_ALLOWED_HOSTS', ['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'axes',
    'catalog',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'axes.middleware.AxesMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nepali_platform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nepali_platform.wsgi.application'

DATABASES = _database_settings()

# ==================== CACHING ====================
# Development: in-memory cache | Production: should be Redis/Memcached (configure on server)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'OPTIONS': {'MAX_ENTRIES': 1000} if DEBUG else {'MAX_ENTRIES': 10000}
    }
}

# ==================== PASSWORD VALIDATION ====================
AUTH_PASSWORD_VALIDATORS = []

# ==================== LANGUAGE & TIMEZONE ====================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kathmandu'
USE_I18N = True
USE_TZ = True

# ==================== STATIC & MEDIA FILES ====================

    # Development
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_SYMLINK_PATH = ''
MEDIA_TARGET_PATH = ''


DEFAULT_FROM_EMAIL = 'noreply@bajanepal.com'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==================== CORS & CSRF ====================
CORS_ALLOWED_ORIGINS = _env_list('CORS_ALLOWED_ORIGINS', ['http://localhost:3000'])
CSRF_TRUSTED_ORIGINS = _env_list('CSRF_TRUSTED_ORIGINS', CORS_ALLOWED_ORIGINS)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with', 'range'
]

# ==================== SECURITY (Dev Defaults / Overridden in settings_production.py) ====================
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Session Security (same for both environments)
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_HTTPONLY = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Security Headers (strict for both environments)
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'", 'https:'),
    'script-src': ("'self'", "'unsafe-inline'", 'https:'),
    'style-src': ("'self'", "'unsafe-inline'", 'https:'),
    'img-src': ("'self'", 'data:', 'https:'),
    'font-src': ("'self'", 'https:'),
    'connect-src': ("'self'", 'https:'),
    'media-src': ("'self'", 'https:'),
    'object-src': ("'none'",),
    'frame-ancestors': ("'none'",),
}
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
PERMISSIONS_POLICY = {'geolocation': '()', 'microphone': '()', 'camera': '()'}

# ==================== RATE LIMITING ====================
# Contact Form (per IP)
CONTACT_FORM_RATE_LIMIT = _env_int('CONTACT_FORM_RATE_LIMIT', 3)
CONTACT_FORM_TIME_WINDOW = _env_int('CONTACT_FORM_TIME_WINDOW', 86400)

# API Throttling
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': _env('REST_FRAMEWORK_ANON_THROTTLE_RATE', '100/hour'),
        'user': _env('REST_FRAMEWORK_USER_THROTTLE_RATE', '1000/hour'),
    },
}

# ==================== AUTHENTICATION & AUTHORIZATION ====================
# JWT Token Security (Rotation & Blacklisting)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=_env_int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 5)),
    'REFRESH_TOKEN_LIFETIME': timedelta(hours=_env_int('JWT_REFRESH_TOKEN_LIFETIME_HOURS', 24)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# Brute Force Protection (django-axes)
AXES_FAILURE_LIMIT = _env_int('AXES_FAILURE_LIMIT', 5)
AXES_COOLOFF_DURATION = _env_int('AXES_COOLOFF_DURATION', 3600)
AXES_LOCK_OUT_AT_FAILURE = True
AXES_RESET_ON_SUCCESS = True
AXES_HANDLER = 'axes.handlers.database.AxesDatabaseHandler'

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]
