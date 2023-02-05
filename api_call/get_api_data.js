("use strict");
require("dotenv").config();
const { log } = require("../logger");
const { default: axios } = require("axios");
const cookie_parser = require("../utils/parse_cookie");

const getApiData = async (acumaticEndpoint, loginData) => {
  await log("info", "NA", "NA", "getApiData", `FN CALL`, {
    acumaticEndpoint: acumaticEndpoint,
  });
  try {
    const newCookie = cookie_parser(loginData);

    const headers = {
      "Content-Type": "application/json",
      Cookie: newCookie,
    };

    const res = await axios.put(acumaticEndpoint, {}, { headers });
    await log("info", "NA", "NA", "getApiData", `FN DETAILS`, {
      status: res.status,
    });
    
    return res.data.EquipmentRTTDetails;
  } catch (error) {
    console.log(error);
    await log("error", "NA", "NA", "getApiData", `FN CATCH`, {
      error: error,
    });
  }
};

module.exports = getApiData;
