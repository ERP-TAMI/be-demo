import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropConsumptionPerUnitFromBomLines1776705298794 implements MigrationInterface {
  name = 'DropConsumptionPerUnitFromBomLines1776705298794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bom_lines" DROP COLUMN "consumption_per_unit"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'unit_cost * (1 + yield_pct/100)'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "bom_lines"."line_cost_per_unit" IS 'consumption * (1 + yield/100) * unit_cost'`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_lines" ADD "consumption_per_unit" numeric(10,4) NOT NULL DEFAULT '0'`,
    );
  }
}
