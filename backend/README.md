# dailys API (backend)

FastAPI backend for the dailys daily challenge app.

## Quick start (Docker)

```bash
cd backend
cp .env.example .env
# Edit .env for staging/production secrets before deploy
docker compose up -d --build
```

Health checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

Release today's challenge (requires `X-Internal-Key` when `INTERNAL_API_KEY` is set):

```bash
curl -X POST http://localhost:8000/api/v1/internal/challenges/release \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
```

Close squad weeks (weekly cron, Sunday UTC recommended):

```bash
curl -X POST http://localhost:8000/api/v1/internal/squads/close-week \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
```

## Local development

```bash
cd backend
docker compose up -d postgres
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In `dev` mode with an empty `INTERNAL_API_KEY`, internal routes work without the header for local ergonomics. Staging and production require a configured key.

## Environment

| Variable | Description |
|----------|-------------|
| `ENVIRONMENT` | `dev`, `staging`, or `production` |
| `JWT_SECRET` | Min 32 chars required outside dev |
| `INTERNAL_API_KEY` | Required for `/internal/*` outside dev |
| `CORS_ORIGINS` | Comma-separated origins; no `*` in staging/prod |
| `PUBLIC_BASE_URL` | Base URL for uploaded image links (local storage) |
| `DATABASE_URL` | Async Postgres URL (`postgresql+asyncpg://...`) |
| `STORAGE_BACKEND` | `local` (default) or `s3` |
| `S3_BUCKET` | AWS bucket when `STORAGE_BACKEND=s3` |
| `S3_REGION` | AWS region (default `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS secret for S3 uploads |
| `S3_PUBLIC_BASE_URL` | CloudFront or bucket URL for public image links |
| `AI_VERIFICATION_ENABLED` | `false` auto-accepts (default) |
| `AI_PROVIDER` | `none` (default) or `openai` |
| `OPENAI_API_KEY` | Required for OpenAI provider shell |
| `SENTRY_DSN` | Optional backend error reporting |

Startup validation fails fast in staging/production if secrets or CORS are misconfigured.

## API highlights

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/squads` | Create a squad (max 5 members) |
| `POST /api/v1/squads/join` | Join by invite code |
| `GET /api/v1/users/me/squad` | Current squad or `null` |
| `GET /api/v1/squads/{id}/leaderboard` | Squad rankings with today's status |
| `GET /api/v1/users/me/history` | 30-day calendar + proof trace |
| `PUT /api/v1/submissions/{id}/reaction` | Upsert feed reaction |
| `POST /api/v1/submissions` | Submit proof; returns `TransactionalResponse` with haptic/audio meta |
| `POST /api/v1/ghost/deploy` | Deploy ghost shield; returns `TransactionalResponse` |
| `POST /api/v1/internal/squads/close-week` | Weekly elimination cron (internal key) |

## InteractionMeta

Transactional endpoints wrap the primary payload in `{ data, interaction }`. The mobile client plays mapped haptics (`expo-haptics`) and sounds (`expo-av`) from `interaction` — no client-side milestone logic.

### Enums

| HapticType | Client mapping |
|------------|----------------|
| `HEAVY` / `MEDIUM` / `LIGHT` | Impact feedback |
| `SUCCESS_CHIME` | Success notification |
| `FAILURE_BUZZ` | Error notification |

| AudioType | Use case |
|-----------|----------|
| `CALCULATOR_CLICK` | NUMBER task success |
| `ORCHESTRA_CRESCENDO` | 7-day streak milestone |
| `PLASMA_IGNITION` | 30-day streak milestone |
| `MATCH_STRIKE` | Non-NUMBER success, ghost deploy |
| `ERROR_DULL` | Failed verification |

`audio` may be `null` when AI verification is pending (`AI_VERIFICATION_ENABLED=true`).

When `AI_VERIFICATION_ENABLED=false` (default), `POST /submissions` awaits verification synchronously so the client receives final interaction meta immediately.

## Tests

```bash
pytest -v
```

## AI verification

Provider shell via `AI_PROVIDER` (`none` | `openai`). Without `OPENAI_API_KEY`, submissions auto-accept. Set `AI_VERIFICATION_ENABLED=true` for background verification with pending interaction on POST.

## Uploads

**Local (default):** images stored in `UPLOAD_DIR`, served at `{PUBLIC_BASE_URL}/uploads/{user_id}/{file}`.

**S3:** set `STORAGE_BACKEND=s3` and bucket credentials. Objects stored at `{user_id}/{uuid}.ext`; returned URLs use `S3_PUBLIC_BASE_URL` (CloudFront recommended). The `/uploads` static mount is disabled in S3 mode.

Submissions validate that `image_url` belongs to the uploading user.

## Squad elimination

Weekly Mon–Sun UTC windows. `close-week` eliminates the ACTIVE member with the fewest weekly SUCCESS submissions (tie-break: lower streak). Requires 2+ ACTIVE members. Leaderboard exposes `ELIMINATED` status.

## Observability

Set `SENTRY_DSN` to enable backend error reporting via `sentry-sdk`.
