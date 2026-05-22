import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCopyMetadataToProductionDocs1795000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      ADD COLUMN IF NOT EXISTS "copied_from_style_id" uuid NULL,
      ADD COLUMN IF NOT EXISTS "copied_at" timestamptz NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      DROP COLUMN IF EXISTS "copied_at",
      DROP COLUMN IF EXISTS "copied_from_style_id";
    `);
  }
}
