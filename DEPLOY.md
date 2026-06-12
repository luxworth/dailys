# dailys — Final Gaps & Deployment Guide

This guide closes the remaining **manual** steps after the production-gaps implementation. The codebase is staging-ready (41 backend tests, typecheck clean, Docker smoke passing). What remains is credentials, cloud resources, cron, and store builds.

---

## Current state

| Area | Status |
|------|--------|
| Backend API (auth, challenges, submissions, feed, squads, history, reactions) | Done |
| InteractionMeta (haptics/audio) | Done |
| Squad week elimination (`close-week` cron) | Done |
| S3 storage abstraction | Done (wire credentials) |
| AI verification provider shell | Done (auto-accept until OpenAI wired) |
| Sentry (mobile + backend) | Done (wire DSNs) |
| EAS config + bundle IDs (`com.dailys.app`) | Done (run `eas init`) |
| Docker compose (healthchecks, restart) | Done |

---

## Final gaps checklist

Use this as a launch checklist. Order matters for staging → production.

### Backend

- [ ] Generate secrets: `JWT_SECRET` (≥32 chars), `INTERNAL_API_KEY` (≥32 chars)
- [ ] Set `ENVIRONMENT=staging` or `production` (never duplicate the key in `.env`)
- [ ] Set `CORS_ORIGINS` to explicit origins (no `*` outside dev)
- [ ] Set `PUBLIC_BASE_URL` to your public API URL (HTTPS)
- [ ] Choose storage: `local` (single-node Docker) or `s3` (recommended for production)
- [ ] If S3: create bucket, IAM user, `S3_PUBLIC_BASE_URL` (CloudFront or bucket URL)
- [ ] Deploy API + Postgres (Docker or managed DB)
- [ ] Run migrations (automatic via Docker entrypoint)
- [ ] Schedule daily challenge release cron
- [ ] Schedule weekly squad `close-week` cron
- [ ] Optional: `SENTRY_DSN` for backend errors

### Mobile

- [ ] Set `EXPO_PUBLIC_API_URL` to production API (HTTPS, no trailing slash)
- [ ] Optional: `EXPO_PUBLIC_SENTRY_DSN`
- [ ] Run `npx eas init` → set `EXPO_PUBLIC_EAS_PROJECT_ID`
- [ ] `eas build --profile preview` (internal TestFlight/APK)
- [ ] `eas build --profile production` + `eas submit` (store)
- [ ] Rename `com.dailys.app` in `app.config.ts` if you own a different bundle ID

### Post-deploy smoke

- [ ] `curl https://api.example.com/health` → `{"status":"ok"}`
- [ ] `curl https://api.example.com/ready` → 200
- [ ] Register account on device → today's challenge loads
- [ ] Submit NUMBER proof → interaction fires
- [ ] Upload IMAGE proof → URL loads in feed
- [ ] Release challenge via internal route → new task appears

---

## 1. Generate secrets

```bash
# JWT secret (32+ random bytes, base64)
openssl rand -base64 48

# Internal API key (cron / admin routes)
openssl rand -base64 32
```

Store these in a password manager. Never commit them to git.

---

## 2. Backend — staging with Docker (fastest path)

### 2.1 Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` — **one value per key** (no duplicate `ENVIRONMENT` lines):

```env
DATABASE_URL=postgresql+asyncpg://dailys:dailys@localhost:5432/dailys
ENVIRONMENT=staging
JWT_SECRET=<your-48-char-random-secret>
INTERNAL_API_KEY=<your-internal-key>
CORS_ORIGINS=http://localhost:8081,https://your-staging-api.example.com
PUBLIC_BASE_URL=https://your-staging-api.example.com
STORAGE_BACKEND=local
LOG_LEVEL=INFO
```

Notes:

- Docker Compose **overrides** `DATABASE_URL` inside the `api` container to `...@postgres:5432/dailys`. The value in `.env` is for local `uvicorn` runs.
- `INTERNAL_API_KEY` is required when `ENVIRONMENT` is `staging` or `production`.
- `CORS_ORIGINS` must not contain `*` in staging/production.

### 2.2 Build and start

```bash
docker compose up -d --build
```

Wait for healthy containers:

```bash
docker compose ps
# api and postgres should show (healthy)
```

### 2.3 Verify

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

Expected: `{"status":"ok"}` and HTTP 200 on `/ready`.

### 2.4 Release today's challenge

```bash
export INTERNAL_API_KEY=<your-internal-key>
curl -X POST http://localhost:8000/api/v1/internal/challenges/release \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
```

### 2.5 Expose to the internet (staging)

Docker alone binds to localhost. For a phone on another network you need one of:

| Option | Notes |
|--------|-------|
| **Reverse proxy** (nginx, Caddy, Traefik) | TLS termination, forward to `:8000` |
| **Cloud VM** (Fly.io, Railway, EC2, etc.) | Run `docker compose` or push the image |
| **Tunnel** (ngrok, Cloudflare Tunnel) | Quick staging only |

Set `PUBLIC_BASE_URL` and `CORS_ORIGINS` to the **public HTTPS URL** clients will use.

---

## 3. Backend — production recommendations

### 3.1 Managed PostgreSQL

Replace the compose `postgres` service with a managed instance (RDS, Supabase, Neon, etc.):

```env
DATABASE_URL=postgresql+asyncpg://user:pass@your-db-host:5432/dailys
ENVIRONMENT=production
```

Run the API container (or process) with this URL. Run migrations once:

```bash
alembic upgrade head
```

### 3.2 AWS S3 for image uploads

**Why:** Local `uploads_data` volume does not scale across multiple API replicas and is lost if the volume is deleted.

**Configure:**

```env
STORAGE_BACKEND=s3
S3_BUCKET=dailys-uploads-prod
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=<iam-access-key>
AWS_SECRET_ACCESS_KEY=<iam-secret>
S3_PUBLIC_BASE_URL=https://d1234.cloudfront.net
PUBLIC_BASE_URL=https://api.your-app.example.com
```

**IAM policy (minimal):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::dailys-uploads-prod/*"
    }
  ]
}
```

**Public read:** Either:

- CloudFront distribution in front of the bucket (recommended), or
- Bucket policy allowing `s3:GetObject` on `arn:aws:s3:::dailys-uploads-prod/*`

When `STORAGE_BACKEND=s3`, the API **does not** serve `/uploads` statically — clients use the S3/CloudFront URL returned by `POST /api/v1/uploads`.

**Smoke test:**

```bash
# After auth, upload via app or:
curl -X POST https://api.your-app.example.com/api/v1/uploads \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@proof.jpg"
# Open returned image_url in browser
```

### 3.3 Sentry (backend)

```env
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

Errors in unhandled exceptions are reported automatically when DSN is set.

### 3.4 AI verification (optional, later)

Default: auto-accept (`AI_VERIFICATION_ENABLED=false`).

To enable the provider shell:

```env
AI_VERIFICATION_ENABLED=true
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Today the OpenAI provider is a **shell** (auto-accepts with `mode: openai_shell`). Real vision/text checks are a follow-up implementation.

---

## 4. Cron jobs (required for live product)

Internal routes require `X-Internal-Key: $INTERNAL_API_KEY`.

### Daily — release challenge

Release a new global task once per day (pick a consistent UTC time, e.g. 00:05 UTC):

```bash
curl -X POST https://api.your-app.example.com/api/v1/internal/challenges/release \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
```

**Scheduler examples:**

| Platform | Approach |
|----------|----------|
| GitHub Actions | Scheduled workflow with secret `INTERNAL_API_KEY` |
| cron (Linux) | `5 0 * * * curl ...` |
| AWS EventBridge | Lambda or HTTP target |
| Fly.io / Railway | Cron service |

### Weekly — squad elimination

Close squad weeks and eliminate the lowest weekly performer (Sunday 23:59 UTC recommended):

```bash
curl -X POST https://api.your-app.example.com/api/v1/internal/squads/close-week \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
```

Response shape:

```json
{
  "squads_processed": 3,
  "eliminations": [
    { "squad_id": "...", "user_id": "..." }
  ]
}
```

Requires 2+ ACTIVE members per squad; skipped otherwise.

---

## 5. Mobile — connect to API

### 5.1 Environment

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_API_URL=https://api.your-app.example.com
EXPO_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
EXPO_PUBLIC_EAS_PROJECT_ID=<from eas init>
```

| Target | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Physical device (LAN) | `http://<your-pc-lan-ip>:8000` |
| Staging / production | `https://api.your-app.example.com` |

No trailing slash.

### 5.2 Local dev

```bash
npm install
npm start
```

### 5.3 EAS — internal build (TestFlight / APK)

Prerequisites: [Expo account](https://expo.dev), EAS CLI:

```bash
npm install -g eas-cli
eas login
npx eas init
```

Copy the project ID into `.env` as `EXPO_PUBLIC_EAS_PROJECT_ID`.

Build:

```bash
# iOS TestFlight / Android internal APK
eas build --profile preview --platform all

# Development client (simulator)
eas build --profile development --platform ios
```

Install the build on test devices. Point `EXPO_PUBLIC_API_URL` at your staging API before building (env is baked at build time for `EXPO_PUBLIC_*` vars).

### 5.4 Store release

1. Confirm bundle IDs in `app.config.ts` (`com.dailys.app` or your own).
2. Production build:

```bash
eas build --profile production --platform all
```

3. Submit:

```bash
eas submit --platform ios
eas submit --platform android
```

4. App Store / Play Console: privacy policy, screenshots, age rating, camera/photo usage descriptions (already in `app.config.ts`).

---

## 6. Staging vs production matrix

| Setting | Dev | Staging | Production |
|---------|-----|---------|------------|
| `ENVIRONMENT` | `dev` | `staging` | `production` |
| `JWT_SECRET` | any | ≥32 chars, random | ≥32 chars, random |
| `INTERNAL_API_KEY` | optional | required | required |
| `CORS_ORIGINS` | `*` OK | explicit list | explicit list |
| `STORAGE_BACKEND` | `local` | `local` or `s3` | `s3` |
| `PUBLIC_BASE_URL` | `http://localhost:8000` | HTTPS API URL | HTTPS API URL |
| Postgres | local Docker | managed or Docker | managed |
| Cron | manual curl | scheduled | scheduled |
| Sentry | off | optional | recommended |
| Mobile API URL | localhost / LAN | staging HTTPS | production HTTPS |

---

## 7. Verification commands

Run after every deploy:

```bash
# Backend unit tests (local)
cd backend && pytest -v

# Mobile types
cd .. && npm run typecheck

# Live health (replace host)
curl -s https://api.your-app.example.com/health
curl -s -o /dev/null -w "%{http_code}" https://api.your-app.example.com/ready

# Startup guard (should fail)
ENVIRONMENT=production JWT_SECRET=short python -c "from app.startup import validate_settings; validate_settings()"

# Docker (local)
cd backend && docker compose ps
```

**Manual app flow:**

1. Register → login persists (SecureStore)
2. Today screen loads task + countdown
3. Submit proof → haptic/sound (InteractionMeta)
4. Feed unlocks after SUCCESS
5. Squads: create/join, leaderboard shows `today_status`
6. Ghost deploy (if tokens granted) → interaction fires

---

## 8. Troubleshooting

### Docker API keeps restarting: `exec ./scripts/entrypoint.sh: no such file or directory`

Windows CRLF line endings on `scripts/entrypoint.sh`. The Dockerfile strips `\r` on build. Rebuild:

```bash
docker compose build --no-cache api
docker compose up -d api
```

### Mobile cannot reach API

- Physical device cannot use `localhost` — use LAN IP or public URL.
- Android emulator uses `10.0.2.2` for host machine.
- Check `CORS_ORIGINS` includes your Expo web origin if using web.
- Confirm TLS certificate is valid for HTTPS.

### IMAGE submission fails with `INVALID_IMAGE_URL`

Submissions require `image_url` to match the configured storage prefix for the current user. Upload via `POST /api/v1/uploads` first; do not paste external URLs.

### Internal route returns 403

Set `X-Internal-Key` header to match `INTERNAL_API_KEY` in `.env`. In dev with empty key, header is optional; in staging/production it is required.

### Challenge never updates

Cron for `POST /api/v1/internal/challenges/release` is not scheduled. Release manually until cron is live.

### Squad members never eliminated

Cron for `POST /api/v1/internal/squads/close-week` is not scheduled. Needs 2+ ACTIVE members and weekly SUCCESS counts to pick a loser.

---

## 9. Suggested rollout order

```mermaid
flowchart TD
  secrets[Generate secrets]
  backend_env[Configure backend .env]
  docker[Docker compose up]
  health[Health + ready checks]
  release[Manual challenge release]
  mobile_env[Configure mobile .env]
  device_test[Test on device]
  s3[Enable S3 + CloudFront]
  cron[Schedule crons]
  sentry[Enable Sentry DSNs]
  eas_preview[EAS preview build]
  eas_prod[EAS production + submit]

  secrets --> backend_env --> docker --> health --> release
  release --> mobile_env --> device_test
  device_test --> s3 --> cron --> sentry --> eas_preview --> eas_prod
```

1. **Day 1 — Staging:** secrets, Docker, health, manual release, mobile pointed at staging API.
2. **Day 2 — Hardening:** S3, cron, Sentry, HTTPS on public URL.
3. **Day 3 — Beta:** EAS preview, TestFlight/internal testers.
4. **Day 4+ — Store:** production env, `eas build --profile production`, submit.

---

## 10. File reference

| File | Purpose |
|------|---------|
| `backend/.env.example` | All backend env vars with comments |
| `backend/docker-compose.yml` | Postgres + API with healthchecks |
| `backend/Dockerfile` | API image build |
| `.env.example` | Mobile `EXPO_PUBLIC_*` vars |
| `eas.json` | EAS build profiles |
| `app.config.ts` | Bundle IDs, Sentry plugin, permissions |
| `backend/README.md` | API details, InteractionMeta, storage |
| `README.md` | Quick start |

---

## Quick copy-paste: staging `.env` template

**`backend/.env`:**

```env
ENVIRONMENT=staging
JWT_SECRET=REPLACE_WITH_openssl_rand_base64_48
INTERNAL_API_KEY=REPLACE_WITH_openssl_rand_base64_32
CORS_ORIGINS=https://api.staging.example.com,http://localhost:8081
PUBLIC_BASE_URL=https://api.staging.example.com
DATABASE_URL=postgresql+asyncpg://dailys:dailys@localhost:5432/dailys
STORAGE_BACKEND=local
AI_VERIFICATION_ENABLED=false
AI_PROVIDER=none
LOG_LEVEL=INFO
```

**`.env` (mobile):**

```env
EXPO_PUBLIC_API_URL=https://api.staging.example.com
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_EAS_PROJECT_ID=
```

After filling secrets: `cd backend && docker compose up -d --build`, then release the first challenge and open the app.
