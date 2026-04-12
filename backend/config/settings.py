from datetime import timedelta
from pathlib import Path

import os

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="unsafe-dev-secret-key-change-me-1234567890")
DEBUG = config("DJANGO_DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1,testserver", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    "apps.common",
    "apps.accounts",
    "apps.profiles",
    "apps.therapists",
    "apps.appointments",
    "apps.payments",
    "apps.mood",
    "apps.resources",
    "apps.notifications",
    "apps.feedback",
    "apps.patient_records",
    "apps.packages",
    "apps.support",
    "apps.auditlog",
    "apps.communications",
    "apps.ai",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DB_ENGINE = config("DB_ENGINE", default="django.db.backends.sqlite3")
if DB_ENGINE in {"django.db.backends.oracle", "oracle11_backend"}:
    oracle_client_dir = config(
        "ORACLE_CLIENT_LIB_DIR",
        default=r"C:\oraclexe\app\oracle\product\11.2.0\server\bin",
    )
    oracle_config_dir = config(
        "ORACLE_NET_CONFIG_DIR",
        default=str(BASE_DIR / "oracle_network"),
    )
    os.environ.setdefault("TNS_ADMIN", oracle_config_dir)

    try:
        import oracledb

        if not getattr(oracledb, "is_thin_mode", lambda: True)():
            pass
        else:
            oracledb.init_oracle_client(
                lib_dir=oracle_client_dir,
                config_dir=oracle_config_dir,
            )
    except ImportError:
        pass

    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": config("DB_NAME", default="xe"),
            "USER": config("DB_USER", default="manochitta_sathi"),
            "PASSWORD": config("DB_PASSWORD", default="ms"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="1521"),
            "OPTIONS": {},
            "TEST": {
                "USER": config("DB_TEST_USER", default=f"test_{config('DB_USER', default='manochitta_sathi')}"),
                "PASSWORD": config("DB_TEST_PASSWORD", default="manochitta_test"),
                "TBLSPACE": config("DB_TEST_TBLSPACE", default=f"test_{config('DB_USER', default='manochitta_sathi')}"),
                "TBLSPACE_TMP": config(
                    "DB_TEST_TBLSPACE_TMP",
                    default=f"test_{config('DB_USER', default='manochitta_sathi')}_temp",
                ),
            },
        }
    }
elif DB_ENGINE == "django.db.backends.sqlite3":
    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": config("DB_NAME", default=str(BASE_DIR / "db.sqlite3")),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": config("DB_NAME"),
            "USER": config("DB_USER"),
            "PASSWORD": config("DB_PASSWORD"),
            "HOST": config("DB_HOST", default="127.0.0.1"),
            "PORT": config("DB_PORT", default="3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = config("DJANGO_TIME_ZONE", default="Asia/Kathmandu")
USE_I18N = True
USE_TZ = True
APPEND_SLASH = False

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/hour",
        "user": "600/hour",
        "auth": "10/minute",
        "password_reset": "5/hour",
    },
    "DEFAULT_FILTER_BACKENDS": (
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "EXCEPTION_HANDLER": "apps.common.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("JWT_ACCESS_MINUTES", default=30, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_DAYS", default=7, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000",
    cast=Csv(),
)

EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="no-reply@manochittasathi.com")
FRONTEND_BASE_URL = config("FRONTEND_BASE_URL", default="http://localhost:3000")
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")
GOOGLE_REFRESH_TOKEN = config("GOOGLE_REFRESH_TOKEN", default="")
GOOGLE_CALENDAR_ID = config("GOOGLE_CALENDAR_ID", default="")
GOOGLE_MEET_ORGANIZER_EMAIL = config("GOOGLE_MEET_ORGANIZER_EMAIL", default="")
OPENROUTER_API_KEY = config("OPENROUTER_API_KEY", default="")
OPENROUTER_MODEL = config("OPENROUTER_MODEL", default="openai/gpt-3.5-turbo")
KHALTI_SECRET_KEY = config("KHALTI_SECRET_KEY", default="")
KHALTI_PUBLIC_KEY = config("KHALTI_PUBLIC_KEY", default="")
KHALTI_BASE_URL = config("KHALTI_BASE_URL", default="https://dev.khalti.com/api/v2")
KHALTI_WEBSITE_URL = config("KHALTI_WEBSITE_URL", default=FRONTEND_BASE_URL)
KHALTI_RETURN_URL = config("KHALTI_RETURN_URL", default=f"{FRONTEND_BASE_URL}/dashboard/payments/khalti/return")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=not DEBUG, cast=bool)
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=not DEBUG, cast=bool)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=0 if DEBUG else 3600, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
