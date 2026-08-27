#!/usr/bin/env bash
# Preflight for acumatica_sync — validates the environment the NEXT run will
# actually use. Fleet paradigm (data_acquisition/docs/migration_CLAUDE.md);
# adapted from monday's preflight (closest shape: no file logger, external-API
# app). A clean run reports ZERO warnings: treat a persistent warning as a bug
# in the check itself, or it trains people to ignore output.
#
# Exit codes: 0 = pass (or warnings only), 1 = critical errors found.
set -u
cd "$(dirname "$0")"

ERRORS=0; WARNINGS=0; OKS=0
ok()    { echo "  OK    $*"; OKS=$((OKS+1)); }
warn()  { echo "  WARN  $*"; WARNINGS=$((WARNINGS+1)); }
error() { echo "  ERROR $*"; ERRORS=$((ERRORS+1)); }
info()  { echo "        $*"; }
section(){ echo; echo "== $* =="; }

# Read KEY= from .env, stripping quotes, dotenv-style inline comments and
# trailing whitespace. NEVER source this .env: the Acumatica URIs hold
# $-sequences that bash expansion would mangle.
env_val() {
    grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- \
        | sed -e 's/[[:space:]]\+#.*$//' -e 's/[[:space:]]*$//' \
              -e "s/^['\"]//" -e "s/['\"]$//"
}

# ------------------------------------------------------------------- 1. docker
section "Docker"
if docker ps >/dev/null 2>&1; then ok "docker daemon reachable"; else error "docker daemon not reachable as $(id -un)"; fi
if id -nG | grep -qw docker; then ok "$(id -un) is in the docker group"; else error "$(id -un) not in docker group"; fi
if docker compose version >/dev/null 2>&1; then ok "docker compose available"; else error "docker compose not available"; fi

USER_ID_V="$(env_val USER_ID)"
if [ -n "$USER_ID_V" ]; then
    if docker image inspect "acu-sync:${USER_ID_V}" >/dev/null 2>&1; then
        ok "image acu-sync:${USER_ID_V} present"
    else
        error "image acu-sync:${USER_ID_V} missing — run: bash build.sh"
    fi
fi

# ----------------------------------------------------------------- 2. networks
section "Networks"
if docker network inspect pg_net >/dev/null 2>&1; then ok "network pg_net exists"; else error "network pg_net missing"; fi

# --------------------------------------------------------------------- 3. .env
section ".env"
if [ ! -f .env ]; then
    error ".env missing — copy .env.example and fill it in"
else
    REQUIRED="APP_NAME USER_ID PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PG_SSLMODE PG_SSL_PATH
              PROD_OD_EQUIPMENT_URI PROD_LOGIN_NAME PROD_LOGIN_PW
              DOCKER_GID UID_0 UID_1 UID_2"
    for key in $REQUIRED; do
        v="$(env_val "$key")"
        if [ -z "$v" ]; then
            error ".env: $key is empty or missing"
        else
            case "$key" in
                *PW*|*PASSWORD*|*TOKEN*|*KEY*|*SECRET*) ok ".env: $key set (masked)" ;;
                *) ok ".env: $key=$v" ;;
            esac
        fi
    done

    # db/pg_pool.js falls back PGHOST -> PG_HOST (and PGUSER -> PG_USER, etc).
    # The Azure PG_HOST lines were removed 2026-08-25, but the fallback chain
    # is still live code: an emptied PGHOST with a reintroduced PG_HOST would
    # silently retarget the app. Fail loudly instead.
    if [ -z "$(env_val PGHOST)" ] && [ -n "$(env_val PG_HOST)" ]; then
        error ".env: PGHOST empty while PG_HOST is set — db/pg_pool.js would silently target PG_HOST ($(env_val PG_HOST))"
    fi

    for retired in IMAGE_TAG RUN_USER ENV LOGGER RUN_ENV; do
        grep -q "^$retired=" .env && warn ".env: retired key $retired still present — remove it (see .env.example)"
    done

    # PG_SSL_PATH is only read in verify-ca/verify-full mode (require skips
    # the CA — see CLAUDE.md KNOWN WART), but the file must exist before that
    # flip can ever land.
    SSL_PATH_V="$(env_val PG_SSL_PATH)"
    SSLMODE_V="$(env_val PG_SSLMODE)"
    if [ -n "$SSL_PATH_V" ]; then
        if [ -f "$SSL_PATH_V" ]; then
            ok "PG_SSL_PATH exists ($SSL_PATH_V)"
        elif [ "${SSLMODE_V#verify}" != "$SSLMODE_V" ]; then
            error "PG_SSL_PATH missing ($SSL_PATH_V) — PG_SSLMODE=$SSLMODE_V reads it at require-time"
        else
            warn "PG_SSL_PATH missing ($SSL_PATH_V) — unread under PG_SSLMODE=$SSLMODE_V, but the verify flip would die"
        fi
    fi
fi

# ---------------------------------------------------------------- 4. app files
section "Application files"
for f in index.js package.json Dockerfile entrypoint.sh docker-compose.yaml build.sh build-release.sh CLAUDE.md; do
    if [ -f "$f" ]; then ok "$f present"; else error "$f missing"; fi
done
for d in api_call db jobs utils; do
    if [ -d "$d" ]; then ok "$d/ present"; else error "$d/ missing"; fi
done

# --------------------------------------------------------------------- 5. deps
section "Dependencies"
if [ -d node_modules ] && [ -n "$(ls -A node_modules 2>/dev/null)" ]; then
    ok "root node_modules present ($(ls node_modules | wc -l) entries)"
else
    error "root node_modules missing or empty — run: bash build.sh"
fi

# ------------------------------------------------- 6. external services (AUTH)
section "External services (authenticated checks)"

# The Postgres auth test MUST run from a sibling container on pg_net, never
# via `docker exec <pg_container> psql`: pg_hba trusts local and loopback, so
# an exec'd psql succeeds with a deliberately WRONG password (that path hid a
# rotated password for three weeks on a sibling app). This mirrors how the app
# connects (db/pg_pool.js): PG_SSLMODE from .env (require on this host).
PGHOST_V="$(env_val PGHOST)"; PGPORT_V="$(env_val PGPORT)"; PGUSER_V="$(env_val PGUSER)"
PGPASSWORD_V="$(env_val PGPASSWORD)"; PGDATABASE_V="$(env_val PGDATABASE)"
PG_SSLMODE_V="$(env_val PG_SSLMODE)"; PG_SSLMODE_V="${PG_SSLMODE_V:-require}"
if [ -z "$PGPASSWORD_V" ]; then
    error "PGPASSWORD empty in .env — cannot verify PostgreSQL authentication"
elif ! docker image inspect postgres:16 >/dev/null 2>&1; then
    # An unverified check must never look like a passing one.
    warn "postgres:16 image absent — PostgreSQL auth NOT verified"
    info "Fix: docker pull postgres:16   (needed only for this check)"
else
    PG_OUT=$(docker run --rm --network pg_net \
        -e PGPASSWORD="$PGPASSWORD_V" -e PGSSLMODE="$PG_SSLMODE_V" \
        -e PGCONNECT_TIMEOUT=10 \
        postgres:16 \
        psql -h "$PGHOST_V" -p "$PGPORT_V" -U "$PGUSER_V" -d "$PGDATABASE_V" \
             -tAc "SELECT 'ok'" 2>&1)
    if [ "$(echo "$PG_OUT" | tail -1 | tr -d '[:space:]')" = "ok" ]; then
        ok "PostgreSQL auth OK (sibling-container SSL connection as $PGUSER_V)"
    elif echo "$PG_OUT" | grep -qi "password authentication failed\|no password supplied"; then
        error "PostgreSQL rejected PGPASSWORD from .env — likely a rotated credential"
        info "Fix: check the secret with its owner; update BOTH copies' .env (dev clone + release)"
    elif echo "$PG_OUT" | grep -qi "certificate\|SSL"; then
        error "PostgreSQL SSL failure: $(echo "$PG_OUT" | head -2)"
    else
        error "PostgreSQL check failed: $(echo "$PG_OUT" | head -2)"
    fi
fi

# Acumatica: presence-only by standing fleet decision — a real probe would
# authenticate against the production ERP. The sync run itself is a read-only
# GET and is the real exercise of these credentials.
info "Acumatica: presence-only (PROD_LOGIN_*/PROD_OD_EQUIPMENT_URI checked above); real auth exercised by the sync run"

# ------------------------------------------------------------------ 7. summary
section "Summary"
echo "  $OKS ok, $WARNINGS warnings, $ERRORS errors"
if [ "$ERRORS" -gt 0 ]; then
    echo "  RESULT: FAIL"
    exit 1
fi
[ "$WARNINGS" -gt 0 ] && echo "  RESULT: PASS (with warnings — a clean run should report zero)"
[ "$WARNINGS" -eq 0 ] && echo "  RESULT: PASS"
