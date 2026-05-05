import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinalDocFieldsToProductionDocs1777800000000 implements MigrationInterface {
  name = 'AddFinalDocFieldsToProductionDocs1777800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_docs" ADD "final_doc_key" character varying(1000)`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_docs" ADD "final_doc_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_docs" ADD "final_doc_url" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_docs" DROP COLUMN "final_doc_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_docs" DROP COLUMN "final_doc_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_docs" DROP COLUMN "final_doc_key"`,
    );
  }
}
