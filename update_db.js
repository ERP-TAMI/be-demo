const { Client } = require('pg'); 
const client = new Client({ host: '127.0.0.1', port: 5433, user: 'postgres', password: 'postgres', database: 'erp_demo' }); 
client.connect().then(() => 
  client.query("UPDATE po_lines SET status = 'Sampling' WHERE status IN ('Draft', 'In_Review')").then(res => { 
    console.log("Updated rows:", res.rowCount); 
    client.end(); 
  })
).catch(console.error);
