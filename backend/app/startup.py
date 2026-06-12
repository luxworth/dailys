import logging
import sys

from app.config import DEFAULT_JWT_SECRET, get_settings

logger = logging.getLogger("dailys.startup")


def configure_logging() -> None:
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
        force=True,
    )


def validate_settings() -> None:
    settings = get_settings()

    if settings.environment == "dev":
        logger.info(
            "Starting in dev mode (environment=%s, cors=%s)",
            settings.environment,
            settings.cors_origins,
        )
        return

    errors: list[str] = []

    if settings.jwt_secret == DEFAULT_JWT_SECRET or len(settings.jwt_secret) < 32:
        errors.append("JWT_SECRET must be set to a random string of at least 32 characters.")

    if not settings.internal_api_key:
        errors.append("INTERNAL_API_KEY is required in staging/production.")

    if "*" in settings.cors_origins:
        errors.append("CORS_ORIGINS must not contain '*' in staging/production.")

    if errors:
        for message in errors:
            logger.error(message)
        raise SystemExit(1)

    logger.info(
        "Starting in %s mode (cors_origins=%s, upload_dir=%s)",
        settings.environment,
        settings.cors_origins,
        settings.upload_dir,
    )


def run_startup_checks() -> None:
    configure_logging()
    validate_settings()
