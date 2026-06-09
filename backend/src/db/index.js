const { Pool } = require('pg');

const isInternalRailway = (process.env.DATABASE_URL || '').includes('.railway.internal');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isInternalRailway ? false : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
