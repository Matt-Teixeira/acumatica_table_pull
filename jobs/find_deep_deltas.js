("use strict");
require("dotenv").config();

const find_deep_deltas = async (api_data, db_data) => {
  const delta = [];

  try {
    // Check what is in api that isn't in the database (add system)
    for await (let system of api_data) {
      const found = db_data.find(
        (element) => element.equipmentnbr === system.equipmentnbr
      );

      if (found === undefined) {
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

    return delta;
  } catch (error) {
    console.log(error);
  }
};

module.exports = find_deep_deltas;
