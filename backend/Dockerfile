FROM python:3.12-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir hatchling

COPY pyproject.toml ./
COPY app ./app

RUN pip wheel --no-cache-dir --wheel-dir /wheels -e .


FROM python:3.12-slim

WORKDIR /app

RUN addgroup --system dailys && adduser --system --ingroup dailys dailys

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
COPY scripts/seed.py ./scripts/seed.py

RUN sed -i 's/\r$//' ./scripts/entrypoint.sh \
    && chmod +x ./scripts/entrypoint.sh \
    && mkdir -p uploads \
    && chown -R dailys:dailys /app

USER dailys

EXPOSE 8000

ENTRYPOINT ["./scripts/entrypoint.sh"]
