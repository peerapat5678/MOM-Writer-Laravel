#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-command local setup + start (macOS / Linux).
#   ./scripts/start.sh
# Checks Docker, creates .env, auto-picks a free port, builds and starts.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cyan()   { printf '\033[36m%s\033[0m\n' "$1"; }
green()  { printf '\033[32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
red()    { printf '\033[31m%s\033[0m\n' "$1"; }

if ! docker info >/dev/null 2>&1; then
    red "Docker is not running. Start Docker and re-run this script."
    exit 1
fi

project_arg="${1:-}"

first_run=false
if [ ! -f .env ]; then
    cp .env.example .env
    green "Created .env from .env.example"
    first_run=true
fi

get_env() { grep -E "^$1=" .env | head -1 | sed -E "s/^$1=//" | tr -d '\r' || true; }
set_env() {
    if grep -Eq "^$1=" .env; then
        sed -i.bak -E "s#^$1=.*#$1=$2#" .env && rm -f .env.bak
    else
        printf '%s=%s\n' "$1" "$2" >> .env
    fi
}

# Project name (URL sub-path): first arg wins; otherwise ask on first run.
if [ -n "$project_arg" ]; then
    set_env APP_PROJECT "$project_arg"
elif [ "$first_run" = true ] && [ -t 0 ]; then
    cur="$(get_env APP_PROJECT)"
    printf "Project name / URL sub-path [%s]: " "$cur"
    read -r ans
    [ -n "$ans" ] && set_env APP_PROJECT "$ans"
fi

project="$(get_env APP_PROJECT)"; [ -n "$project" ] || project="app"

port_free() {
    if command -v ss >/dev/null 2>&1; then ! ss -ltn "( sport = :$1 )" 2>/dev/null | grep -q LISTEN
    elif command -v lsof >/dev/null 2>&1; then ! lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
    else ! (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; fi
}
usable_by_us() {
    port_free "$1" && return 0
    docker ps --filter "name=${project}_$2" --format '{{.Ports}}' 2>/dev/null | grep -q ":$1->"
}
resolve_port() {
    local key="$1" fallback="$2" service="$3"
    local port; port="$(get_env "$key")"; [ -n "$port" ] || port="$fallback"
    if usable_by_us "$port" "$service"; then echo "$port"; return; fi
    local orig="$port" c=$((port + 1))
    while [ "$c" -lt $((orig + 100)) ] && ! port_free "$c"; do c=$((c + 1)); done
    if ! port_free "$c"; then red "No free port for $key near $orig"; exit 1; fi
    set_env "$key" "$c"
    yellow "port $orig ($key) is busy -> using $c" >&2
    echo "$c"
}

nginx_port="$(resolve_port NGINX_PORT 8080 nginx)"
resolve_port VITE_PORT 5173 node >/dev/null

cyan "Building and starting containers ..."
docker compose up -d --build

echo ""
green "Ready:"
echo "  http://localhost:${nginx_port}/${project}/"
printf '\033[90m%s\033[0m\n' "First run installs dependencies inside the container; if you get 502, wait ~1 min and refresh."
