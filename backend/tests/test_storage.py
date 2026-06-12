from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from app.config import get_settings
from app.services.storage import LocalStorageBackend, S3StorageBackend, get_storage_backend, validate_owned_image_url


@pytest.fixture
def fresh_settings(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("PUBLIC_BASE_URL", "http://localhost:8000")
    yield get_settings()
    get_settings.cache_clear()


def test_local_storage_returns_upload_url(tmp_path, fresh_settings):
    fresh_settings.upload_dir = str(tmp_path)
    backend = LocalStorageBackend(fresh_settings)
    user_id = uuid4()

    url = backend.save_image(user_id, b"image-bytes", ".jpg", "image/jpeg")

    assert url.startswith(f"http://localhost:8000/uploads/{user_id}/")
    assert url.endswith(".jpg")
    assert (tmp_path / str(user_id)).exists()


@patch("boto3.client")
def test_s3_storage_put_object(mock_boto_client, fresh_settings, monkeypatch):
    monkeypatch.setenv("STORAGE_BACKEND", "s3")
    monkeypatch.setenv("S3_BUCKET", "dailys-uploads")
    monkeypatch.setenv("S3_REGION", "us-east-1")
    monkeypatch.setenv("S3_PUBLIC_BASE_URL", "https://cdn.example.com")
    get_settings.cache_clear()
    settings = get_settings()

    mock_client = MagicMock()
    mock_boto_client.return_value = mock_client

    backend = S3StorageBackend(settings)
    user_id = uuid4()
    url = backend.save_image(user_id, b"png-bytes", ".png", "image/png")

    mock_client.put_object.assert_called_once()
    call_kwargs = mock_client.put_object.call_args.kwargs
    assert call_kwargs["Bucket"] == "dailys-uploads"
    assert call_kwargs["Key"].startswith(f"{user_id}/")
    assert call_kwargs["Key"].endswith(".png")
    assert url.startswith(f"https://cdn.example.com/{user_id}/")


def test_get_storage_backend_local(fresh_settings):
    backend = get_storage_backend(fresh_settings)
    assert isinstance(backend, LocalStorageBackend)


def test_validate_owned_image_url_accepts_matching_prefix(fresh_settings):
    user_id = uuid4()
    url = f"http://localhost:8000/uploads/{user_id}/file.jpg"
    validate_owned_image_url(url, user_id, fresh_settings)


def test_validate_owned_image_url_rejects_foreign_url(fresh_settings):
    user_id = uuid4()
    with pytest.raises(ValueError):
        validate_owned_image_url("https://example.com/other.jpg", user_id, fresh_settings)
