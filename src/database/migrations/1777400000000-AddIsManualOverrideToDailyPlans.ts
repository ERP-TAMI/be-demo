import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsManualOverrideToDailyPlans1777400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE daily_plans
      ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE daily_plans DROP COLUMN IF EXISTS is_manual_override
    `);
  }
}
