import { config } from 'dotenv';

config();

import pg from 'pg';

async function main() {
  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_demo',
  });

  try {
    await client.connect();
    
    // List all columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'style_production_docs'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in style_production_docs:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
