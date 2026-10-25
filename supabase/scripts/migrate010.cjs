const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

const env = loadEnv(path.join(__dirname, '..', '..', '.env.local'));
const { Client } = require(path.join(__dirname, '..', '..', 'node_modules', 'pg'));

async function main() {
  const mode = process.argv[2];
  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  if (mode === 'test') {
    const { rows } = await client.query('SELECT 1 AS ok');
    console.log('CONNECTED:', rows[0].ok);
  } else if (mode === 'migrate') {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '010_payment_methods.sql'), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('MIGRATION 010 APPLIED');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('MIGRATION FAILED (rolled back):', err.message);
      process.exitCode = 1;
      return;
    }
    const { rows } = await client.query(`
      SELECT
        (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='payment_methods') AS tbl,
        (SELECT count(*) FROM payment_methods) AS methods,
        (SELECT count(*) FROM payment_methods WHERE code='cash' AND active) AS cash,
        (SELECT count(*) FROM payment_methods WHERE code='bank_transfer' AND requires_screenshot) AS bank,
        (SELECT count(*) FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid WHERE c.conname='direct_bookings_payment_method_check') AS old_check
    `);
    console.log('VERIFY:', JSON.stringify(rows[0]));
  }
  client.end();
}

main().catch((err) => {
  console.error('DB ERROR:', err.message);
  process.exit(1);
});
