const { table_insert } = require("../utils/queries");

async function insert_new_systems(equipmentArray) {
  for (const system of equipmentArray) {
    const valuesArray = Object.values(system);
    await table_insert(valuesArray);
  }
}

module.exports = insert_new_systems;
