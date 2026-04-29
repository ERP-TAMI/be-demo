import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Refactor PoLine cho quy trình chuẩn
 * 1. Thêm color_id, color_name vào po_lines (1 PoLine = 1 Màu)
 * 2. Thêm version_number vào po_lines (version control)
 * 3. Tạo bảng po_line_versions (snapshot lịch sử — không bao giờ ghi đè)
 */
export class RefactorPoLineAddColorVersion1781000000000
  implements MigrationInterface
{
  name = 'RefactorPoLineAddColorVersion1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Thêm color_id (FK → colors) ──────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "po_lines"
      ADD COLUMN IF NOT EXISTS "color_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "po_lines"
      ADD CONSTRAINT "FK_po_lines_color"
      FOREIGN KEY ("color_id") REFERENCES "colors"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // ── 2. Thêm color_name (denormalized để BOM kế thừa nhanh) ──────────────
    await queryRunner.query(`
      ALTER TABLE "po_lines"
      ADD COLUMN IF NOT EXISTS "color_name" varchar(100)
    `);

    // ── 3. Thêm version_number (mặc định 1) ─────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "po_lines"
      ADD COLUMN IF NOT EXISTS "version_number" int NOT NULL DEFAULT 1
    `);

    // ── 4. Tạo bảng po_line_versions ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "po_line_versions" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "line_id"       uuid NOT NULL,
        "version_no"    int NOT NULL,
        "snapshot_data" jsonb NOT NULL,
        "change_reason" text NOT NULL,
        "changed_by"    varchar(255) NOT NULL DEFAULT 'system',
        "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_po_line_versions" PRIMARY KEY ("id")
      )
    `);

    // FK: po_line_versions → po_lines (CASCADE xóa theo line)
    await queryRunner.query(`
      ALTER TABLE "po_line_versions"
      ADD CONSTRAINT "FK_po_line_versions_line"
      FOREIGN KEY ("line_id") REFERENCES "po_lines"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // ── 5. Indexes ─────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX "idx_po_lines_color_id" ON "po_lines"("color_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_po_line_versions_line_id" ON "po_line_versions"("line_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_po_line_versions_version_no" ON "po_line_versions"("version_no")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_po_line_versions_version_no"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_po_line_versions_line_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_po_lines_color_id"`,
    );

    // Drop FK + table po_line_versions
    await queryRunner.query(
      `ALTER TABLE "po_line_versions" DROP CONSTRAINT IF EXISTS "FK_po_line_versions_line"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "po_line_versions"`);

    // Drop columns từ po_lines
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "version_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "color_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP CONSTRAINT IF EXISTS "FK_po_lines_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "color_id"`,
    );
  }
}
