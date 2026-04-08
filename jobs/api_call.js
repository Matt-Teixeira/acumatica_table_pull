("use strict");
require("dotenv").config();
const { call_api, get_api_data } = require("../api_call");

const runJob = async (acumaticLogin, acumaticEquipEndpoint) => {
  // CALL API
  const cookies = await call_api(acumaticLogin);
  const equipmentData = await get_api_data(acumaticEquipEndpoint, cookies);

  console.log("equipmentData");
  console.log(equipmentData);

  return equipmentData;
};

const api_call = async () => {
  try {
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
  }
};

module.exports = api_call;
