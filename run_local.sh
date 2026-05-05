#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
NODE_MIN_MAJOR="18"

CLI_POSTGRES_PORT=""
CLI_API_PORT=""
CLI_WEB_PORT=""
CLI_SKIP_POSTGRES=""
CLI_USE_EXISTING_POSTGRES=""
CLI_SKIP_MIGRATION=""
CLI_SKIP_FRONTEND=""

usage() {
  cat <<'EOF'
Usage: bash run_local.sh [options]

Options:
  --skip-postgres          Do not start Docker Postgres and do not run migrations.
                           Use this for frontend/API work that does not need the oath log DB.
  --use-existing-postgres  Do not start Docker Postgres, but run migrations against DATABASE_URL.
  --skip-migration         Start services without running npm run migrate.
  --skip-frontend          Start the API without starting the static frontend server.
  --postgres-port PORT     Host port to use when creating a new Docker Postgres container.
  --api-port PORT          Host port for the API server.
  --web-port PORT          Host port for the static frontend server.
  -h, --help               Show this help text.

Environment overrides:
  POSTGRES_CONTAINER_NAME, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
  SKIP_POSTGRES=1, USE_EXISTING_POSTGRES=1, SKIP_MIGRATION=1, SKIP_FRONTEND=1
  PORT, WEB_PORT, DATABASE_URL, CORS_ORIGIN
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-postgres|--no-postgres)
      CLI_SKIP_POSTGRES="1"
      shift
      ;;
    --use-existing-postgres)
      CLI_USE_EXISTING_POSTGRES="1"
      shift
      ;;
    --skip-migration|--no-migrate)
      CLI_SKIP_MIGRATION="1"
      shift
      ;;
    --skip-frontend|--no-frontend)
      CLI_SKIP_FRONTEND="1"
      shift
      ;;
    --postgres-port)
      if [[ $# -lt 2 || -z "$2" ]]; then
        echo "Missing value for --postgres-port"
        exit 1
      fi
      CLI_POSTGRES_PORT="$2"
      shift 2
      ;;
    --api-port)
      if [[ $# -lt 2 || -z "$2" ]]; then
        echo "Missing value for --api-port"
        exit 1
      fi
      CLI_API_PORT="$2"
      shift 2
      ;;
    --web-port)
      if [[ $# -lt 2 || -z "$2" ]]; then
        echo "Missing value for --web-port"
        exit 1
      fi
      CLI_WEB_PORT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo
      usage
      exit 1
      ;;
  esac
done

cleanup() {
  if [[ "${CLEANED_UP:-0}" == "1" ]]; then
    return
  fi
  CLEANED_UP="1"

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

ensure_node_version() {
  require_cmd node

  local major
  major="$(node -p "Number(process.versions.node.split('.')[0])")"
  if (( major >= NODE_MIN_MAJOR )); then
    return
  fi

  if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # Make nvm available in this non-interactive shell.
    # shellcheck source=/dev/null
    set +e
    set +u
    source "$NVM_DIR/nvm.sh"
    set -e
    set -u
    if command -v nvm >/dev/null 2>&1; then
      echo "Node $(node --version) is too old; trying 'nvm use node'..."
      set +e
      if nvm use node >/dev/null 2>&1; then
        major="$(node -p "Number(process.versions.node.split('.')[0])")"
      fi
      set -e
    fi
  fi

  if (( major < NODE_MIN_MAJOR )); then
    echo "Node $(node --version) is too old. Please run 'nvm use node' or install Node $NODE_MIN_MAJOR+."
    exit 1
  fi
}

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

POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-sons-of-man-pg}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-sons_of_man}"

if [[ -n "$CLI_POSTGRES_PORT" ]]; then
  POSTGRES_PORT="$CLI_POSTGRES_PORT"
fi

API_PORT="${PORT:-3000}"
if [[ -n "$CLI_API_PORT" ]]; then
  API_PORT="$CLI_API_PORT"
fi
WEB_PORT="${WEB_PORT:-8000}"
if [[ -n "$CLI_WEB_PORT" ]]; then
  WEB_PORT="$CLI_WEB_PORT"
fi

SKIP_POSTGRES="${SKIP_POSTGRES:-0}"
USE_EXISTING_POSTGRES="${USE_EXISTING_POSTGRES:-0}"
SKIP_MIGRATION="${SKIP_MIGRATION:-0}"
SKIP_FRONTEND="${SKIP_FRONTEND:-0}"

if [[ -n "$CLI_SKIP_POSTGRES" ]]; then
  SKIP_POSTGRES="$CLI_SKIP_POSTGRES"
fi
if [[ -n "$CLI_USE_EXISTING_POSTGRES" ]]; then
  USE_EXISTING_POSTGRES="$CLI_USE_EXISTING_POSTGRES"
fi
if [[ -n "$CLI_SKIP_MIGRATION" ]]; then
  SKIP_MIGRATION="$CLI_SKIP_MIGRATION"
fi
if [[ -n "$CLI_SKIP_FRONTEND" ]]; then
  SKIP_FRONTEND="$CLI_SKIP_FRONTEND"
fi

MANAGE_POSTGRES="1"
RUN_MIGRATION="1"
START_FRONTEND="1"
if [[ "$SKIP_POSTGRES" == "1" || "$SKIP_POSTGRES" == "true" ]]; then
  MANAGE_POSTGRES="0"
  RUN_MIGRATION="0"
elif [[ "$USE_EXISTING_POSTGRES" == "1" || "$USE_EXISTING_POSTGRES" == "true" ]]; then
  MANAGE_POSTGRES="0"
fi
if [[ "$SKIP_MIGRATION" == "1" || "$SKIP_MIGRATION" == "true" ]]; then
  RUN_MIGRATION="0"
fi
if [[ "$SKIP_FRONTEND" == "1" || "$SKIP_FRONTEND" == "true" ]]; then
  START_FRONTEND="0"
fi

export DATABASE_URL="${DATABASE_URL:-postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB}"
export CORS_ORIGIN="${CORS_ORIGIN:-*}"
export PORT="$API_PORT"

echo "Checking required tools..."
if [[ "$MANAGE_POSTGRES" == "1" ]]; then
  require_cmd docker
fi
ensure_node_version
require_cmd npm
require_cmd python3

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    [[ -n "$(ss -H -ltn "sport = :$port" 2>/dev/null)" ]]
  else
    return 1
  fi
}

explain_postgres_port_conflict() {
  cat <<EOF
Host port $POSTGRES_PORT is already in use, so Docker cannot start $POSTGRES_CONTAINER_NAME.

Options:
  bash run_local.sh --skip-postgres
    Start the API/frontend without local Postgres or migrations.

  bash run_local.sh --use-existing-postgres
    Use the Postgres already listening at DATABASE_URL and still run migrations.

  POSTGRES_PORT=5433 POSTGRES_CONTAINER_NAME=sons-of-man-pg-5433 bash run_local.sh
    Create a separate local Postgres container on a different host port.
EOF
}

if [[ "$MANAGE_POSTGRES" == "1" ]]; then
  container_running="$(docker ps --filter "name=^/${POSTGRES_CONTAINER_NAME}$" --format "{{.Names}}")"
  container_exists="$(docker ps -a --filter "name=^/${POSTGRES_CONTAINER_NAME}$" --format "{{.Names}}")"

  if [[ "$container_running" == "$POSTGRES_CONTAINER_NAME" ]]; then
    echo "Postgres container is already running."
  elif port_in_use "$POSTGRES_PORT"; then
    explain_postgres_port_conflict
    exit 1
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
else
  echo "Skipping Docker Postgres management."
fi

cd "$SERVER_DIR"
if [[ ! -d node_modules ]]; then
  echo "Installing server dependencies..."
  npm install
fi

if [[ "$RUN_MIGRATION" == "1" ]]; then
  echo "Running database migration..."
  npm run migrate
else
  echo "Skipping database migration."
fi

echo "Starting API server on http://localhost:$PORT ..."
if port_in_use "$PORT"; then
  echo "API port $PORT is already in use. Set PORT to another value or stop the existing server."
  exit 1
fi
node index.js &
API_PID=$!

cd "$ROOT_DIR"
if [[ "$START_FRONTEND" == "1" ]]; then
  if port_in_use "$WEB_PORT"; then
    echo "Frontend port $WEB_PORT is already in use; reusing the existing server."
    START_FRONTEND="0"
  else
    WEB_APP_DIR="$ROOT_DIR/web"
    if [[ ! -d "$WEB_APP_DIR" ]]; then
      echo "Missing React app at $WEB_APP_DIR"
      START_FRONTEND="0"
    else
      cd "$WEB_APP_DIR"
      if [[ ! -d node_modules ]]; then
        echo "Installing frontend dependencies..."
        npm install
      fi
      node scripts/patch-libsodium.cjs
      echo "Starting React dev server on http://localhost:$WEB_PORT ..."
      PORT="$WEB_PORT" BROWSER=none npm start &
      WEB_PID=$!
      cd "$ROOT_DIR"
    fi
  fi
else
  echo "Skipping frontend server."
fi

echo
echo "Local environment is running:"
echo "- API:      http://localhost:$PORT/health"
if [[ "$START_FRONTEND" == "1" ]] || port_in_use "$WEB_PORT"; then
  echo "- Frontend: http://localhost:$WEB_PORT/"
  echo "- Ceremony: http://localhost:$WEB_PORT/ceremony"
  echo "- Log:      http://localhost:$WEB_PORT/log"
fi
echo
echo "Press Ctrl+C to stop both servers."

if [[ -n "${WEB_PID:-}" ]]; then
  wait "$API_PID" "$WEB_PID"
else
  wait "$API_PID"
fi
