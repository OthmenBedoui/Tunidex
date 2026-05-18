# Docker deployment

1. Copy the example env file:

```bash
cp .env.docker.example .env
```

2. Edit `.env` and change at least:

```bash
POSTGRES_PASSWORD=...
JWT_SECRET=...
DEFAULT_ADMIN_EMAIL=admin@tunibots.com
DEFAULT_ADMIN_PASSWORD=...
```

Notes:

- `DATABASE_URL` is generated automatically inside the app container from `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.
- If a secret contains `$`, wrap the value in single quotes inside `.env` so Docker Compose keeps it literal.
- Passwords may contain special characters such as `$` or `@`; the startup script encodes them correctly for Prisma.

3. Build and start:

```bash
docker compose up -d --build
```

Or use the deployment script:

```bash
./deploy.sh
```

The app will be available on:

```bash
http://localhost:3000
```

Prisma migrations run automatically when the app container starts.

Useful commands:

```bash
docker compose logs -f app
docker compose ps
docker compose down
docker compose down -v
```

`docker compose down -v` removes the PostgreSQL volume and deletes database data.
