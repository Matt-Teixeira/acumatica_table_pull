("use strict");
require("dotenv").config();
const { log } = require("../logger");
const { update_table } = require("../utils/queries");

const updateAcuTableDeltas = async (deltas) => {
  try {
    await log("info", "NA", "NA", "updateAcuTableDeltas", `FN CALL`);

    for await (const delta of deltas) {
      let keys = Object.keys(delta.deltas.api);

      for await (const key of keys) {
        await update_table(delta, key);
      }
    }
  } catch (error) {
    await log("error", "NA", "NA", "updateAcuTableDeltas", `FN CALL`, {
      error: error,
    });
  }
};

module.exports = updateAcuTableDeltas;
