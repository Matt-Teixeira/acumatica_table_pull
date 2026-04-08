("use strict");
require("dotenv").config();
const { bulk_db_query } = require("../utils/queries");

const addition_reduction_delta = async (apiEquipmentData) => {
  try {
    const add_remove = {
      add: [],
      remove: [],
    };

    const db_data = await bulk_db_query();

    // Check what is in api that isn't in the database (add system)
    for await (let system of apiEquipmentData) {
      const found = db_data.find(
        (element) => element.equipmentnbr === system.equipmentnbr
      );

      if (found === undefined) {
        add_remove.add.push(system);
      }
    }

    // Check what is in database that isn't in the api (remove system)
    for await (let system of db_data) {
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
  } catch (error) {
    console.log(error);
  }
};

module.exports = addition_reduction_delta;
