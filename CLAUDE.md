# CLAUDE.md

> **Migrated to the fleet dev/release paradigm 2026-08-25** (fourth, after
> data_acquisition, monday, part-source-pipeline). Conventions:
> `data_acquisition/docs/migration_CLAUDE.md` (Part 1). The editable git clone
> is `~/apps/acumatica_sync`; **`/opt/apps/acumatica_sync` is build output
> produced only by `build-release.sh`** — never edit it, it is not a checkout.

**acumatica_sync** is a Node.js run-once job that syncs equipment data from the
Acumatica ERP into the `public.acumatica_systems` Postgres table. One job, no
subcommands: a read-only OData GET against prod Acumatica, a diff against the
table, INSERTs for new systems, per-column UPDATEs for changed values.
**Rows are never deleted** — systems present in the DB but missing from
Acumatica are logged as a warning only (the whole point of the app: keep a
trustworthy local mirror that Acumatica mistakes cannot damage).

## Shape (what this app does NOT have, on purpose)

- **No file logger, no file writers at all.** Output is console-only; the run
  record is a `stats.job_runs` row (see *Run record* below). There is no
  `LOG_DIR`, no `utils/logger/`, and the entrypoint needs no directory repair.
- **No Redis, no run groups, no `/opt/resources/acqu_files` reads.** The only
  external services are Postgres (`pg_net`) and the Acumatica OData endpoint.
- **No schedule — deliberately.** Decision 2026-08-25 (this migration): the app
  stays unscheduled and is run manually. It appears under "Apps with NO
  schedule on this box (intentional)" in `data_acquisition/docs/schedules.md`.
  If a schedule is ever added, it goes in the **shared svc crontab** (cadence
  sections, hardened entries — see migration_CLAUDE.md Part 1), never a user
  crontab.

## Layout

| Path | Purpose |
| ---- | ------- |
| `index.js` | Entry: orchestrates the sync, owns the run record + signal handlers |
| `api_call/rtt-odata.js` | The OData GET (Basic auth, `PROD_OD_EQUIPMENT_URI`) |
| `jobs/` | format → add/remove diff → deep deltas → insert → update |
| `utils/queries.js` | All SQL for `acumatica_systems` (this app's `utils/` is NOT the fleet's vendored utils — it holds only this file) |
| `db/pg_pool.js` | `pg` Pool; SSL mode from `PG_SSLMODE` |

## Environment

The app loads `.env` itself via dotenv. **Compose deliberately has no
`env_file`** so the `$expand`/`$format` in Acumatica URIs survive Compose's
`$`-interpolation (`docker compose config` prints interpolation warnings for
those URIs — documented accepted exception A21-07 in the server setup doc).
**Never `source` this `.env` in a script** — read single keys with grep (see
the references' `env_val()` helper).

Keys the code actually reads: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`,
`PGDATABASE`, `PG_SSLMODE`, `PG_SSL_PATH`, `PROD_OD_EQUIPMENT_URI`,
`PROD_LOGIN_NAME`, `PROD_LOGIN_PW` (plus the `PG_*` fallback aliases in
`db/pg_pool.js`). Infra keys: host identity (`DOCKER_GID`, `UID_0..2`),
`USER_ID`, `APP_NAME`. `.env.example` is the tracked record of required keys.

- 2026-08-25 cleanup (owner-approved): removed the dead keys nothing read
  (`ENV`, `LOGGER`, `RUN_ENV`, `PROD_LOGIN_URI`, `PROD_LOGIN_COMPANY`,
  `PROD_EQUIPMENT_URI`, the `DEV_*` sandbox block) and the commented-out Azure
  PROD/STAGING DB passwords. The pre-cleanup `.env` is preserved at
  `~/env-backups/acumatica_sync.env.bak-20260825`.
- **KNOWN WART:** `PG_SSLMODE=require` means `db/pg_pool.js` does NOT verify
  the server certificate (`rejectUnauthorized: false`). This matches the
  current fleet state; the flip to `verify-full` belongs to the separate
  DB-roles rollout (setup doc, where this app is third in the queue) — do not
  flip it here in passing.

## Building & running

```bash
bash build.sh                                   # npm install (in-tree) + image acu-sync:${USER_ID}

# Development — from the dev tree (~/apps/acumatica_sync), as yourself
RUN_USER=<you> docker compose run --rm app node index.js

# Production — from the release copy, RUN_USER omitted so entrypoint.sh
# defaults to svc (one place decides the identity)
cd /opt/apps/acumatica_sync && docker compose run --rm app node index.js
```

- `node_modules` is **in-tree**, installed by `build.sh` as the calling host
  user. The former shared-cache mount
  (`/opt/resources/node_mod_cache/acumatica_sync`) is retired — do not
  reintroduce it. The old `docs/run.sh` "npm ci to nuke the cache" pattern
  died with it.
- **A dev run is a real run**: same staging DB, same prod Acumatica endpoint
  as production. There is no sandbox mode — snapshot `acumatica_systems`
  first if you need to review what a run will change.

## Run record — `stats.job_runs`

Every run inserts one row into the shared `stats.job_runs` table
(`app_name='acumatica_sync'`, `job_name='sync'`) with runtime, status, and
error message — the monday pattern. **No schema changes to that shared table**
(standing fleet decision): release provenance lives in the stamped `.env` and
the boot console line, not in a column. SIGTERM/SIGINT record a killed run
(status `error`, honest exit 1) via a once-guarded handler.

## Release workflow

```bash
cd ~/apps/acumatica_sync         # commit + push first — the guard refuses a dirty tree
bash build-release.sh            # wipe-and-mirror to /opt/apps/acumatica_sync,
                                 # apply #RELEASE: overrides, stamp RELEASE_SHA,
                                 # build acu-sync:svc (as svc, HOME=/opt/apps/.svc-home)

# Verify a release:
grep '^RELEASE_SHA=' /opt/apps/acumatica_sync/.env      # = the commit you shipped
(cd /opt/apps/acumatica_sync && bash preflight-check.sh) # zero warnings expected
```

- `build-release.sh` preserves `/opt/apps/acumatica_sync/node_modules` across
  releases as an install cache. Never `HOME=/tmp` for svc builds — use
  `/opt/apps/.svc-home` (the script does).
- Cutover verified 2026-08-25 at `0e2a704`: release smoke run as svc
  (105:987), boot line printed the SHA, `stats.job_runs` row `success`,
  `diff -r` release vs clone clean, dirty-tree refusal and SIGTERM kill-row
  both negative-tested.
- The pre-migration `.env` and a pre-migration `acumatica_systems` dump live
  in `~/env-backups/` (2026-08-25).
