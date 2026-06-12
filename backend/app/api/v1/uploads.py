from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.dependencies import get_current_user
from app.models import User
from app.schemas import ErrorResponse, UploadResponse
from app.services.storage import get_storage_backend

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

settings = get_settings()


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> UploadResponse:
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorResponse(
                code="INVALID_FILE_TYPE",
                message="Only JPEG, PNG, and WebP images are allowed.",
            ).model_dump(),
        )

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=ErrorResponse(code="FILE_TOO_LARGE", message="Image must be under 5MB.").model_dump(),
        )

    ext = ALLOWED_CONTENT_TYPES[content_type]
    storage = get_storage_backend()
    image_url = storage.save_image(user.id, data, ext, content_type)
    return UploadResponse(image_url=image_url)
