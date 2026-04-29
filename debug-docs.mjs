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

  // Get latest po lines with their production docs joined
  const result = await client.query(`
    SELECT 
      pl.id as line_id,
      pl.style_id,
      pl.style_code,
      pl.product_name,
      pl.created_at as line_created_at,
      pd.id as prod_doc_id,
      pd.section1_image_url,
      pd.section2_phu_lieu,
      pd.created_at as doc_created_at
    FROM po_lines pl
    LEFT JOIN production_docs pd ON pd.line_id = pl.id
    ORDER BY pl.created_at DESC
    LIMIT 8
  `);
  console.log('=== PoLines + ProductionDocs ===');
  for (const r of result.rows) {
    console.log({
      line_id: r.line_id,
      style_code: r.style_code,
      product_name: r.product_name,
      line_created_at: r.line_created_at,
      has_prod_doc: !!r.prod_doc_id,
      has_section1_image: !!r.section1_image_url,
      section1_image_url: r.section1_image_url ? r.section1_image_url.substring(0, 60) + '...' : null,
    });
  }

  // Check size rows for docs that have them
  const sizeRowsResult = await client.query(`
    SELECT pdr.id, pdr.doc_id, pdr.row_name, pdr.image_url, pdr.order_index
    FROM production_doc_size_rows pdr
    ORDER BY pdr.order_index
    LIMIT 10
  `);
  console.log('\n=== Size Rows ===');
  console.log(JSON.stringify(sizeRowsResult.rows, null, 2));

  await client.end();
}

run().catch(console.error);
