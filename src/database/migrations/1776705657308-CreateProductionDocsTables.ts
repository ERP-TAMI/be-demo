import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductionDocsTables1776705657308 implements MigrationInterface {
  name = 'CreateProductionDocsTables1776705657308';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "production_doc_size_rows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doc_id" uuid NOT NULL, "row_name" character varying(255) NOT NULL, "s_value" character varying(50), "m_value" character varying(50), "l_value" character varying(50), "xl_value" character varying(50), "pattern_value" character varying(50), "tol_plus_minus" character varying(50), "order_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_b426fd543cc75dc2312c87042eb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "production_doc_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doc_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "content" text, "image_urls" text, "order_index" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_8dc77c51d730ea18648ea87ce53" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "production_docs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "section1_mo_ta" text, "section1_image_url" character varying(1000), "section2_phu_lieu" text, "section3_luu_y_trai_cat" text, "section4_comment_khach_hang" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8039074856efbedc2b78068b4f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_doc_size_rows" ADD CONSTRAINT "FK_d046c4b34b3f3237277abb4d302" FOREIGN KEY ("doc_id") REFERENCES "production_docs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_doc_sections" ADD CONSTRAINT "FK_5ccb2cb8fbd36393684860302db" FOREIGN KEY ("doc_id") REFERENCES "production_docs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_docs" ADD CONSTRAINT "FK_13b09380fec56e2aebd1b4e1d6e" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_docs" DROP CONSTRAINT "FK_13b09380fec56e2aebd1b4e1d6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_doc_sections" DROP CONSTRAINT "FK_5ccb2cb8fbd36393684860302db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_doc_size_rows" DROP CONSTRAINT "FK_d046c4b34b3f3237277abb4d302"`,
    );
    await queryRunner.query(`DROP TABLE "production_docs"`);
    await queryRunner.query(`DROP TABLE "production_doc_sections"`);
    await queryRunner.query(`DROP TABLE "production_doc_size_rows"`);
  }
}
