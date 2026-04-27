import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConsumptionPerUnitToBomLines1777500000000
  implements MigrationInterface
{
  name = 'AddConsumptionPerUnitToBomLines1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bom_lines"
      ADD COLUMN "consumption_per_unit" DECIMAL(10,4) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bom_lines" DROP COLUMN IF EXISTS "consumption_per_unit"
    `);
  }
}
