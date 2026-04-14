from pathlib import Path
import os
import environ
import dj_database_url
from cryptography.fernet import Fernet

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

DEBUG = env.bool('DEBUG', default=False)

# ─── SECURITY SETTINGS ───────────────────────────────────────────
SECRET_KEY = env('SECRET_KEY', default=None)
if SECRET_KEY is None:
    raise ValueError('SECRET_KEY environment variable not set. Set it in .env file.')

# ─── DATA ENCRYPTION ────────────────────────────────────────────
# Generate or retrieve encryption key for sensitive field encryption
ENCRYPTION_KEY = env('ENCRYPTION_KEY', default=None)
if not ENCRYPTION_KEY:
    if not DEBUG:
        raise ValueError('ENCRYPTION_KEY environment variable not set. Set it in .env file.')
    # Generate test key for development
    try:
        ENCRYPTION_KEY = Fernet.generate_key().decode()
    except Exception:
        # Fallback test key for development
        ENCRYPTION_KEY = 'Eidwc0pF0cBj6qwN0xKyaVKJgEJ6CWjYvWr3_zWmQ2E='
else:
    # Validate Fernet key format
    try:
        Fernet(ENCRYPTION_KEY.encode())
    except Exception:
        raise ValueError('ENCRYPTION_KEY is not a valid Fernet key')

# Generate encryption key: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Add to .env: ENCRYPTION_KEY=your_generated_key_here

if not DEBUG and env.bool('ENFORCE_HTTPS', default=True):
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_PROXY_SSL_HEADER = None


def env_list(name, default):
    value = env(name, default=default)
    if isinstance(value, str):
        return [item.strip() for item in value.split(',') if item.strip()]
    return value


RENDER_EXTERNAL_HOSTNAME = env('RENDER_EXTERNAL_HOSTNAME', default='').strip()

default_allowed_hosts = ['localhost', '127.0.0.1']
if RENDER_EXTERNAL_HOSTNAME:
    default_allowed_hosts.append(RENDER_EXTERNAL_HOSTNAME)

default_trusted_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://0.0.0.0:3001',
]
if RENDER_EXTERNAL_HOSTNAME:
    default_trusted_origins.extend([
        f'https://{RENDER_EXTERNAL_HOSTNAME}',
        f'http://{RENDER_EXTERNAL_HOSTNAME}',
    ])

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', ','.join(default_allowed_hosts))
TRUSTED_ORIGINS = env_list('TRUSTED_ORIGINS', ','.join(default_trusted_origins))
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', ','.join(TRUSTED_ORIGINS))
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', ','.join(TRUSTED_ORIGINS))

# ─── API SECURITY SETTINGS ─────────────────────────────────────
API_SECRET_KEY = env('API_SECRET_KEY', default=SECRET_KEY)
IP_WHITELIST = env_list('IP_WHITELIST', '')  # Leave empty to allow all IPs
ALLOW_ADMIN_IP_ONLY = env.bool('ALLOW_ADMIN_IP_ONLY', default=False)

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'corsheaders',
    'rest_framework',
    'core',
    'chat',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.SecurityHeadersMiddleware',
]

ROOT_URLCONF = 'backend.urls'

# ─── URL CONFIGURATION ──────────────────────────────
APPEND_SLASH = True  # Auto-append trailing slash to URLs

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Database configuration - use PostgreSQL on Render, SQLite locally
import dj_database_url
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': env.db('DATABASE_URL', default=f'sqlite:///{BASE_DIR / "db.sqlite3"}')
    }
AUTH_USER_MODEL = 'core.Student'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # Public by default, views specify requirements
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'TEST_REQUEST_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# ─── JWT CONFIGURATION ──────────────────────────────────────────
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# ─── CORS CONFIGURATION ─────────────────────────────────────────
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

REDIS_URL = env('REDIS_URL', default=None)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [REDIS_URL]},
    } if REDIS_URL else {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Dar_es_Salaam'
USE_I18N = True
USE_TZ = True

# ─── STATIC & MEDIA FILES ──────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/api/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── FILE UPLOAD SECURITY ──────────────────────────────────────
MAX_UPLOAD_SIZE = 5242880  # 5MB
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']
ALLOWED_UPLOAD_EXTENSIONS = sorted(set(ALLOWED_IMAGE_EXTENSIONS + ALLOWED_DOCUMENT_EXTENSIONS))

DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE

# ─── SESSION SECURITY ──────────────────────────────────────────
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# ─── SECURITY HEADERS ──────────────────────────────────────────
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "'unsafe-inline'", "cdn.jsdelivr.net"),
    'style-src': ("'self'", "'unsafe-inline'", "fonts.googleapis.com"),
    'font-src': ("'self'", "fonts.gstatic.com"),
    'img-src': ("'self'", "data:", "https:"),
    'frame-ancestors': ("'none'",),
    'base-uri': ("'self'",),
    'form-action': ("'self'",),
}

X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY_REPORT_ONLY = False

# ─── LOGGING & SECURITY MONITORING ──────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# ─── EMAIL CONFIGURATION ────────────────────────────────────────

EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_TIMEOUT = env.int('EMAIL_TIMEOUT', default=10)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='SPE UDOM Chapter <noreply@speudom.ac.tz>')

placeholder_email_values = {
    '',
    'your-email@gmail.com',
    'your_app_password',
    'your-app-password',
}
email_backend_default = (
    'django.core.mail.backends.smtp.EmailBackend'
    if EMAIL_HOST_USER not in placeholder_email_values and EMAIL_HOST_PASSWORD not in placeholder_email_values
    else 'django.core.mail.backends.dummy.EmailBackend'
)
EMAIL_BACKEND = env('EMAIL_BACKEND', default=email_backend_default)

PASSWORD_RESET_TIMEOUT = 600
PASSWORD_RESET_CONFIRM_URL = env('PASSWORD_RESET_CONFIRM_URL', default='http://localhost:3000/reset-password')

# ─── SENTRY MONITORING (Optional - for production) ──────────────
SENTRY_ENABLED = env.bool('SENTRY_ENABLED', default=False)
if SENTRY_ENABLED:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    sentry_sdk.init(
        dsn=env('SENTRY_DSN', default=''),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
