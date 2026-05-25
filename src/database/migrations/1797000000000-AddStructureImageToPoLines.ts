import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStructureImageToPoLines1797000000000 implements MigrationInterface {
  name = 'AddStructureImageToPoLines1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "po_lines" ADD COLUMN IF NOT EXISTS "structure_image" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "po_lines" DROP COLUMN "structure_image"`,
    );
  }
}
