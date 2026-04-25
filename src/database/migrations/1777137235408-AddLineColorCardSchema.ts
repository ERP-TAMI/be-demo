import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLineColorCardSchema1777137235408 implements MigrationInterface {
    name = 'AddLineColorCardSchema1777137235408'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."colors_status_enum" AS ENUM('Draft', 'Active', 'Inactive')`);
        await queryRunner.query(`CREATE TABLE "colors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "style_id" uuid NOT NULL, "color_name" character varying(100) NOT NULL, "color_image" character varying(500), "linked_sample_id" uuid, "status" "public"."colors_status_enum" NOT NULL DEFAULT 'Draft', "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3a62edc12d29307872ab1777ced" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."samples_sample_type_enum" AS ENUM('TechPack', 'Sketch', 'FitSample', 'Quotation')`);
        await queryRunner.query(`CREATE TYPE "public"."samples_status_enum" AS ENUM('Draft', 'In_Analysis', 'Analyzed', 'Approved')`);
        await queryRunner.query(`CREATE TABLE "samples" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sample_code" character varying(100) NOT NULL, "sample_type" "public"."samples_sample_type_enum" NOT NULL DEFAULT 'TechPack', "style_id" uuid, "color_id" uuid, "description" text, "analysis_result" text, "files" jsonb, "images" jsonb, "status" "public"."samples_status_enum" NOT NULL DEFAULT 'Draft', "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6a22623851b534b1d3f5f811851" UNIQUE ("sample_code"), CONSTRAINT "PK_d68b5b3bd25a6851b033fb63444" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "draft_bom_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "draft_bom_id" uuid NOT NULL, "master_material_id" uuid, "material_name" character varying(255) NOT NULL, "material_group" character varying(100), "unit" character varying(50), "consumption" numeric(10,4) NOT NULL DEFAULT '0', "unit_cost" numeric(5,2) NOT NULL DEFAULT '0', "yield_pct" numeric(5,2) NOT NULL DEFAULT '0', "line_cost_per_unit" numeric(12,4) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c7429807701d389b445bf5a2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."draft_boms_status_enum" AS ENUM('Draft', 'Submitted', 'Approved')`);
        await queryRunner.query(`CREATE TABLE "draft_boms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "draft_bom_code" character varying(100) NOT NULL, "style_id" uuid, "color_id" uuid, "version" integer NOT NULL DEFAULT '1', "trim_cost" numeric(12,2) NOT NULL DEFAULT '0', "quotation_price" numeric(12,2), "status" "public"."draft_boms_status_enum" NOT NULL DEFAULT 'Draft', "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f48e6c530d7cabd5dfbe65165fb" UNIQUE ("draft_bom_code"), CONSTRAINT "PK_7157cbb37ab525f6f0da5ed7c4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "style_as3b_steps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "style_id" uuid NOT NULL, "stage_id" uuid, "step_name" character varying(255) NOT NULL, "description" text, "time_per_pc" numeric(8,3) NOT NULL DEFAULT '0', "smv" numeric(8,3) NOT NULL DEFAULT '0', "order_index" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3ee291025e1f2c1b2b1ba49e93e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."style_production_docs_status_enum" AS ENUM('Draft', 'In_Progress', 'Completed')`);
        await queryRunner.query(`CREATE TABLE "style_production_docs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "style_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "status" "public"."style_production_docs_status_enum" NOT NULL DEFAULT 'Draft', "section1_description" text, "section1_image_url" character varying(500), "section2_accessories" text, "section3_notes" text, "section4_customer_feedback" text, "size_data" jsonb, "attachments" jsonb, "sections" jsonb, "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0432d7f51f7dfb105bc3eec2580" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."styles_status_enum" AS ENUM('Draft', 'In_Review', 'Approved', 'Active', 'Archived')`);
        await queryRunner.query(`CREATE TABLE "styles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "style_code" character varying(100) NOT NULL, "style_name" character varying(255) NOT NULL, "description" text, "category" character varying(100), "base_image" character varying(500), "sample_request_id" uuid, "status" "public"."styles_status_enum" NOT NULL DEFAULT 'Draft', "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1334a833f2cc34461e5324c77d7" UNIQUE ("style_code"), CONSTRAINT "PK_1f22d2e5045f508c5fce0eb6e86" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "style_version_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "style_id" uuid NOT NULL, "actor" character varying(255) NOT NULL, "type" character varying(100) NOT NULL, "reason" text NOT NULL, "target_id" uuid, "target_label" character varying(255), "changes" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3b49871e8b07b0cb28ba7c48d1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."line_color_cards_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "line_color_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_color_id" uuid NOT NULL, "file_path" character varying(500) NOT NULL, "file_name" character varying(200), "uploaded_by" uuid NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "public"."line_color_cards_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "REL_c30868ffdd3627c11bbeaaade1" UNIQUE ("line_color_id"), CONSTRAINT "PK_23503586be7a6b765b10a54c69e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "production_doc_size_rows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doc_id" uuid NOT NULL, "row_name" character varying(255) NOT NULL, "s_value" character varying(50), "m_value" character varying(50), "l_value" character varying(50), "xl_value" character varying(50), "pattern_value" character varying(50), "tol_plus_minus" character varying(50), "order_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_b426fd543cc75dc2312c87042eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "production_doc_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doc_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "content" text, "image_urls" text, "order_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_8dc77c51d730ea18648ea87ce53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "production_docs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "section1_mo_ta" text, "section1_image_url" character varying(1000), "section2_phu_lieu" text, "section3_luu_y_trai_cat" text, "section4_comment_khach_hang" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8039074856efbedc2b78068b4f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "master_po_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "master_po_id" uuid NOT NULL, "po_line_id" uuid NOT NULL, "notes" text, "linked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9b5eced37e6fa79398057997cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."master_pos_status_enum" AS ENUM('Draft', 'Confirmed', 'Partially_Shipped', 'Shipped')`);
        await queryRunner.query(`CREATE TABLE "master_pos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "master_po_code" character varying(100) NOT NULL, "container_name" character varying(255), "shipping_month" character varying(20), "estimated_ship_date" TIMESTAMP WITH TIME ZONE, "total_quantity" integer NOT NULL DEFAULT '0', "total_trim_cost" numeric(14,2) NOT NULL DEFAULT '0', "status" "public"."master_pos_status_enum" NOT NULL DEFAULT 'Draft', "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_da5b462e94abdc8e357dd4254c1" UNIQUE ("master_po_code"), CONSTRAINT "PK_f3dfc2b759cd2391a102650eb60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doc_folders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "created_by" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_17e35ccbfec65e4d40d43a391fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doc_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(500) NOT NULL, "type" character varying(50) NOT NULL, "size" character varying(50), "url" character varying(1000), "file_key" character varying(1000), "folder_id" uuid NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7347cc8a5fa8f0105449a13b204" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bom_lines" DROP COLUMN "consumption_per_unit"`);
        await queryRunner.query(`ALTER TYPE "public"."po_lines_status_enum" RENAME TO "po_lines_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."po_lines_previous_status_enum" AS ENUM('Draft', 'In_Review', 'Sampling', 'Final', 'Cancelled')`);
        await queryRunner.query(`ALTER TABLE "po_lines" ALTER COLUMN "previous_status" TYPE "public"."po_lines_previous_status_enum" USING "previous_status"::"text"::"public"."po_lines_previous_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."po_lines_status_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'unit_cost * (1 + yield_pct/100)'`);
        await queryRunner.query(`ALTER TABLE "colors" ADD CONSTRAINT "FK_2755f5c3c12ce91259b3290b77b" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "samples" ADD CONSTRAINT "FK_78786f9c337cb27d6c452cbf67d" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "samples" ADD CONSTRAINT "FK_0963fdf415b99350f6b96513880" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "draft_bom_lines" ADD CONSTRAINT "FK_e776df6c7559ddfa977576e6c84" FOREIGN KEY ("draft_bom_id") REFERENCES "draft_boms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "draft_bom_lines" ADD CONSTRAINT "FK_a4f4d8a75aa70f90885167e4163" FOREIGN KEY ("master_material_id") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "draft_boms" ADD CONSTRAINT "FK_7479e3d5f34727f6113adb18a1f" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "draft_boms" ADD CONSTRAINT "FK_5cee347416a10073dab68775d04" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" ADD CONSTRAINT "FK_556acb2cd5b041402640c5148fc" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" ADD CONSTRAINT "FK_d3e8f180af324c2a96437394ef3" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "line_color_cards" ADD CONSTRAINT "FK_c30868ffdd3627c11bbeaaade18" FOREIGN KEY ("line_color_id") REFERENCES "line_colors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ADD CONSTRAINT "FK_d046c4b34b3f3237277abb4d302" FOREIGN KEY ("doc_id") REFERENCES "production_docs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "production_doc_sections" ADD CONSTRAINT "FK_5ccb2cb8fbd36393684860302db" FOREIGN KEY ("doc_id") REFERENCES "production_docs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "production_docs" ADD CONSTRAINT "FK_13b09380fec56e2aebd1b4e1d6e" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "master_po_lines" ADD CONSTRAINT "FK_4fd6178729af3ec73ab3ec8b133" FOREIGN KEY ("master_po_id") REFERENCES "master_pos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "master_po_lines" ADD CONSTRAINT "FK_4bbff3330c1cc97944d99adb37c" FOREIGN KEY ("po_line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doc_files" ADD CONSTRAINT "FK_257c0d5e9d98c5092c39f3b7874" FOREIGN KEY ("folder_id") REFERENCES "doc_folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doc_files" DROP CONSTRAINT "FK_257c0d5e9d98c5092c39f3b7874"`);
        await queryRunner.query(`ALTER TABLE "master_po_lines" DROP CONSTRAINT "FK_4bbff3330c1cc97944d99adb37c"`);
        await queryRunner.query(`ALTER TABLE "master_po_lines" DROP CONSTRAINT "FK_4fd6178729af3ec73ab3ec8b133"`);
        await queryRunner.query(`ALTER TABLE "production_docs" DROP CONSTRAINT "FK_13b09380fec56e2aebd1b4e1d6e"`);
        await queryRunner.query(`ALTER TABLE "production_doc_sections" DROP CONSTRAINT "FK_5ccb2cb8fbd36393684860302db"`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" DROP CONSTRAINT "FK_d046c4b34b3f3237277abb4d302"`);
        await queryRunner.query(`ALTER TABLE "line_color_cards" DROP CONSTRAINT "FK_c30868ffdd3627c11bbeaaade18"`);
        await queryRunner.query(`ALTER TABLE "style_production_docs" DROP CONSTRAINT "FK_d3e8f180af324c2a96437394ef3"`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" DROP CONSTRAINT "FK_556acb2cd5b041402640c5148fc"`);
        await queryRunner.query(`ALTER TABLE "draft_boms" DROP CONSTRAINT "FK_5cee347416a10073dab68775d04"`);
        await queryRunner.query(`ALTER TABLE "draft_boms" DROP CONSTRAINT "FK_7479e3d5f34727f6113adb18a1f"`);
        await queryRunner.query(`ALTER TABLE "draft_bom_lines" DROP CONSTRAINT "FK_a4f4d8a75aa70f90885167e4163"`);
        await queryRunner.query(`ALTER TABLE "draft_bom_lines" DROP CONSTRAINT "FK_e776df6c7559ddfa977576e6c84"`);
        await queryRunner.query(`ALTER TABLE "samples" DROP CONSTRAINT "FK_0963fdf415b99350f6b96513880"`);
        await queryRunner.query(`ALTER TABLE "samples" DROP CONSTRAINT "FK_78786f9c337cb27d6c452cbf67d"`);
        await queryRunner.query(`ALTER TABLE "colors" DROP CONSTRAINT "FK_2755f5c3c12ce91259b3290b77b"`);
        await queryRunner.query(`COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'consumption * (1 + yield/100) * unit_cost'`);
        await queryRunner.query(`CREATE TYPE "public"."po_lines_status_enum_old" AS ENUM('Draft', 'In_Review', 'Sampling', 'Final', 'Cancelled')`);
        await queryRunner.query(`ALTER TABLE "po_lines" ALTER COLUMN "previous_status" TYPE "public"."po_lines_status_enum_old" USING "previous_status"::"text"::"public"."po_lines_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."po_lines_previous_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."po_lines_status_enum_old" RENAME TO "po_lines_status_enum"`);
        await queryRunner.query(`ALTER TABLE "bom_lines" ADD "consumption_per_unit" numeric(10,4) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP TABLE "doc_files"`);
        await queryRunner.query(`DROP TABLE "doc_folders"`);
        await queryRunner.query(`DROP TABLE "master_pos"`);
        await queryRunner.query(`DROP TYPE "public"."master_pos_status_enum"`);
        await queryRunner.query(`DROP TABLE "master_po_lines"`);
        await queryRunner.query(`DROP TABLE "production_docs"`);
        await queryRunner.query(`DROP TABLE "production_doc_sections"`);
        await queryRunner.query(`DROP TABLE "production_doc_size_rows"`);
        await queryRunner.query(`DROP TABLE "line_color_cards"`);
        await queryRunner.query(`DROP TYPE "public"."line_color_cards_status_enum"`);
        await queryRunner.query(`DROP TABLE "style_version_logs"`);
        await queryRunner.query(`DROP TABLE "styles"`);
        await queryRunner.query(`DROP TYPE "public"."styles_status_enum"`);
        await queryRunner.query(`DROP TABLE "style_production_docs"`);
        await queryRunner.query(`DROP TYPE "public"."style_production_docs_status_enum"`);
        await queryRunner.query(`DROP TABLE "style_as3b_steps"`);
        await queryRunner.query(`DROP TABLE "draft_boms"`);
        await queryRunner.query(`DROP TYPE "public"."draft_boms_status_enum"`);
        await queryRunner.query(`DROP TABLE "draft_bom_lines"`);
        await queryRunner.query(`DROP TABLE "samples"`);
        await queryRunner.query(`DROP TYPE "public"."samples_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."samples_sample_type_enum"`);
        await queryRunner.query(`DROP TABLE "colors"`);
        await queryRunner.query(`DROP TYPE "public"."colors_status_enum"`);
    }

}
