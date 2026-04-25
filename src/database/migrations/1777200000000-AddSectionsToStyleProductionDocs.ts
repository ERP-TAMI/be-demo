import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSectionsToStyleProductionDocs1777200000000 implements MigrationInterface {
  name = 'AddSectionsToStyleProductionDocs1777200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      ADD COLUMN IF NOT EXISTS "sections" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      DROP COLUMN IF EXISTS "sections"
    `);
  }
}
