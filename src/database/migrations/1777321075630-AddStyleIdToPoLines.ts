import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStyleIdToPoLines1777321075630 implements MigrationInterface {
    name = 'AddStyleIdToPoLines1777321075630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "po_line_versions" DROP CONSTRAINT "FK_po_line_versions_line"`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_po_lines_color"`);
        await queryRunner.query(`DROP INDEX "public"."idx_po_line_versions_line_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_po_line_versions_version_no"`);
        await queryRunner.query(`DROP INDEX "public"."idx_po_lines_color_id"`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD "style_id" uuid`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" ALTER COLUMN "changed_by" DROP DEFAULT`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."consumption_per_unit" IS 'Định mức tiêu hao: số NPL thực tế/SP, do R&D nhập'`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."yield_pct" IS 'Tỷ lệ dự trữ %, cố định 3% — hệ thống tự set'`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'consumption_per_unit * 1.03 * unit_cost (wastage 3% cố định)'`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" ADD CONSTRAINT "FK_f77b5898680ec01bdab85fa72f2" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_dc15a13b6c089997d634b20daec" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_dc15a13b6c089997d634b20daec"`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" DROP CONSTRAINT "FK_f77b5898680ec01bdab85fa72f2"`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'unit_cost * (1 + yield_pct/100)'`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."yield_pct" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."consumption_per_unit" IS NULL`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" ALTER COLUMN "changed_by" SET DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP COLUMN "style_id"`);
        await queryRunner.query(`CREATE INDEX "idx_po_lines_color_id" ON "po_lines" ("color_id") `);
        await queryRunner.query(`CREATE INDEX "idx_po_line_versions_version_no" ON "po_line_versions" ("version_no") `);
        await queryRunner.query(`CREATE INDEX "idx_po_line_versions_line_id" ON "po_line_versions" ("line_id") `);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_po_lines_color" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" ADD CONSTRAINT "FK_po_line_versions_line" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
