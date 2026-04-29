import pkg from 'pg';
const { Client } = pkg;
const client = new Client({ host: '127.0.0.1', port: 5433, user: 'postgres', password: 'postgres', database: 'erp_demo' });
await client.connect();

const styles = await client.query("SELECT id, style_code, style_name, base_image FROM styles WHERE status='Active' LIMIT 5");
console.log('Active Styles:', JSON.stringify(styles.rows, null, 2));

const samples = await client.query("SELECT id, style_id, sample_code, sample_type, images, status FROM samples LIMIT 5");
console.log('Samples table:', JSON.stringify(samples.rows, null, 2));

// Check line_samples
try {
  const lineSamples = await client.query("SELECT id, line_id, round, status, image_urls FROM line_samples LIMIT 5");
  console.log('LineSamples:', JSON.stringify(lineSamples.rows, null, 2));
} catch(e) {
  console.log('line_samples error:', e.message);
}

await client.end();
