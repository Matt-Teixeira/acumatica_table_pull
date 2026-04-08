require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

function buildSsl() {
   const mode = (process.env.PG_SSLMODE || 'disable').toLowerCase();
   if (mode === 'disable') return false;
   if (mode === 'require') return { rejectUnauthorized: false };
   // verify-ca or verify-full
   return {
      ca: fs.readFileSync(process.env.PG_SSL_PATH),
      rejectUnauthorized: true,
   };
}

const pgPool = new Pool({
   user: process.env.PGUSER || process.env.PG_USER,
   password: process.env.PGPASSWORD || process.env.PG_PW,
   host: process.env.PGHOST || process.env.PG_HOST,
   database: process.env.PGDATABASE || process.env.PG_DB,
   port: process.env.PGPORT || process.env.PG_PORT,
   ssl: buildSsl(),
});

module.exports = pgPool;