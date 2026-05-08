import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAs3bPlanningColumns1790000000006
  implements MigrationInterface
{
  name = 'AddAs3bPlanningColumns1790000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "line_as3b_steps" ADD "target_total" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_as3b_steps" ADD "note" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "style_as3b_steps" ADD "target_total" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "style_as3b_steps" ADD "note" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" ADD "as3b_cm_base_days" integer NOT NULL DEFAULT 30`,
    );
    await queryRunner.query(
      `ALTER TABLE "styles" ADD "as3b_cm_base_days" integer NOT NULL DEFAULT 30`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "styles" DROP COLUMN "as3b_cm_base_days"`,
    );
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN "as3b_cm_base_days"`,
    );
    await queryRunner.query(
      `ALTER TABLE "style_as3b_steps" DROP COLUMN "note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "style_as3b_steps" DROP COLUMN "target_total"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_as3b_steps" DROP COLUMN "note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_as3b_steps" DROP COLUMN "target_total"`,
    );
  }
}
