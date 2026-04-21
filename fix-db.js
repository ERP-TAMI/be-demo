const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'erp_demo',
});

async function run() {
  await client.connect();

  const { rows } = await client.query("SELECT id, reason, target_label FROM po_version_log WHERE reason LIKE '%Ã%' OR target_label LIKE '%Ã%'");
  console.log('Found ' + rows.length + ' bad rows.');

  // Replace Latin-1 double encoding with proper Vietnamese
  // Ãcâ,¬â€ -> — (triple encoded sometimes)
  // Ã¢â‚¬â€ -> —
  const replacements = [
    { bad: 'Ãcâ,¬â€', good: '—' },
    { bad: 'Ã¢â‚¬â€', good: '—' },
    { bad: 'Ã¢â‚¬â€”', good: '—' },
    { bad: 'ThÃªm cÃ´ng Ä‘oáº¡n', good: 'Thêm công đoạn' },
    { bad: 'Th\u00c3\u00aam c\u00c3\u00b4ng \u00c4\u2018o\u00e1\u00ba\u00a1n', good: 'Thêm công đoạn' },
    { bad: 'XÃ³a cÃ´ng Ä‘oáº¡n', good: 'Xóa công đoạn' },
    { bad: 'TÃ¡o sáº£n pháº©m', good: 'Tạo sản phẩm' },
    { bad: 'CÃ¡p nháºt sáº£n pháº©m', good: 'Cập nhật sản phẩm' },
    { bad: 'ThÃªm file', good: 'Thêm file' },
    { bad: 'XÃ³a file', good: 'Xóa file' },
    { bad: 'ThÃªm Ä‘á»£t máº«u', good: 'Thêm đợt mẫu' },
    { bad: 'Ä‘á»£t máº«u', good: 'đợt mẫu' },
    { bad: 'Ä á»£t máº«u', good: 'Đợt mẫu'},
    { bad: 'Cáºp nháºt Ä‘á»£t máº«u', good: 'Cập nhật đợt mẫu' },
    { bad: 'Cáº\xadp nháº\xadt', good: 'Cập nhật' },
    { bad: 'GÃ¡n tÃ¡i liáºu PO', good: 'Gán tài liệu PO' }
  ];

  for (let row of rows) {
    let r = row.reason;
    let l = row.target_label;
    for (const {bad, good} of replacements) {
        if (r) r = r.split(bad).join(good);
        if (l) l = l.split(bad).join(good);
    }
    // General fix for —
    if (l && l.includes('AOS')) {
       // usually it's "STYLE — AOS"
       l = l.replace(/.*AOS/, (match) => match.replace(/[^A-Za-z0-9 _-]/g, '').replace('AOS', '— AOS'));
    }

    if (r !== row.reason || l !== row.target_label) {
       await client.query("UPDATE po_version_log SET reason = $1, target_label = $2 WHERE id = $3", [r, l, row.id]);
    }
  }

  console.log("Fix completed");
  await client.end();
}
run().catch(console.error);
