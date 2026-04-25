import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileKeyToDocFiles1776972000000 implements MigrationInterface {
  name = 'AddFileKeyToDocFiles1776972000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doc_files"
      ADD COLUMN IF NOT EXISTS "file_key" varchar(1000)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doc_files" DROP COLUMN IF EXISTS "file_key"
    `);
  }
}
