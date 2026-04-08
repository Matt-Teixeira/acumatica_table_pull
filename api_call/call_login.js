("use strict");
require("dotenv").config();
const fetch = require("node-fetch");

const callLogin = async (acumaticEndpoint) => {
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
    if (!res.ok) {
      throw new Error(`Login request failed with status ${res.status}`);
    }
    return res.headers.raw();
  } catch (error) {
    console.log(error);
  }
};

module.exports = callLogin;
