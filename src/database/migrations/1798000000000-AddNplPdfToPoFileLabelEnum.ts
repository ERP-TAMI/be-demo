import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNplPdfToPoFileLabelEnum1798000000000 implements MigrationInterface {
  name = 'AddNplPdfToPoFileLabelEnum1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."po_files_label_enum" ADD VALUE IF NOT EXISTS 'NPL PDF'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing an enum value safely in-place.
  }
}
