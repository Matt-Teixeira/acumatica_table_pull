("use strict");
require("dotenv").config();
const { log } = require("../logger");
const fetch = require("node-fetch");
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

    const res = await fetch(acumaticEndpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify({}),
    });
    await log("info", "NA", "NA", "getApiData", `FN DETAILS`, {
      status: res.status,
    });
    if (!res.ok) {
      throw new Error(`API data request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.EquipmentRTTDetails;
  } catch (error) {
    console.log(error);
    await log("error", "NA", "NA", "getApiData", `FN CATCH`, {
      error: error,
    });
  }
};

module.exports = getApiData;
