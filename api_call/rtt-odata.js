const fetch = require("node-fetch");

const get_rtt_odata = async () => {
  const odate_url = process.env.PROD_OD_EQUIPMENT_URI;
  try {
    const credentials = Buffer.from(
      `${process.env.PROD_LOGIN_NAME}:${process.env.PROD_LOGIN_PW}`
    ).toString("base64");

    const res = await fetch(odate_url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      const error = new Error(`OData request failed with status ${res.status}`);
      error.response = { status: res.status, data: body };
      throw error;
    }

    return await res.json();
  } catch (error) {
    console.error("OData error:", error.response?.status, error.response?.data);
    throw error;
  }
};

module.exports = get_rtt_odata;
