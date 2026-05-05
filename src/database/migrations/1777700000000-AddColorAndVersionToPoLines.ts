import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorAndVersionToPoLines1777700000000 implements MigrationInterface {
  name = 'AddColorAndVersionToPoLines1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create po_line_versions table
    await queryRunner.query(`
      CREATE TABLE "po_line_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "line_id" uuid NOT NULL,
        "version_no" integer NOT NULL,
        "snapshot_data" jsonb NOT NULL,
        "change_reason" text NOT NULL,
        "changed_by" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_po_line_versions" PRIMARY KEY ("id")
      )
    `);

    // 2. Add columns to po_lines
    await queryRunner.query(`
      ALTER TABLE "po_lines" ADD "color_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "po_lines" ADD "color_name" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "po_lines" ADD "version_number" integer NOT NULL DEFAULT '1'
    `);

    // 3. Add FK: po_lines -> colors
    await queryRunner.query(`
      ALTER TABLE "po_lines"
      ADD CONSTRAINT "FK_po_lines_color"
      FOREIGN KEY ("color_id") REFERENCES "colors"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 4. Add FK: po_line_versions -> po_lines
    await queryRunner.query(`
      ALTER TABLE "po_line_versions"
      ADD CONSTRAINT "FK_po_line_versions_line"
      FOREIGN KEY ("line_id") REFERENCES "po_lines"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 5. Create index for query performance
    await queryRunner.query(`
      CREATE INDEX "idx_po_line_versions_line_id" ON "po_line_versions"("line_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_po_line_versions_line_id"`,
    );

    // Drop FK
    await queryRunner.query(
      `ALTER TABLE "po_line_versions" DROP CONSTRAINT IF EXISTS "FK_po_line_versions_line"`,
    );

    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP CONSTRAINT IF EXISTS "FK_po_lines_color"`,
    );

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "version_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "color_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "color_id"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "po_line_versions"`);
  }
}
