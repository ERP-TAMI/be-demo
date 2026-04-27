import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceMaterialsWithAccessories17800000000000 implements MigrationInterface {
  name = 'ReplaceMaterialsWithAccessories17800000000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DELETE FROM materials`);

    await qr.query(`
      INSERT INTO material_groups (name, display_order) VALUES
      ('FUSIBLE', 1), ('TAPE', 2), ('MAIN LABEL', 3), ('SIZE LABEL', 4),
      ('CARE LABEL', 5), ('HANGTAG', 6), ('JOKER TAG', 7), ('SWIFTACK', 8),
      ('POLY BAG', 9), ('HANGER', 10), ('CARTON', 11), ('SHOULDER PAD', 12),
      ('ZIPPER', 13), ('ZIPPER TAPE', 14), ('ZIPPER PULL', 15), ('BUTTON', 16)
      ON CONFLICT (name) DO NOTHING
    `);

    const g = await qr.query(`SELECT id, name FROM material_groups`);
    const map: Record<string, string> = {};
    for (const row of g) map[row.name] = row.id;

    const V = 'Active';

    await qr.query(`
      INSERT INTO materials (material_code, material_name, material_group_id, unit, default_yield_pct, last_unit_cost, status, current_stock, low_stock_threshold) VALUES
      -- FUSIBLE
      ('FUS-BLK',  'FUSIBLE BLK',                       '${map['FUSIBLE']}',  'mét', 1.0, 0, '${V}', 0, 100),
      ('FUS-WHT',  'FUSIBLE WHT',                       '${map['FUSIBLE']}',  'mét', 1.0, 0, '${V}', 0, 100),

      -- TAPE
      ('TAPE-CLR', 'TAPE CLEAR 1/4',                    '${map['TAPE']}',      'mét', 1.0, 0, '${V}', 0, 100),

      -- MAIN LABEL
      ('ML-01',    'SL-08 SOHO APPAREL WHITE',          '${map['MAIN LABEL']}','cái', 1.0, 0, '${V}', 0, 1000),
      ('ML-02',    'SL-01 SOHO APPAREL (BLK/SILVER)',   '${map['MAIN LABEL']}','cái', 1.0, 0, '${V}', 0, 1000),
      ('ML-03',    'NICOLLEMNX',                        '${map['MAIN LABEL']}','cái', 1.0, 0, '${V}', 0, 1000),

      -- SIZE LABEL
      ('SL-01',    'SL-10 SOHO WHITE',                   '${map['SIZE LABEL']}','cái', 1.0, 0, '${V}', 0, 2000),
      ('SL-02',    'NICOLLESZN',                         '${map['SIZE LABEL']}','cái', 1.0, 0, '${V}', 0, 2000),

      -- CARE LABEL
      ('CL-01',    'SL-09 (NO SIZE)',                    '${map['CARE LABEL']}','cái', 1.0, 0, '${V}', 0, 1000),
      ('CL-02',    'SL-04 COLOR BLK/WHT',                '${map['CARE LABEL']}','cái', 1.0, 0, '${V}', 0, 1000),
      ('CL-03',    'WHITE SATIN LABEL WITH BLACK LETTERS','${map['CARE LABEL']}','cái', 1.0, 0, '${V}', 0, 1000),

      -- HANGTAG
      ('HT-01',    'SL-07 SOHO APPAREL PX TAG MSRP $60.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-02',    'SL-02 SOHO APPAREL PX TAG MSRP $60.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-03',    'SL-07 SOHO APPAREL PX TAG MSRP $55.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-04',    'SL-21 SOHO APPAREL NO MSRP',               '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-05',    'SL-07 SOHO APPAREL NO MSRP',               '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-06',    'SL-07 SOHO APPAREL PX TAG MSRP $30.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-07',    'SL-02 SOHO APPAREL PX TAG MSRP $30.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-08',    'SL-02 SOHO APPAREL PX TAG MSRP $35.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-09',    'SL-07 SOHO APPAREL PX TAG MSRP $48.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-10',    'SL-02 SOHO APPAREL PX TAG MSRP $48.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-11',    'SL-02 SOHO APPAREL PX TAG MSRP $55.00',   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-12',    'SL-49 FLARE',                              '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-13',    'SL-28 FLARE LEG',                          '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-14',    'SL-31 WIDE LEG',                           '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-15',    'SL-38 CULOTTE',                            '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-16',    'SL-48 WIDE LEG',                           '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-17',    'SL-45 PETITE HANGTAG',                     '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-18',    'SL-47 CROP',                               '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-19',    'SL-40 BURLINGTON PETITE',                   '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),
      ('HT-20',    'NICOLLE WITH RFID',                        '${map['HANGTAG']}','cái', 1.0, 0, '${V}', 0, 500),

      -- JOKER TAG
      ('JT-01',    'SL-16 SOHO APPAREL WHITE',           '${map['JOKER TAG']}','cái', 1.0, 0, '${V}', 0, 1000),
      ('JT-02',    'SL-03 SOHO APPAREL',                '${map['JOKER TAG']}','cái', 1.0, 0, '${V}', 0, 1000),

      -- SWIFTACK
      ('SW-01',    '1" CLEAR',                          '${map['SWIFTACK']}','cái', 1.0, 0, '${V}', 0, 500),
      ('SW-02',    '1" BLACK',                           '${map['SWIFTACK']}','cái', 1.0, 0, '${V}', 0, 500),
      ('SW-03',    '2" CLEAR',                           '${map['SWIFTACK']}','cái', 1.0, 0, '${V}', 0, 500),
      ('SW-04',    '3" CLEAR',                           '${map['SWIFTACK']}','cái', 1.0, 0, '${V}', 0, 500),
      ('SW-05',    '7" CLEAR',                           '${map['SWIFTACK']}','cái', 1.0, 0, '${V}', 0, 500),
      ('SW-06',    '9" CLEAR',                           '${map['SWIFTACK']}','cái', 1.0, 0, '${V}', 0, 500),

      -- HANGER
      ('HG-01',    '484-17',                            '${map['HANGER']}',  'cái', 1.0, 0, '${V}', 0, 500),
      ('HG-02',    '6012-12',                           '${map['HANGER']}',  'cái', 1.0, 0, '${V}', 0, 500),
      ('HG-03',    '6212-12',                           '${map['HANGER']}',  'cái', 1.0, 0, '${V}', 0, 500),

      -- CARTON
      ('CT-01',    'CARTON',                            '${map['CARTON']}',  'cái', 1.0, 0, '${V}', 0, 500),

      -- SHOULDER PAD
      ('SP-01',    'VN497',                             '${map['SHOULDER PAD']}','cái', 1.0, 0, '${V}', 0, 200),

      -- ZIPPER
      ('ZP-01',    'VN564 GUNMETAL',                    '${map['ZIPPER']}',  'cái', 1.0, 0, '${V}', 0, 200),

      -- ZIPPER TAPE
      ('ZT-01',    'ADMIRAL',                           '${map['ZIPPER TAPE']}','cái', 1.0, 0, '${V}', 0, 50),
      ('ZT-02',    'BLK',                               '${map['ZIPPER TAPE']}','cái', 1.0, 0, '${V}', 0, 50),
      ('ZT-03',    'LATTE',                             '${map['ZIPPER TAPE']}','cái', 1.0, 0, '${V}', 0, 50),
      ('ZT-04',    'BROWN',                             '${map['ZIPPER TAPE']}','cái', 1.0, 0, '${V}', 0, 50),

      -- ZIPPER PULL
      ('PP-01',    'VN-133 GOLD',                       '${map['ZIPPER PULL']}','cái', 1.0, 0, '${V}', 0, 500),
      ('PP-02',    'VN-133 SILVER',                     '${map['ZIPPER PULL']}','cái', 1.0, 0, '${V}', 0, 500),
      ('PP-03',    'VN-060 ANTI GOLD',                  '${map['ZIPPER PULL']}','cái', 1.0, 0, '${V}', 0, 500),
      ('PP-04',    'VN-060 GOLD',                       '${map['ZIPPER PULL']}','cái', 1.0, 0, '${V}', 0, 500),

      -- BUTTON
      ('BT-01',    '40L P.RIM SHINY BUTTON - DTM',     '${map['BUTTON']}',  'cái', 1.0, 0, '${V}', 0, 1000)
    `);

    // Seed sizes
    const allMats = await qr.query(`SELECT id, material_code FROM materials`);

    const SL_01 = allMats.find(m => m.material_code === 'SL-01')?.id;
    const SL_02 = allMats.find(m => m.material_code === 'SL-02')?.id;
    const CL_02 = allMats.find(m => m.material_code === 'CL-02')?.id;
    const JT_01 = allMats.find(m => m.material_code === 'JT-01')?.id;
    const JT_02 = allMats.find(m => m.material_code === 'JT-02')?.id;

    const ALL_SIZES  = ['S','M','L','XL','1X','2X','3X','PS','PM','PL','PXL','8','10','12','14','16','16W','18W','20W'];
    const SIZE_11    = ['S','M','L','XL','1X','2X','3X','PS','PM','PL','PXL'];

    if (SL_01) {
      await qr.query(`INSERT INTO material_sizes (material_id, size, current_stock) VALUES ` +
        ALL_SIZES.map(s => `('${SL_01}', '${s}', 0)`).join(', '));
    }
    if (SL_02) {
      await qr.query(`INSERT INTO material_sizes (material_id, size, current_stock) VALUES ` +
        ['S','M','L','XL'].map(s => `('${SL_02}', '${s}', 0)`).join(', '));
    }
    if (CL_02) {
      await qr.query(`INSERT INTO material_sizes (material_id, size, current_stock) VALUES ` +
        SIZE_11.map(s => `('${CL_02}', '${s}', 0)`).join(', '));
    }
    if (JT_01) {
      await qr.query(`INSERT INTO material_sizes (material_id, size, current_stock) VALUES ` +
        ALL_SIZES.map(s => `('${JT_01}', '${s}', 0)`).join(', '));
    }
    if (JT_02) {
      await qr.query(`INSERT INTO material_sizes (material_id, size, current_stock) VALUES ` +
        SIZE_11.map(s => `('${JT_02}', '${s}', 0)`).join(', '));
    }
  }

  public async down(_qr: QueryRunner): Promise<void> {}
}
