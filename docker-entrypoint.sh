#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema server/schema.prisma

echo "Starting Tunidex..."
exec "$@"
