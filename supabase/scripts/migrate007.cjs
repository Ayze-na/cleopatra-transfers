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
  client.connect();
  if (mode === 'test') {
    const { rows } = await client.query('SELECT 1 AS ok, version()');
    console.log('CONNECTED:', rows[0].ok, rows[0].version.slice(0, 60));
  } else if (mode === 'migrate') {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '007_site_settings.sql'), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('MIGRATION 007 APPLIED');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('MIGRATION FAILED (rolled back):', err.message);
      process.exitCode = 1;
      return;
    }
    const { rows } = await client.query(`
      SELECT (
        SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='public_request_log'
      ) AS tbl,
      (SELECT count(*) FROM storage.buckets WHERE id='site-images') AS bucket,
      (SELECT count(*) FROM information_schema.routines WHERE routine_name IN ('log_notification','log_activity') AND routine_schema='public') AS rpcs,
      (SELECT count(*) FROM settings WHERE key IN ('whatsapp_number','contact_email','contact_phone','terms_document','privacy_document')) AS settings_rows
    `);
    console.log('VERIFY:', JSON.stringify(rows[0]));
  }
  client.end();
}

main().catch((err) => {
  console.error('DB ERROR:', err.message);
  process.exit(1);
});
