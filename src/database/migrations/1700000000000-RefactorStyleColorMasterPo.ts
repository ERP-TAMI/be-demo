import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorStyleColorMasterPo1700000000000
  implements MigrationInterface
{
  name = 'RefactorStyleColorMasterPo1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========== SECTION 1: Tao bang moi ==========

    // 1.1 Bang Style
    await queryRunner.query(`
      CREATE TABLE "styles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "style_code" varchar(100) NOT NULL UNIQUE,
        "style_name" varchar(255) NOT NULL,
        "description" text,
        "category" varchar(100),
        "base_image" varchar(500),
        "sample_request_id" uuid,
        "status" varchar(50) NOT NULL DEFAULT 'Draft',
        "created_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_styles" PRIMARY KEY ("id")
      )
    `);

    // 1.2 Bang Color
    await queryRunner.query(`
      CREATE TABLE "colors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "style_id" uuid,
        "color_name" varchar(100) NOT NULL,
        "color_image" varchar(500),
        "linked_sample_id" uuid,
        "status" varchar(50) NOT NULL DEFAULT 'Draft',
        "created_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_colors" PRIMARY KEY ("id")
      )
    `);

    // 1.3 Bang Sample
    await queryRunner.query(`
      CREATE TABLE "samples" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sample_code" varchar(100) NOT NULL UNIQUE,
        "sample_type" varchar(50) NOT NULL DEFAULT 'TechPack',
        "style_id" uuid,
        "color_id" uuid,
        "description" text,
        "analysis_result" text,
        "files" jsonb,
        "images" jsonb,
        "status" varchar(50) NOT NULL DEFAULT 'Draft',
        "created_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_samples" PRIMARY KEY ("id")
      )
    `);

    // 1.4 Bang Draft BOM
    await queryRunner.query(`
      CREATE TABLE "draft_boms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "draft_bom_code" varchar(100) NOT NULL UNIQUE,
        "style_id" uuid,
        "color_id" uuid,
        "version" int NOT NULL DEFAULT 1,
        "trim_cost" decimal(12,2) NOT NULL DEFAULT 0,
        "quotation_price" decimal(12,2),
        "status" varchar(50) NOT NULL DEFAULT 'Draft',
        "created_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_draft_boms" PRIMARY KEY ("id")
      )
    `);

    // 1.5 Bang Draft BOM Lines
    await queryRunner.query(`
      CREATE TABLE "draft_bom_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "draft_bom_id" uuid NOT NULL,
        "master_material_id" uuid,
        "material_name" varchar(255) NOT NULL,
        "material_group" varchar(100),
        "unit" varchar(50),
        "consumption" decimal(10,4) NOT NULL DEFAULT 0,
        "unit_cost" decimal(5,2) NOT NULL DEFAULT 0,
        "yield_pct" decimal(5,2) NOT NULL DEFAULT 0,
        "line_cost_per_unit" decimal(12,4) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_draft_bom_lines" PRIMARY KEY ("id")
      )
    `);

    // 1.6 Bang Master PO
    await queryRunner.query(`
      CREATE TABLE "master_pos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "master_po_code" varchar(100) NOT NULL UNIQUE,
        "container_name" varchar(255),
        "shipping_month" varchar(20),
        "estimated_ship_date" TIMESTAMP WITH TIME ZONE,
        "total_quantity" int NOT NULL DEFAULT 0,
        "total_trim_cost" decimal(14,2) NOT NULL DEFAULT 0,
        "status" varchar(50) NOT NULL DEFAULT 'Draft',
        "created_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_master_pos" PRIMARY KEY ("id")
      )
    `);

    // 1.7 Bang Master PO Lines (linking table)
    await queryRunner.query(`
      CREATE TABLE "master_po_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "master_po_id" uuid NOT NULL,
        "po_line_id" uuid NOT NULL,
        "notes" text,
        "linked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_master_po_lines" PRIMARY KEY ("id")
      )
    `);

    // ========== SECTION 2: Cap nhat bang cu ==========

    // 2.1 Them cot styleId vao bang po_lines
    await queryRunner.query(`
      ALTER TABLE "po_lines" 
      ADD COLUMN "style_id" uuid
    `);

    // 2.2 Them cot styleId vao bang boms
    await queryRunner.query(`
      ALTER TABLE "boms" 
      ADD COLUMN "style_id" uuid
    `);

    // 2.3 Them cot masterPoId vao bang boms
    await queryRunner.query(`
      ALTER TABLE "boms" 
      ADD COLUMN "master_po_id" uuid
    `);

    // 2.4 Them cot colorId vao bang line_samples
    await queryRunner.query(`
      ALTER TABLE "line_samples" 
      ADD COLUMN "color_id" uuid
    `);

    // ========== SECTION 3: Migrate du lieu cu ==========

    // 3.1 Migrate Style tu po_lines (xu ly duplicate bang ON CONFLICT)
    await queryRunner.query(`
      INSERT INTO "styles" ("style_code", "style_name", "category", "status", "created_at", "created_by")
      SELECT DISTINCT "style_code", "product_name", "category", 'Active', NOW(), 'migration'
      FROM "po_lines"
      WHERE "style_code" IS NOT NULL AND "style_code" != ''
      ON CONFLICT ("style_code") DO NOTHING
    `);

    // 3.2 Migrate Color tu line_colors (neu co du lieu)
    // line_colors chi co line_id, can JOIN po_lines de lay style_code
    await queryRunner.query(`
      INSERT INTO "colors" ("style_id", "color_name", "status", "created_at", "created_by")
      SELECT DISTINCT s.id, lc."color_name", 'Active', NOW(), 'migration'
      FROM "line_colors" lc
      INNER JOIN "po_lines" pol ON pol.id = lc."line_id"
      INNER JOIN "styles" s ON s."style_code" = pol."style_code"
      WHERE lc."color_name" IS NOT NULL AND lc."color_name" != ''
      ON CONFLICT DO NOTHING
    `);

    // 3.3 Update styleId cho po_lines
    await queryRunner.query(`
      UPDATE "po_lines" po
      SET "style_id" = s.id
      FROM "styles" s
      WHERE po."style_code" = s."style_code" AND po."style_code" IS NOT NULL
    `);

    // 3.4 Update styleId cho boms
    await queryRunner.query(`
      UPDATE "boms" b
      SET "style_id" = s.id
      FROM "styles" s
      WHERE b."style_code" = s."style_code"
    `);

    // ========== SECTION 4: Them Foreign Keys ==========

    // FK: colors -> styles
    await queryRunner.query(`
      ALTER TABLE "colors" 
      ADD CONSTRAINT "FK_colors_style" 
      FOREIGN KEY ("style_id") REFERENCES "styles"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // FK: samples -> styles
    await queryRunner.query(`
      ALTER TABLE "samples" 
      ADD CONSTRAINT "FK_samples_style" 
      FOREIGN KEY ("style_id") REFERENCES "styles"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // FK: samples -> colors
    await queryRunner.query(`
      ALTER TABLE "samples" 
      ADD CONSTRAINT "FK_samples_color" 
      FOREIGN KEY ("color_id") REFERENCES "colors"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // FK: draft_boms -> styles
    await queryRunner.query(`
      ALTER TABLE "draft_boms" 
      ADD CONSTRAINT "FK_draft_boms_style" 
      FOREIGN KEY ("style_id") REFERENCES "styles"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // FK: draft_boms -> colors
    await queryRunner.query(`
      ALTER TABLE "draft_boms" 
      ADD CONSTRAINT "FK_draft_boms_color" 
      FOREIGN KEY ("color_id") REFERENCES "colors"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // FK: draft_bom_lines -> draft_boms
    await queryRunner.query(`
      ALTER TABLE "draft_bom_lines" 
      ADD CONSTRAINT "FK_draft_bom_lines_draft_bom" 
      FOREIGN KEY ("draft_bom_id") REFERENCES "draft_boms"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // FK: draft_bom_lines -> materials
    await queryRunner.query(`
      ALTER TABLE "draft_bom_lines" 
      ADD CONSTRAINT "FK_draft_bom_lines_material" 
      FOREIGN KEY ("master_material_id") REFERENCES "materials"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // FK: master_pos -> self (none needed)

    // FK: master_po_lines -> master_pos
    await queryRunner.query(`
      ALTER TABLE "master_po_lines" 
      ADD CONSTRAINT "FK_master_po_lines_master_po" 
      FOREIGN KEY ("master_po_id") REFERENCES "master_pos"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // FK: master_po_lines -> po_lines
    await queryRunner.query(`
      ALTER TABLE "master_po_lines" 
      ADD CONSTRAINT "FK_master_po_lines_po_line" 
      FOREIGN KEY ("po_line_id") REFERENCES "po_lines"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // FK: boms -> styles
    await queryRunner.query(`
      ALTER TABLE "boms" 
      ADD CONSTRAINT "FK_boms_style" 
      FOREIGN KEY ("style_id") REFERENCES "styles"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // FK: boms -> master_pos
    await queryRunner.query(`
      ALTER TABLE "boms" 
      ADD CONSTRAINT "FK_boms_master_po" 
      FOREIGN KEY ("master_po_id") REFERENCES "master_pos"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // FK: po_lines -> styles
    await queryRunner.query(`
      ALTER TABLE "po_lines" 
      ADD CONSTRAINT "FK_po_lines_style" 
      FOREIGN KEY ("style_id") REFERENCES "styles"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // FK: line_samples -> colors
    await queryRunner.query(`
      ALTER TABLE "line_samples" 
      ADD CONSTRAINT "FK_line_samples_color" 
      FOREIGN KEY ("color_id") REFERENCES "colors"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // ========== SECTION 5: Seed data ==========

    // Seed default colors cho cac style chua co color
    await queryRunner.query(`
      INSERT INTO "colors" ("style_id", "color_name", "status", "created_at", "created_by")
      SELECT id, 'Default', 'Active', NOW(), 'migration_seed'
      FROM "styles" s
      WHERE NOT EXISTS (
        SELECT 1 FROM "colors" c WHERE c."style_id" = s.id
      )
    `);

    // ========== SECTION 6: Indexes ==========

    await queryRunner.query(
      `CREATE INDEX "idx_styles_style_code" ON "styles"("style_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_styles_status" ON "styles"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_colors_style_id" ON "colors"("style_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_colors_status" ON "colors"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_samples_style_id" ON "samples"("style_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_samples_color_id" ON "samples"("color_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_samples_status" ON "samples"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_draft_boms_style_id" ON "draft_boms"("style_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_draft_boms_color_id" ON "draft_boms"("color_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_draft_boms_status" ON "draft_boms"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_master_pos_code" ON "master_pos"("master_po_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_master_pos_status" ON "master_pos"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_master_pos_shipping_month" ON "master_pos"("shipping_month")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_master_po_lines_master_po_id" ON "master_po_lines"("master_po_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_master_po_lines_po_line_id" ON "master_po_lines"("po_line_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_po_lines_style_id" ON "po_lines"("style_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_boms_style_id" ON "boms"("style_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_boms_master_po_id" ON "boms"("master_po_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xoa indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_boms_master_po_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_boms_style_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_po_lines_style_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_master_po_lines_po_line_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_master_po_lines_master_po_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_master_pos_shipping_month"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_master_pos_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_master_pos_code"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_draft_boms_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_draft_boms_color_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_draft_boms_style_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_samples_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_samples_color_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_samples_style_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_colors_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_colors_style_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_styles_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_styles_style_code"`,
    );

    // Xoa foreign keys (theo thu tu nguoc lai)
    await queryRunner.query(
      `ALTER TABLE "line_samples" DROP CONSTRAINT IF EXISTS "FK_line_samples_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP CONSTRAINT IF EXISTS "FK_po_lines_style"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP CONSTRAINT IF EXISTS "FK_boms_master_po"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP CONSTRAINT IF EXISTS "FK_boms_style"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_po_lines" DROP CONSTRAINT IF EXISTS "FK_master_po_lines_po_line"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_po_lines" DROP CONSTRAINT IF EXISTS "FK_master_po_lines_master_po"`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_bom_lines" DROP CONSTRAINT IF EXISTS "FK_draft_bom_lines_material"`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_bom_lines" DROP CONSTRAINT IF EXISTS "FK_draft_bom_lines_draft_bom"`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_boms" DROP CONSTRAINT IF EXISTS "FK_draft_boms_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "draft_boms" DROP CONSTRAINT IF EXISTS "FK_draft_boms_style"`,
    );
    await queryRunner.query(
      `ALTER TABLE "samples" DROP CONSTRAINT IF EXISTS "FK_samples_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "samples" DROP CONSTRAINT IF EXISTS "FK_samples_style"`,
    );
    await queryRunner.query(
      `ALTER TABLE "colors" DROP CONSTRAINT IF EXISTS "FK_colors_style"`,
    );

    // Xoa bang moi (theo thu tu nguoc lai de tranh loi FK)
    await queryRunner.query(`DROP TABLE IF EXISTS "master_po_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_pos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "draft_bom_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "draft_boms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "samples"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "colors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "styles"`);

    // Xoa cac cot da them
    await queryRunner.query(
      `ALTER TABLE "line_samples" DROP COLUMN IF EXISTS "color_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP COLUMN IF EXISTS "master_po_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP COLUMN IF EXISTS "style_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN IF EXISTS "style_id"`,
    );
  }
}
