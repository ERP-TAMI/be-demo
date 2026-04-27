import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToBomLines1777600000000 implements MigrationInterface {
  name = 'AddCreatedAtToBomLines1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bom_lines"
      ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bom_lines" DROP COLUMN IF EXISTS "created_at"`);
  }
}
