const { log } = require("../logger");
const { table_insert } = require("../utils/queries");

async function insert_new_systems(equipmentArray) {
  try {
    await log("info", "NA", "NA", "insert_new_systems", `FN CALL`);

    for await (let system of equipmentArray) {
      const valuesArray = [];
      for (const prop in system) {
        valuesArray.push(system[prop]);
      }
      await table_insert(valuesArray);
      await log("info", "NA", "NA", "insert_new_systems", `FN CALL`, {
        inserted_system: valuesArray
      });
    }
  } catch (error) {
    await log("error", "NA", "NA", "insert_new_systems", `FN CALL`, {
        error: error.message
    });
  }
}

module.exports = insert_new_systems;