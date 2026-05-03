import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStyleIdToPoLines1790000000000 implements MigrationInterface {
  name = 'AddStyleIdToPoLines1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "po_lines"
      ADD COLUMN IF NOT EXISTS "style_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_po_lines_style'
        ) THEN
          ALTER TABLE "po_lines"
          ADD CONSTRAINT "FK_po_lines_style"
          FOREIGN KEY ("style_id") REFERENCES "styles"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_po_lines_style_id"
      ON "po_lines" ("style_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_po_lines_style_id"`);
    await queryRunner.query(`
      ALTER TABLE "po_lines" DROP CONSTRAINT IF EXISTS "FK_po_lines_style"
    `);
    await queryRunner.query(`
      ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "style_id"
    `);
  }
}
