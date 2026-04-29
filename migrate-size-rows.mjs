import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'erp_demo'
});

async function run() {
  await client.connect();
  // Add image_url column if not exists
  await client.query(`
    ALTER TABLE "production_doc_size_rows" 
    ADD COLUMN IF NOT EXISTS "image_url" text
  `);
  // Make row_name have a default
  await client.query(`
    ALTER TABLE "production_doc_size_rows" 
    ALTER COLUMN "row_name" SET DEFAULT ''
  `);
  console.log('Done: added image_url column and set row_name default');
  await client.end();
}
run().catch(console.error);
