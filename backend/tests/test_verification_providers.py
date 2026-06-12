import pytest

from app.config import get_settings
from app.services.verification_providers.auto_accept import AutoAcceptProvider
from app.services.verification_providers.factory import get_verification_provider
from app.services.verification_providers.openai_provider import OpenAIProvider


@pytest.mark.asyncio
async def test_auto_accept_provider_returns_success():
    provider = AutoAcceptProvider()
    from app.models.enums import TaskType

    status, verdict = await provider.verify(TaskType.NUMBER, "prompt", "42", None, None)
    assert status.value == "SUCCESS"
    assert verdict["mode"] == "auto_accept"


def test_factory_auto_accept_when_ai_disabled(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("AI_VERIFICATION_ENABLED", "false")
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")

    provider = get_verification_provider()
    assert isinstance(provider, AutoAcceptProvider)
    get_settings.cache_clear()


def test_factory_auto_accept_when_provider_none(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("AI_VERIFICATION_ENABLED", "true")
    monkeypatch.setenv("AI_PROVIDER", "none")

    provider = get_verification_provider()
    assert isinstance(provider, AutoAcceptProvider)
    get_settings.cache_clear()


def test_factory_openai_shell_when_key_present(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("AI_VERIFICATION_ENABLED", "true")
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")

    provider = get_verification_provider()
    assert isinstance(provider, OpenAIProvider)
    get_settings.cache_clear()
