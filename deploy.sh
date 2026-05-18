#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "[deploy] Docker n'est pas installe ou n'est pas dans le PATH."
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "[deploy] Fichier .env introuvable dans $PROJECT_DIR."
  exit 1
fi

required_vars=(
  APP_PORT
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  JWT_SECRET
  DEFAULT_ADMIN_EMAIL
  DEFAULT_ADMIN_PASSWORD
  DEFAULT_AGENT_EMAIL
  DEFAULT_AGENT_PASSWORD
)

for var_name in "${required_vars[@]}"; do
  if ! grep -Eq "^${var_name}=" .env; then
    echo "[deploy] Variable manquante dans .env: ${var_name}"
    exit 1
  fi
done

echo "[deploy] Verification de la configuration Docker..."
sudo -n docker compose config >/dev/null

echo "[deploy] Reconstruction et redemarrage des conteneurs..."
sudo -n docker compose up -d --build

echo "[deploy] Etat des services:"
sudo -n docker compose ps

sleep 3

echo "[deploy] Derniers logs de l'application:"
sudo -n docker compose logs --tail=40 app

echo "[deploy] Deploiement termine."
