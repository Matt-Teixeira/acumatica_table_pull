const { table_insert } = require("../utils/queries");

async function insert_new_systems(equipmentArray) {
  try {
    for await (let system of equipmentArray) {
      const valuesArray = [];
      for (const prop in system) {
        valuesArray.push(system[prop]);
      }
      await table_insert(valuesArray);
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = insert_new_systems;