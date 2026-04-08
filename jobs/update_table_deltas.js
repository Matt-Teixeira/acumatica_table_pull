("use strict");
require("dotenv").config();
const { update_table } = require("../utils/queries");

const updateAcuTableDeltas = async (deltas) => {
  try {
    for await (const delta of deltas) {
      let keys = Object.keys(delta.deltas.api);

      for await (const key of keys) {
        await update_table(delta, key);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = updateAcuTableDeltas;
