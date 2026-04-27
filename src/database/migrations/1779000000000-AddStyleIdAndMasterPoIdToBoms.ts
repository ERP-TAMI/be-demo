import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStyleIdAndMasterPoIdToBoms1779000000000 implements MigrationInterface {
  name = 'AddStyleIdAndMasterPoIdToBoms1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "boms" 
      ADD COLUMN IF NOT EXISTS "style_id" uuid,
      ADD COLUMN IF NOT EXISTS "master_po_id" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "boms" 
      DROP COLUMN IF EXISTS "style_id",
      DROP COLUMN IF EXISTS "master_po_id"
    `);
  }
}
