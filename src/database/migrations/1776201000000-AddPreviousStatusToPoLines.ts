import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreviousStatusToPoLines1776201000000 implements MigrationInterface {
  name = 'AddPreviousStatusToPoLines1776201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "po_lines" ADD "previous_status" "public"."po_lines_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN "previous_status"`,
    );
  }
}
