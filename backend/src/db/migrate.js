require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_initial.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
