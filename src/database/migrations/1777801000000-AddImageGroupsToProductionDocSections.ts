import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageGroupsToProductionDocSections1777801000000
  implements MigrationInterface
{
  name = 'AddImageGroupsToProductionDocSections1777801000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_doc_sections" ADD "image_groups" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_doc_sections" DROP COLUMN "image_groups"`,
    );
  }
}
