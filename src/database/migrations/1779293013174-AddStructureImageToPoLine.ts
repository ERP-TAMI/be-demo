import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStructureImageToPoLine1779293013174 implements MigrationInterface {
    name = 'AddStructureImageToPoLine1779293013174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "po_line_versions" DROP CONSTRAINT "FK_po_line_versions_line"`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_po_lines_style"`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_po_lines_color"`);
        await queryRunner.query(`ALTER TABLE "stage_group_items" DROP CONSTRAINT "FK_stage_group_items_group"`);
        await queryRunner.query(`DROP INDEX "public"."idx_po_line_versions_line_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_po_lines_style_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_stage_group_items_group_id"`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" DROP COLUMN "final_doc_key"`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" DROP COLUMN "final_doc_name"`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" DROP COLUMN "final_doc_url"`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD "structure_image" text`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ALTER COLUMN "row_name" SET DEFAULT ''`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."consumption_per_unit" IS 'Định mức tiêu hao: số NPL thực tế/SP, do R&D nhập'`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."yield_pct" IS 'Tỷ lệ dự trữ %, cố định 3% — hệ thống tự set'`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'consumption_per_unit * unit_cost'`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" ADD CONSTRAINT "FK_f77b5898680ec01bdab85fa72f2" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_94d4e17181fae569c4ddc2ebcef" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_dc15a13b6c089997d634b20daec" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stage_group_items" ADD CONSTRAINT "FK_90f43ed735d0aab50ec7ace2377" FOREIGN KEY ("group_id") REFERENCES "stage_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stage_group_items" DROP CONSTRAINT "FK_90f43ed735d0aab50ec7ace2377"`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_dc15a13b6c089997d634b20daec"`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_94d4e17181fae569c4ddc2ebcef"`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" DROP CONSTRAINT "FK_f77b5898680ec01bdab85fa72f2"`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'unit_cost * (1 + yield_pct/100)'`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."yield_pct" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."consumption_per_unit" IS NULL`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ALTER COLUMN "row_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "po_lines" DROP COLUMN "structure_image"`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" ADD "final_doc_url" text`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" ADD "final_doc_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" ADD "final_doc_key" text`);
        await queryRunner.query(`CREATE INDEX "idx_stage_group_items_group_id" ON "stage_group_items" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "idx_po_lines_style_id" ON "po_lines" ("style_id") `);
        await queryRunner.query(`CREATE INDEX "idx_po_line_versions_line_id" ON "po_line_versions" ("line_id") `);
        await queryRunner.query(`ALTER TABLE "stage_group_items" ADD CONSTRAINT "FK_stage_group_items_group" FOREIGN KEY ("group_id") REFERENCES "stage_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_po_lines_color" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_po_lines_style" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "po_line_versions" ADD CONSTRAINT "FK_po_line_versions_line" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
