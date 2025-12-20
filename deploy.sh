#!/usr/bin/env bash
set -euo pipefail

# Deploy RMS to Ubuntu server paths using fixed steps.
# This script is intended to run ON the server.

# Configurable vars (override via environment if needed)
SRC_DIR=${SRC_DIR:-/var/www/RMS}
DEST_DIR=${DEST_DIR:-/var/www/rms}
SERVICE_NAME=${SERVICE_NAME:-rms-backend.service}
NGINX_SERVICE=${NGINX_SERVICE:-nginx.service}
OWNER_USER=${OWNER_USER:-arqam}
OWNER_GROUP=${OWNER_GROUP:-arqam}
WEB_USER=${WEB_USER:-www-data}
WEB_GROUP=${WEB_GROUP:-www-data}

echo "==> Stopping backend service: $SERVICE_NAME"
sudo systemctl stop "$SERVICE_NAME"

echo "==> Navigating to source repo: $SRC_DIR"
cd "$SRC_DIR"

echo "==> Pulling latest from git (origin main -f)"
git pull origin main -f

echo "==> Ensuring destination ownership for sync: $DEST_DIR -> $OWNER_USER:$OWNER_GROUP"
sudo chown "$OWNER_USER":"$OWNER_GROUP" "$DEST_DIR" -R || true

echo "==> Syncing latest changes via rsync"
sudo rsync -av --progress "$SRC_DIR/" "$DEST_DIR/"

echo "==> Installing frontend dependencies"
cd "$DEST_DIR/frontend"
npm install

echo "==> Building frontend"
npm run build

echo "==> Setting web ownership back to $WEB_USER:$WEB_GROUP on $DEST_DIR"
sudo chown "$WEB_USER":"$WEB_GROUP" "$DEST_DIR" -R

echo "==> Starting backend service"
sudo systemctl start "$SERVICE_NAME"

echo "==> Restarting Nginx"
sudo systemctl restart "$NGINX_SERVICE"

echo "==> Deploy complete."
