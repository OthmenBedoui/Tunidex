#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -z "${POSTGRES_DB:-}" ] || [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo "Missing PostgreSQL credentials. Set DATABASE_URL or POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD."
    exit 1
  fi

  ENCODED_USER="$(node -p "encodeURIComponent(process.argv[1])" "$POSTGRES_USER")"
  ENCODED_PASSWORD="$(node -p "encodeURIComponent(process.argv[1])" "$POSTGRES_PASSWORD")"
  ENCODED_DB="$(node -p "encodeURIComponent(process.argv[1])" "$POSTGRES_DB")"
  export DATABASE_URL="postgresql://${ENCODED_USER}:${ENCODED_PASSWORD}@db:5432/${ENCODED_DB}"
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "Missing JWT_SECRET. Set it in the environment before starting the app."
  exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema server/schema.prisma

echo "Starting TuniBots..."
exec "$@"
