const { update_table } = require("../utils/queries");

const updateAcuTableDeltas = async (deltas) => {
  for (const delta of deltas) {
    const keys = Object.keys(delta.deltas.api);

    for (const key of keys) {
      await update_table(delta, key);
    }
  }
};

module.exports = updateAcuTableDeltas;
