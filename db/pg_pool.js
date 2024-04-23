require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');
const pgPool = new Pool({
	user: process.env.PG_USER,
	password: process.env.PG_PW,
	host: process.env.PG_HOST,
	database: process.env.PG_DB,
	port: process.env.PG_PORT,
	sslMode: require,
	//ssl: {
	//   cert: fs.readFileSync(`./db/BaltimoreCyberTrustRoot.crt.pem`),
	//   rejectUnauthorized: true,
	//},
	// idleTimeoutMillis: 60000, // DOESN'T SEEM TO MATTER
});

module.exports = pgPool;