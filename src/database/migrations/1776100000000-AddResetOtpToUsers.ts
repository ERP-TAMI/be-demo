import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetOtpToUsers1776100000000 implements MigrationInterface {
  name = 'AddResetOtpToUsers1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "reset_otp" character varying(6),
        ADD COLUMN IF NOT EXISTS "reset_otp_expires_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "reset_otp_expires_at",
        DROP COLUMN IF EXISTS "reset_otp"
    `);
  }
}
