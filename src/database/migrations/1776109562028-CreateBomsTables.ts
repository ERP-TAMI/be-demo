import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBomsTables1776109562028 implements MigrationInterface {
  name = 'CreateBomsTables1776109562028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bom_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bom_id" uuid NOT NULL, "master_material_id" uuid, "material_name" character varying(255) NOT NULL, "material_group" character varying(100) NOT NULL, "unit" character varying(50) NOT NULL, "consumption_per_unit" numeric(10,4) NOT NULL DEFAULT '0', "yield_pct" numeric(5,2) NOT NULL DEFAULT '0', "unit_cost" numeric(15,2) NOT NULL DEFAULT '0', "line_cost_per_unit" numeric(15,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_21f5a9ce67fd2be354c61f7c615" PRIMARY KEY ("id")); COMMENT ON COLUMN "bom_lines"."material_name" IS 'Denormalized for historical accuracy'; COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'consumption * (1 + yield/100) * unit_cost'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."boms_status_enum" AS ENUM('Draft', 'Wait_RD', 'Wait_Price', 'Wait_TP_Approve', 'Wait_SA_Approve', 'Approved', 'Locked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "boms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "po_id" uuid NOT NULL, "line_id" uuid NOT NULL, "color_id" uuid, "color_name" character varying(100), "style_code" character varying(100) NOT NULL, "product_name" character varying(255) NOT NULL, "po_quantity" integer NOT NULL DEFAULT '0', "version" integer NOT NULL DEFAULT '1', "status" "public"."boms_status_enum" NOT NULL DEFAULT 'Draft', "change_reason" text, "submitted_by" uuid, "submitted_at" TIMESTAMP WITH TIME ZONE, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "reject_reason" text, "rd_comment" text, "total_cost_per_unit" numeric(15,2) NOT NULL DEFAULT '0', "deadline" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_59659fde3f22d3869fee0f78822" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_lines" ADD CONSTRAINT "FK_3cb0a6dd2f8ecb1306aee71d459" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_lines" ADD CONSTRAINT "FK_a7a145d0821a339b79fc48fe7ff" FOREIGN KEY ("master_material_id") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" ADD CONSTRAINT "FK_5ecd5ca781c2cfce7d3140439ab" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" ADD CONSTRAINT "FK_70852d7ff4ac27d5efe2e77a311" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" ADD CONSTRAINT "FK_38464f395526d9a64fd90424ed3" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" ADD CONSTRAINT "FK_52f5a3a1f7634ef35868c315c81" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "boms" DROP CONSTRAINT "FK_52f5a3a1f7634ef35868c315c81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP CONSTRAINT "FK_38464f395526d9a64fd90424ed3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP CONSTRAINT "FK_70852d7ff4ac27d5efe2e77a311"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boms" DROP CONSTRAINT "FK_5ecd5ca781c2cfce7d3140439ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_lines" DROP CONSTRAINT "FK_a7a145d0821a339b79fc48fe7ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_lines" DROP CONSTRAINT "FK_3cb0a6dd2f8ecb1306aee71d459"`,
    );
    await queryRunner.query(`DROP TABLE "boms"`);
    await queryRunner.query(`DROP TYPE "public"."boms_status_enum"`);
    await queryRunner.query(`DROP TABLE "bom_lines"`);
  }
}
