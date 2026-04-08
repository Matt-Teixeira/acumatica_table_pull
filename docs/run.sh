## Run a job

```sh
docker compose run --rm app bash -lc "npm run start"
```

# RUN ON FIRST DEPLOY TO NUKE AND UPDATE node_moduels CACHE: fresh install before running the job

```sh
docker compose run --rm app bash -lc "npm ci --omit=dev && npm run start"
```