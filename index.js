("use strict");
require("dotenv").config();
const { log } = require("./logger");
const {
  api_call,
  format_api_data,
  addition_reduction_delta,
  insert_new_systems,
  find_deep_deltas,
  update_table_deltas,
} = require("./jobs");

const run_job = async () => {
  await log("info", "NA", "NA", "run_job", `FN CALL`);
  const equipment_data = await api_call();
  const formatted_data = await format_api_data(equipment_data);

  // addition_reduction_delta returns new and systems that may need to be removed.
  // addition_reduction_delta also returns db data to prevent second call.
  const addition_removal_deltas = await addition_reduction_delta(
    formatted_data
  );

  await insert_new_systems(addition_removal_deltas.add_remove.add);

  const deltas = await find_deep_deltas(
    formatted_data,
    addition_removal_deltas.db_data
  );

  if (deltas.length) await update_table_deltas(deltas);
};

const on_boot = async () => {
  try {
    // TYPE (info, warn, error), JOBID (NA FOR NOW), SME (NA FOR NOW), FN NAME, FN EVENT, {k/v}s
    await log("info", "NA", "NA", "on_boot", `FN CALL`);

    run_job();
  } catch (error) {
    console.log(error);
    await log("error", "NA", "NA", "on_boot", `FN CALL`, {
      error,
    });
  }
};

on_boot();
