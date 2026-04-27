import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSampleVersionColumns17800000000000 implements MigrationInterface {
  name = 'AddSampleVersionColumns17800000000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE samples
      ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::jsonb
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE samples
      DROP COLUMN IF EXISTS version,
      DROP COLUMN IF EXISTS versions
    `);
  }
}
