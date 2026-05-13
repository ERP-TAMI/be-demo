import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinalFieldsToStyleProductionDocs1790000000008
  implements MigrationInterface
{
  name = 'AddFinalFieldsToStyleProductionDocs1790000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      ADD COLUMN IF NOT EXISTS "final_doc_key" text,
      ADD COLUMN IF NOT EXISTS "final_doc_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "final_doc_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      DROP COLUMN IF EXISTS "final_doc_url",
      DROP COLUMN IF EXISTS "final_doc_name",
      DROP COLUMN IF EXISTS "final_doc_key"
    `);
  }
}
