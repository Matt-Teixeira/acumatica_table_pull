("use strict");
require("dotenv").config();
const { log } = require("../logger");

const find_deep_deltas = async (api_data, db_data) => {
  const delta = [];

  try {
    await log("info", "NA", "NA", "find_deep_deltas", `FN CALL`);

    // Check what is in api that isn't in the database (add system)
    for await (let system of api_data) {
      const found = db_data.find(
        (element) => element.equipmentnbr === system.equipmentnbr
      );

      if (found === undefined) {
        await log("warn", "NA", "NA", "find_deep_deltas", `FN CALL`, {
          sme: system.equipmentnbr,
          message: "Found in api, but not database",
        });
        continue;
      }

      const deltaObj = { system: "", deltas: { api: {}, db: {} } };
      for (const key in system) {
        // Change api undefined values to null
        if (system[key] === undefined) system[key] = null;
        if (system[key] !== found[key]) {
          deltaObj.deltas.api[key] = system[key];
          deltaObj.deltas.db[key] = found[key];
        }
      }
      if (Object.keys(deltaObj.deltas.api).length > 0) {
        // Add system id then push to delta array
        deltaObj.system = system.equipmentnbr;
        delta.push(deltaObj);
      }
    }

    await log("info", "NA", "NA", "find_deep_deltas", `FN CALL`, {
      deltas: delta,
    });

    return delta;
  } catch (error) {
    console.log(error);
    await log("error", "NA", "NA", "find_deep_deltas", `FN CALL`, {
      error: error,
    });
  }
};

module.exports = find_deep_deltas;
