import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandPoVersionLogEventTypeEnum1776202000000
  implements MigrationInterface
{
  name = 'ExpandPoVersionLogEventTypeEnum1776202000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'LINE_FILE_ADDED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'LINE_FILE_REMOVED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'FILE_VERSION_ADDED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'BOM_CREATED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'BOM_UPDATED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'BOM_SUBMITTED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'BOM_APPROVED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'BOM_REJECTED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."po_version_logs_event_type_enum" ADD VALUE IF NOT EXISTS 'BOM_REVISED'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL enum values are append-only in-place; keep as no-op to avoid risky type rebuild.
  }
}
