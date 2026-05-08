import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterStyleBaseImageToText1790000000007 implements MigrationInterface {
  name = 'AlterStyleBaseImageToText1790000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "styles"
      ALTER COLUMN "base_image" TYPE text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "styles"
      ALTER COLUMN "base_image" TYPE varchar(500)
    `);
  }
}
