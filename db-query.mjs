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
  const res = await client.query('SELECT * FROM style_production_docs LIMIT 1');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
