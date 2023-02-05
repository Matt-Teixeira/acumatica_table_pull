const { log } = require("../logger");
const pgPool = require("../db/pg_pool");

const bulk_db_query = async () => {
  try {
    await log("info", "NA", "NA", "bulk_db_query", `FN CALL`);
    const data = await pgPool.query("SELECT * FROM acumatica_systems");
    return data.rows;
  } catch (error) {
    await log("error", "NA", "NA", "bulk_db_query", `FN CALL`, { error });
  }
};

const table_insert = async (values) => {
  try {
    await log("info", "NA", "NA", "table_insert", `FN CALL`, {
      values,
    });
    const queryStr =
      "INSERT INTO acumatica_systems(EquipmentNbr, CustomerContractCustomerID, CustomerUniqueID, CustomerContractCustomerName, ServiceContractCustomerID, ServiceContractCustomerName, State, City, AddressLine1, PostalCode, Manufacturer, Modality, Model, SerialNbr, Room) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)";
    await pgPool.query(queryStr, values);
  } catch (error) {
    await log("error", "NA", "NA", "table_insert", `FN CALL`, {
      error: error.message,
    });
  }
};

async function update_table(delta, key) {
  console.log(delta);
  console.log("KEY IN QUERY: " + key);
  try {
    let queryString;
    let values = [];
    switch (key) {
      case "customercontractcustomerid":
        queryString =
          "UPDATE acumatica_systems SET customercontractcustomerid = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "customeruniqueid":
        queryString =
          "UPDATE acumatica_systems SET customeruniqueid = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "customercontractcustomername":
        queryString =
          "UPDATE acumatica_systems SET customercontractcustomername = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "servicecontractcustomerid":
        queryString =
          "UPDATE acumatica_systems SET servicecontractcustomerid = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "servicecontractcustomername":
        queryString =
          "UPDATE acumatica_systems SET servicecontractcustomername = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "state":
        queryString =
          "UPDATE acumatica_systems SET state = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "city":
        queryString =
          "UPDATE acumatica_systems SET city = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "addressline1":
        queryString =
          "UPDATE acumatica_systems SET addressline1 = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "postalcode":
        queryString =
          "UPDATE acumatica_systems SET postalcode = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "manufacturer":
        queryString =
          "UPDATE acumatica_systems SET manufacturer = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "modality":
        queryString =
          "UPDATE acumatica_systems SET modality = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "model":
        queryString =
          "UPDATE acumatica_systems SET model = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "serialnbr":
        queryString =
          "UPDATE acumatica_systems SET serialnbr = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      case "room":
        queryString =
          "UPDATE acumatica_systems SET room = $1 WHERE equipmentnbr = $2";
        values = [delta.deltas.api[key], delta.system];
        break;
      default:
        break;
    }

    await pgPool.query(queryString, values);

    await log("info", "NA", "NA", "update_table", `FN CALL`, {
      query: queryString,
      values
    });

    return true;
  } catch (error) {
    await log("error", "NA", "NA", "update_table", `FN CALL`, {
      error: error.message,
    });
  }
}

module.exports = { bulk_db_query, table_insert, update_table };
