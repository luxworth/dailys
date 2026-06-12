from app.config import Settings, get_settings
from app.services.verification_providers.auto_accept import AutoAcceptProvider
from app.services.verification_providers.base import VerificationProvider
from app.services.verification_providers.openai_provider import OpenAIProvider


def get_verification_provider(settings: Settings | None = None) -> VerificationProvider:
    resolved = settings or get_settings()

    if not resolved.ai_verification_enabled:
        return AutoAcceptProvider()

    if resolved.ai_provider == "none" or not resolved.openai_api_key:
        return AutoAcceptProvider()

    if resolved.ai_provider == "openai":
        return OpenAIProvider(resolved.openai_api_key, resolved.openai_model)

    return AutoAcceptProvider()
