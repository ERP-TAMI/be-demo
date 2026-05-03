const { Client } = require('pg'); 
const client = new Client({ host: '127.0.0.1', port: 5433, user: 'postgres', password: 'postgres', database: 'erp_demo' }); 
client.connect().then(() => 
  client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'line_samples_status_enum'").then(res => { 
    console.log("Enums:", res.rows); 
    client.end(); 
  })
).catch(console.error);
