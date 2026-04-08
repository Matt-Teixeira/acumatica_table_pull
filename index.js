("use strict");
require("dotenv").config();
const {
  api_call,
  format_api_data,
  addition_reduction_delta,
  insert_new_systems,
  find_deep_deltas,
  update_table_deltas
} = require("./jobs");
const { get_rtt_odata } = require("./api_call");

const run_job = async () => {
  const equipment_data = await get_rtt_odata();

  const formatted_data = await format_api_data(equipment_data.value);

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
    run_job();
  } catch (error) {
    console.log(error);
  }
};

on_boot();
