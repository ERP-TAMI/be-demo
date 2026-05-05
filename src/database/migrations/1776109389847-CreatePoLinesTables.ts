import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePoLinesTables1776109389847 implements MigrationInterface {
  name = 'CreatePoLinesTables1776109389847';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "line_color_sizes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "color_id" uuid NOT NULL, "size_label" character varying(20) NOT NULL, "quantity" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_7ecb924eb61ae3902aa393e1ee5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "line_colors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "color_name" character varying(100) NOT NULL, CONSTRAINT "PK_2b7160c999f09d94f2900470f1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."line_files_label_enum" AS ENUM('BOM PDF', 'Tech-pack', 'Bản dịch', 'Hình mẫu', 'Tài liệu khác')`,
    );
    await queryRunner.query(
      `CREATE TABLE "line_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "file_name" character varying(500) NOT NULL, "label" "public"."line_files_label_enum" NOT NULL DEFAULT 'Tài liệu khác', "version" integer NOT NULL DEFAULT '1', "file_group_id" uuid, "file_url" character varying(1000) NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c5411fee06b66ace298b9e11ab4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "line_as3b_steps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "stage_id" uuid, "step_name" character varying(255) NOT NULL, "description" text, "time_per_pc" numeric(8,3) NOT NULL DEFAULT '0', "ssv" numeric(8,3) NOT NULL DEFAULT '0', "order_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_e7e679d3b70ffff38c279150b92" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."po_lines_category_enum" AS ENUM('Shirt', 'Pants', 'Jacket', 'Polo', 'Shorts', 'Dress', 'Skirt')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."po_lines_status_enum" AS ENUM('Draft', 'In_Review', 'Sampling', 'Final', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "po_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "po_id" uuid NOT NULL, "style_code" character varying(100) NOT NULL, "product_name" character varying(255) NOT NULL, "category" "public"."po_lines_category_enum", "material" text, "deadline" date, "status" "public"."po_lines_status_enum" NOT NULL DEFAULT 'Draft', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3f9ea7f19964d20ecb77ef629cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."line_samples_status_enum" AS ENUM('Đang làm', 'Cần chỉnh sửa', 'Đã duyệt')`,
    );
    await queryRunner.query(
      `CREATE TABLE "line_samples" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "round" integer NOT NULL DEFAULT '1', "sample_date" date, "feedback" text, "status" "public"."line_samples_status_enum" NOT NULL DEFAULT 'Đang làm', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_48b34412f48fc6ea0f6c60f3a9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sample_color_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sample_id" uuid NOT NULL, "color_id" uuid, "color_name" character varying(100) NOT NULL, "image_url" character varying(1000) NOT NULL, CONSTRAINT "PK_91bccb349b27e9b326e60ef1b23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "line_mapped_files" ("line_id" uuid NOT NULL, "po_file_id" uuid NOT NULL, CONSTRAINT "PK_6e81a4394134535c3aa74454d5b" PRIMARY KEY ("line_id", "po_file_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_color_sizes" ADD CONSTRAINT "FK_543a0f5848f8e4c2581e798b042" FOREIGN KEY ("color_id") REFERENCES "line_colors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_colors" ADD CONSTRAINT "FK_d60580b94e38c1c4b42973f2d9a" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_files" ADD CONSTRAINT "FK_607e94274cdcbe41ade41bdd29e" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_as3b_steps" ADD CONSTRAINT "FK_bf52055d00bbd577d49a12f5476" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" ADD CONSTRAINT "FK_5c3cd4ad2dc26873a37a28a8f3f" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_samples" ADD CONSTRAINT "FK_4def577e283872fbb8919b37fe8" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sample_color_images" ADD CONSTRAINT "FK_fa7a140a03ff50528ab130f6cc6" FOREIGN KEY ("sample_id") REFERENCES "line_samples"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_mapped_files" ADD CONSTRAINT "FK_0901c196033e337a81f5c9cb9e3" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_mapped_files" ADD CONSTRAINT "FK_d20252e32b52044506bf1ac01b6" FOREIGN KEY ("po_file_id") REFERENCES "po_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "line_mapped_files" DROP CONSTRAINT "FK_d20252e32b52044506bf1ac01b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_mapped_files" DROP CONSTRAINT "FK_0901c196033e337a81f5c9cb9e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sample_color_images" DROP CONSTRAINT "FK_fa7a140a03ff50528ab130f6cc6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_samples" DROP CONSTRAINT "FK_4def577e283872fbb8919b37fe8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP CONSTRAINT "FK_5c3cd4ad2dc26873a37a28a8f3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_as3b_steps" DROP CONSTRAINT "FK_bf52055d00bbd577d49a12f5476"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_files" DROP CONSTRAINT "FK_607e94274cdcbe41ade41bdd29e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_colors" DROP CONSTRAINT "FK_d60580b94e38c1c4b42973f2d9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_color_sizes" DROP CONSTRAINT "FK_543a0f5848f8e4c2581e798b042"`,
    );
    await queryRunner.query(`DROP TABLE "line_mapped_files"`);
    await queryRunner.query(`DROP TABLE "sample_color_images"`);
    await queryRunner.query(`DROP TABLE "line_samples"`);
    await queryRunner.query(`DROP TYPE "public"."line_samples_status_enum"`);
    await queryRunner.query(`DROP TABLE "po_lines"`);
    await queryRunner.query(`DROP TYPE "public"."po_lines_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."po_lines_category_enum"`);
    await queryRunner.query(`DROP TABLE "line_as3b_steps"`);
    await queryRunner.query(`DROP TABLE "line_files"`);
    await queryRunner.query(`DROP TYPE "public"."line_files_label_enum"`);
    await queryRunner.query(`DROP TABLE "line_colors"`);
    await queryRunner.query(`DROP TABLE "line_color_sizes"`);
  }
}
