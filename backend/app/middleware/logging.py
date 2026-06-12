import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("dailys.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()

        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        log_line = (
            f"method={request.method} path={request.url.path} "
            f"status={response.status_code} duration_ms={duration_ms} request_id={request_id}"
        )

        if response.status_code >= 500:
            logger.warning(log_line)
        elif response.status_code in {401, 403, 429}:
            logger.warning(log_line)
        else:
            logger.info(log_line)

        return response
