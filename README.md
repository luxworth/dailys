# dailys

A minimalist, gamified daily challenge mobile app built with **React Native**, **Expo**, and a **FastAPI** backend.

Every day you receive exactly one global task. Complete it by submitting proof — a photo, number, or text answer — before your local midnight window closes.

## Features

- **Daily Challenge** — Server-issued task with live countdown to `closes_at`
- **Dynamic submissions** — UI adapts to task type: camera/upload, number pad, or text field
- **Feed blindfold** — Global feed unlocks only after you submit today's proof
- **Squads** — Create or join a 5-person squad and compete on streak leaderboards
- **Trace & history** — 30-day activity calendar and proof trace synced from the API
- **Feed reactions** — React to other finishers' proofs (mind blown, laugh, respect)
- **Ghost mode** — Rare tokens to shield a missed day
- **Interaction feedback** — Server-driven haptics and sounds on submissions and ghost deploy

## Tech Stack

**Mobile**
- React Native + Expo SDK 56
- TypeScript, React Navigation
- SecureStore for JWT tokens
- `EXPO_PUBLIC_API_URL` for API base URL

**Backend**
- FastAPI, PostgreSQL, Alembic
- JWT auth, rate limiting, Docker deploy

See [backend/README.md](backend/README.md) for API setup, Docker, and environment variables.

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
docker compose up -d
# or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Release today's challenge:

```bash
curl -X POST http://localhost:8000/api/v1/internal/challenges/release \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
```

### Mobile

```bash
cp .env.example .env
# Set EXPO_PUBLIC_API_URL (localhost, 10.0.2.2 for Android emulator, or LAN IP)
npm install
npm start
```

Use **Expo Go** or a simulator. The app requires a running API and account registration on first launch.

## Project Structure

```
dailys/
├── App.tsx
├── src/
│   ├── api/           # HTTP client, auth, challenges, squads, history, reactions
│   ├── context/       # AuthContext, ChallengeContext
│   ├── screens/       # Daily, Feed, Squads, Trace (History)
│   └── ...
└── backend/           # FastAPI app, migrations, tests, Docker
```

## Production setup

### Backend (staging)

1. `cd backend && cp .env.example .env` — set `ENVIRONMENT=staging`, secrets, and `CORS_ORIGINS`
2. For cloud images: `STORAGE_BACKEND=s3`, bucket creds, and `S3_PUBLIC_BASE_URL`
3. `docker compose up -d --build`
4. Schedule cron: daily challenge release + weekly `close-week` (see [backend/README.md](backend/README.md))

### Mobile

1. `cp .env.example .env` — set `EXPO_PUBLIC_API_URL` to your API
2. Optional: `EXPO_PUBLIC_SENTRY_DSN` for crash reporting
3. `npx eas init` then set `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env`
4. Build: `eas build --profile preview` (requires Expo account)

Bundle IDs: `com.dailys.app` (iOS + Android) — rename in `app.config.ts` before store submission.

See **[DEPLOY.md](DEPLOY.md)** for the full final-gaps checklist, staging/production env templates, S3, cron, EAS, and troubleshooting.

## Task Types

| Type | Example | Submission UI |
|------|---------|---------------|
| `NUMBER` | Count bathroom tiles | Number pad input |
| `IMAGE` | Photo of a dog | Camera or photo library |
| `TEXT` | Gratitude journal entry | Multiline text field |
