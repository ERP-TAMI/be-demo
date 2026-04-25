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
    
    // Check if column exists
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'style_production_docs' AND column_name = 'sections'
    `);
    
    if (result.rows.length === 0) {
      console.log('Adding sections column to style_production_docs...');
      await client.query(`
        ALTER TABLE "style_production_docs"
        ADD COLUMN "sections" jsonb
      `);
      console.log('Column added successfully!');
    } else {
      console.log('Column already exists.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
