#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"

POSTGRES_CONTAINER_NAME="sons-of-man-pg"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="sons_of_man"

API_PORT="${PORT:-3000}"
WEB_PORT="8000"

cleanup() {
  echo
  echo "Stopping local services..."
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  echo "Done."
}

trap cleanup EXIT INT TERM

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
}

echo "Checking required tools..."
require_cmd docker
require_cmd node
require_cmd npm
require_cmd python3

if [[ ! -d "$SERVER_DIR" ]]; then
  echo "Server directory not found at $SERVER_DIR"
  exit 1
fi

ENV_FILE="$SERVER_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Create it first with at least:"
  echo "  ETHERSCAN_API_KEY=..."
  echo "  BLOCKFROST_PROJECT_ID=..."
  echo "  BLOCKFROST_PREVIEW_PROJECT_ID=..."
  exit 1
fi

echo "Loading environment from $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

export DATABASE_URL="${DATABASE_URL:-postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB}"
export CORS_ORIGIN="${CORS_ORIGIN:-*}"
export PORT="${PORT:-$API_PORT}"

container_running="$(docker ps --filter "name=^/${POSTGRES_CONTAINER_NAME}$" --format "{{.Names}}")"
container_exists="$(docker ps -a --filter "name=^/${POSTGRES_CONTAINER_NAME}$" --format "{{.Names}}")"

if [[ "$container_running" == "$POSTGRES_CONTAINER_NAME" ]]; then
  echo "Postgres container is already running."
elif [[ "$container_exists" == "$POSTGRES_CONTAINER_NAME" ]]; then
  echo "Starting existing Postgres container..."
  docker start "$POSTGRES_CONTAINER_NAME" >/dev/null
else
  echo "Creating Postgres container..."
  docker run --name "$POSTGRES_CONTAINER_NAME" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "$POSTGRES_PORT:5432" \
    -d postgres:16 >/dev/null
fi

echo "Waiting for Postgres to be ready..."
for attempt in {1..30}; do
  if docker exec "$POSTGRES_CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi
  if [[ "$attempt" -eq 30 ]]; then
    echo "Postgres did not become ready in time."
    exit 1
  fi
  sleep 1
done

cd "$SERVER_DIR"
if [[ ! -d node_modules ]]; then
  echo "Installing server dependencies..."
  npm install
fi

echo "Running database migration..."
npm run migrate

echo "Starting API server on http://localhost:$PORT ..."
node index.js &
API_PID=$!

cd "$ROOT_DIR"
echo "Starting frontend server on http://localhost:$WEB_PORT ..."
python3 -m http.server "$WEB_PORT" >/dev/null 2>&1 &
WEB_PID=$!

echo
echo "Local environment is running:"
echo "- API:      http://localhost:$PORT/health"
echo "- Frontend: http://localhost:$WEB_PORT/index.html"
echo "- Log Page: http://localhost:$WEB_PORT/log.html"
echo
echo "Press Ctrl+C to stop both servers."

wait "$API_PID" "$WEB_PID"
