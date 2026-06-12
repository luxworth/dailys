#!/usr/bin/env bash
# Database setup when PostgreSQL client tools (createdb/psql) are not on PATH.
# Requires: docker compose up -d (from backend/)

set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-backend-postgres-1}"

docker exec "$CONTAINER" psql -U dailys -d postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname='dailys_test'" | grep -q 1 \
  || docker exec "$CONTAINER" psql -U dailys -d postgres -c "CREATE DATABASE dailys_test;"

alembic upgrade head
python scripts/seed.py

echo "Done. Main DB: dailys (created by docker-compose). Test DB: dailys_test."
