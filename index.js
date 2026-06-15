require("dotenv").config();
const {
  format_api_data,
  addition_reduction_delta,
  insert_new_systems,
  find_deep_deltas,
  update_table_deltas
} = require("./jobs");
const { get_rtt_odata } = require("./api_call");
const pgPool = require("./db/pg_pool");

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
};

const main = async () => {
  try {
    await run_job();
  } catch (error) {
    console.error("Acumatica sync failed:", error);
    process.exitCode = 1;
  } finally {
    await pgPool.end();
  }
};

main();
