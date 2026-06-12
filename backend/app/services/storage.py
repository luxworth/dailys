from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from uuid import UUID

from app.config import Settings, get_settings


class StorageBackend(ABC):
    @abstractmethod
    def save_image(self, user_id: UUID, data: bytes, extension: str, content_type: str) -> str:
        """Persist image bytes and return a public HTTPS/HTTP URL."""


class LocalStorageBackend(StorageBackend):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def save_image(self, user_id: UUID, data: bytes, extension: str, content_type: str) -> str:
        user_dir = Path(self._settings.upload_dir) / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4()}{extension}"
        dest = user_dir / filename
        dest.write_bytes(data)
        return f"{self._settings.public_base_url.rstrip('/')}/uploads/{user_id}/{filename}"


class S3StorageBackend(StorageBackend):
    def __init__(self, settings: Settings) -> None:
        import boto3

        if not settings.s3_bucket:
            raise ValueError("S3_BUCKET is required when STORAGE_BACKEND=s3")

        self._settings = settings
        self._client = boto3.client(
            "s3",
            region_name=settings.s3_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )

    def save_image(self, user_id: UUID, data: bytes, extension: str, content_type: str) -> str:
        key = f"{user_id}/{uuid.uuid4()}{extension}"
        self._client.put_object(
            Bucket=self._settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        base = self._settings.image_url_base
        return f"{base}/{key}"


def get_storage_backend(settings: Settings | None = None) -> StorageBackend:
    resolved = settings or get_settings()
    if resolved.storage_backend == "s3":
        return S3StorageBackend(resolved)
    return LocalStorageBackend(resolved)


def validate_owned_image_url(image_url: str, user_id: UUID, settings: Settings | None = None) -> None:
    resolved = settings or get_settings()
    if resolved.storage_backend == "local":
        expected_prefix = f"{resolved.public_base_url.rstrip('/')}/uploads/{user_id}/"
    else:
        expected_prefix = f"{resolved.image_url_base}/{user_id}/"
    if not image_url.startswith(expected_prefix):
        raise ValueError("image_url must reference an upload owned by the current user")
