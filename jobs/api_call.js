("use strict");
require("dotenv").config();
const { log } = require("../logger");
const { call_api, get_api_data } = require("../api_call");

const runJob = async (acumaticLogin, acumaticEquipEndpoint) => {
  await log("info", "NA", "NA", "runJob", `FN CALL`, {
    acumaticLogin: acumaticLogin,
    acumaticEquipEndpoint: acumaticEquipEndpoint,
  });
  // CALL API
  const cookies = await call_api(acumaticLogin);
  const equipmentData = await get_api_data(acumaticEquipEndpoint, cookies);

  return equipmentData;
};

const api_call = async () => {
  try {
    // TYPE (info, warn, error), JOBID (NA FOR NOW), SME (NA FOR NOW), FN NAME, FN EVENT, {k/v}s
    await log("info", "NA", "NA", "api_call", `FN CALL`, {
      LOGGER: process.env.LOGGER,
      PG_USER: process.env.PG_USER,
      PG_DB: process.env.PG_DB,
    });

    let acumaticLogin;
    let acumaticEquipEndpoint;
    // SETUP ENV BASED RESOURCES
    switch (process.env.ENV) {
      case "prod":
        acumaticLogin = process.env.PROD_LOGIN_URI;
        acumaticEquipEndpoint = process.env.PROD_EQUIPMENT_URI;
        break;
      case "dev":
        acumaticLogin = process.env.DEV_LOGIN_URI;
        acumaticEquipEndpoint = process.env.DEV_EQUP_URI;
        break;
      default:
        break;
    }

    let data = await runJob(acumaticLogin, acumaticEquipEndpoint);

    return data;
  } catch (error) {
    console.log(error);
    await log("error", "NA", "NA", "api_call", `FN CALL`, {
      error,
    });
  }
};

module.exports = api_call;
