const { bulk_db_query } = require("../utils/queries");

const addition_reduction_delta = async (apiEquipmentData) => {
  const add_remove = {
    add: [],
    remove: []
  };

  const db_data = await bulk_db_query();

  // Check what is in the api that isn't in the database (add system)
  for (const system of apiEquipmentData) {
    const found = db_data.find(
      (element) => element.equipmentnbr === system.equipmentnbr
    );

    if (found === undefined) {
      add_remove.add.push(system);
    }
  }

  // Check what is in the database that isn't in the api (remove system)
  for (const system of db_data) {
    const found = apiEquipmentData.find(
      (element) => element.equipmentnbr === system.equipmentnbr
    );

    if (found === undefined) {
      add_remove.remove.push(system);
    }
  }

  return {
    add_remove,
    db_data
  };
};

module.exports = addition_reduction_delta;
