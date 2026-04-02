("use strict");
require("dotenv").config();
const { log } = require("../logger");
const fetch = require("node-fetch");

const callLogin = async (acumaticEndpoint) => {
  await log("info", "NA", "NA", "callAPI", `FN CALL`, {
    acumaticEndpoint: acumaticEndpoint,
  });

  try {
    const res = await fetch(acumaticEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:
          process.env.ENV === "dev"
            ? process.env.DEV_LOGIN_NAME
            : process.env.PROD_LOGIN_NAME,
        Password:
          process.env.ENV === "dev"
            ? process.env.DEV_LOGIN_PW
            : process.env.PROD_LOGIN_PW,
        company:
          process.env.ENV === "dev"
            ? process.env.DEV_LOGIN_COMPANY
            : process.env.PROD_LOGIN_COMPANY,
      }),
    });
    await log("info", "NA", "NA", "callAPI", `FN DETAILS`, {
      status: res.status,
    });
    if (!res.ok) {
      throw new Error(`Login request failed with status ${res.status}`);
    }
    return res.headers.raw();
  } catch (error) {
    console.log(error);
    await log("error", "NA", "NA", "callAPI", `FN CATCH`, {
      error: error,
    });
  }
};

module.exports = callLogin;
