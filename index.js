require("dotenv").config();
const { performance } = require("node:perf_hooks");
const {
  format_api_data,
  addition_reduction_delta,
  insert_new_systems,
  find_deep_deltas,
  update_table_deltas
} = require("./jobs");
const { get_rtt_odata } = require("./api_call");
const pgPool = require("./db/pg_pool");

const APP_NAME = process.env.APP_NAME || "acumatica_sync";
const JOB_NAME = "sync";

const run_job = async () => {
  const equipment_data = await get_rtt_odata();

  const formatted_data = await format_api_data(equipment_data.value);

  // addition_reduction_delta returns systems to add and systems that no longer
  // exist in Acumatica. It also returns the db data to avoid a second query.
  const addition_removal_deltas = await addition_reduction_delta(formatted_data);

  const { add, remove } = addition_removal_deltas.add_remove;

  // Removed systems are logged only — never deleted from the table.
  if (remove.length) {
    console.warn(
      `Detected ${remove.length} system(s) in DB but not in Acumatica (not deleted):`,
      remove.map((s) => s.equipmentnbr)
    );
  }

  await insert_new_systems(add);

  const deltas = await find_deep_deltas(
    formatted_data,
    addition_removal_deltas.db_data
  );

  if (deltas.length) await update_table_deltas(deltas);

  console.log(
    `Sync complete: ${add.length} inserted, ${deltas.length} updated, ${remove.length} missing-from-API (kept)`
  );
};

const insert_job_run = (run_dt, ms, status, error_message) =>
  pgPool.query(
    `INSERT INTO stats.job_runs (app_name, job_name, run_datetime, run_time_ms, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [APP_NAME, JOB_NAME, run_dt, +ms.toFixed(1), status, error_message]
  );

// Set while the job is running so the signal handlers can record a killed run;
// cleared before the finally-block insert so a late signal can't double-log.
let active_run = null;
let shutting_down = false;

const main = async () => {
  const start = performance.now();
  const run_dt = new Date();
  let status = "success";
  let error_message = null;
  active_run = { run_dt, start };

  // Release provenance: build-release.sh stamps RELEASE_SHA into the DEPLOYED
  // .env; a dev tree has no key and prints 'dev-tree'. This boot line is the
  // run's console provenance record. A scheduled or release run printing
  // 'dev-tree' means the wrong copy is being executed.
  console.log(
    `[${APP_NAME}] job=${JOB_NAME} release_sha=${process.env.RELEASE_SHA || "dev-tree"}`
  );

  try {
    await run_job();
  } catch (error) {
    status = "error";
    error_message = error.message;
    console.error("Acumatica sync failed:", error);
    process.exitCode = 1;
  } finally {
    active_run = null;
    const ms = performance.now() - start;
    console.log(`Total runtime: ${(ms / 1000).toFixed(2)} s`);
    try {
      await insert_job_run(run_dt, ms, status, error_message);
    } catch (dbErr) {
      console.error("Failed to log job run:", dbErr.message);
    }
    await pgPool.end();
  }
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

// A killed run must still leave a stats.job_runs row and exit non-zero:
// without this, SIGTERM/SIGINT skip the finally-block insert and the run
// vanishes without a trace — no row, no honest exit code. gosu execs node as
// PID 1, so docker stop / kills deliver the signal directly. Once-guard so a
// second signal during the flush can't double-insert or recurse.
const record_kill = async (signal) => {
  if (shutting_down) return;
  shutting_down = true;
  console.error(`[${APP_NAME}] ${signal} received — recording killed run, exiting 1`);
  const run = active_run;
  if (run) {
    const ms = performance.now() - run.start;
    try {
      await Promise.race([
        insert_job_run(run.run_dt, ms, "error",
          `${signal} received — run killed before completion`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("kill-log insert timed out")), 5000)
        ),
      ]);
    } catch (dbErr) {
      console.error("Failed to log killed run:", dbErr.message);
    }
  }
  process.exit(1);
};

process.on("SIGTERM", () => record_kill("SIGTERM"));
process.on("SIGINT", () => record_kill("SIGINT"));

main();
