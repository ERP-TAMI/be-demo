import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrdersTables1776109185467 implements MigrationInterface {
  name = 'CreatePurchaseOrdersTables1776109185467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."purchase_orders_status_enum" AS ENUM('Draft', 'Pending_RD', 'In_Progress', 'PO_Final', 'Cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "po_code" character varying(50) NOT NULL, "customer_po_code" character varying(100), "customer" character varying(255) NOT NULL, "received_date" date, "note" text, "status" "public"."purchase_orders_status_enum" NOT NULL DEFAULT 'Draft', "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "finalized_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_67f1c67fe65527e51fb47d2c3dc" UNIQUE ("po_code"), CONSTRAINT "PK_05148947415204a897e8beb2553" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."po_version_logs_event_type_enum" AS ENUM('PO_CREATED', 'PO_INFO_UPDATED', 'LINE_ADDED', 'LINE_UPDATED', 'LINE_STATUS_CHANGED', 'FILE_ADDED', 'FILE_REMOVED', 'SAMPLE_ADDED', 'PO_FINALIZED', 'FILE_ASSIGNED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "po_version_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "po_id" uuid NOT NULL, "actor" character varying(100), "event_type" "public"."po_version_logs_event_type_enum" NOT NULL, "reason" text, "target_id" uuid, "target_label" character varying(255), "changes" jsonb, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_aa146a5c65e41099d205af0a276" PRIMARY KEY ("id")); COMMENT ON COLUMN "po_version_logs"."changes" IS 'Array of {field, label, before, after}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."po_files_label_enum" AS ENUM('PO PDF', 'Tech-pack', 'BOM PDF', 'Hình mẫu', 'Tài liệu khác')`,
    );
    await queryRunner.query(
      `CREATE TABLE "po_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "po_id" uuid NOT NULL, "file_name" character varying(500) NOT NULL, "label" "public"."po_files_label_enum" NOT NULL DEFAULT 'Tài liệu khác', "version" integer NOT NULL DEFAULT '1', "file_group_id" uuid, "file_url" character varying(1000) NOT NULL, "size_mb" numeric(10,3), "uploaded_by" uuid, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_81b590d3ee78aeeaf61690cd82c" PRIMARY KEY ("id")); COMMENT ON COLUMN "po_files"."file_group_id" IS 'Groups versions of same file'`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_99f44faa1ca8d7ec9ebef918b06" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_version_logs" ADD CONSTRAINT "FK_7663fb038088c2ac723279a56d0" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_files" ADD CONSTRAINT "FK_0214d5250e31ba962e396c61d96" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_files" ADD CONSTRAINT "FK_c28a5ea7c43160bf308b81bf01d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "po_files" DROP CONSTRAINT "FK_c28a5ea7c43160bf308b81bf01d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_files" DROP CONSTRAINT "FK_0214d5250e31ba962e396c61d96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_version_logs" DROP CONSTRAINT "FK_7663fb038088c2ac723279a56d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_99f44faa1ca8d7ec9ebef918b06"`,
    );
    await queryRunner.query(`DROP TABLE "po_files"`);
    await queryRunner.query(`DROP TYPE "public"."po_files_label_enum"`);
    await queryRunner.query(`DROP TABLE "po_version_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."po_version_logs_event_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
    await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum"`);
  }
}
