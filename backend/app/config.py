from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

DEFAULT_JWT_SECRET = "dev-secret-change-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://dailys:dailys@localhost:5432/dailys"
    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    ai_verification_enabled: bool = False
    ai_provider: Literal["none", "openai"] = "none"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    cors_origins: Annotated[list[str], NoDecode] = ["*"]
    upload_dir: str = "uploads"
    public_base_url: str = "http://localhost:8000"
    max_upload_bytes: int = 5 * 1024 * 1024
    storage_backend: Literal["local", "s3"] = "local"
    s3_bucket: str = ""
    s3_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    s3_public_base_url: str = ""
    environment: Literal["dev", "staging", "production"] = "dev"
    internal_api_key: str = ""
    log_level: str = "INFO"
    sentry_dsn: str = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            stripped = value.strip()
            if stripped == "*":
                return ["*"]
            return [part.strip() for part in stripped.split(",") if part.strip()]
        return value

    @property
    def allow_credentials(self) -> bool:
        return "*" not in self.cors_origins

    @property
    def image_url_base(self) -> str:
        if self.storage_backend == "s3":
            if self.s3_public_base_url:
                return self.s3_public_base_url.rstrip("/")
            if self.s3_bucket:
                return f"https://{self.s3_bucket}.s3.{self.s3_region}.amazonaws.com"
        return self.public_base_url.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
