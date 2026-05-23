import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameFileLabelBomPdfToNplPdf1798000000000
  implements MigrationInterface
{
  name = 'RenameFileLabelBomPdfToNplPdf1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename 'BOM PDF' → 'NPL PDF' in po_files_label_enum
    await queryRunner.query(
      `ALTER TYPE "public"."po_files_label_enum" RENAME VALUE 'BOM PDF' TO 'NPL PDF'`,
    );

    // Rename 'BOM PDF' → 'NPL PDF' in line_files_label_enum
    await queryRunner.query(
      `ALTER TYPE "public"."line_files_label_enum" RENAME VALUE 'BOM PDF' TO 'NPL PDF'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."po_files_label_enum" RENAME VALUE 'NPL PDF' TO 'BOM PDF'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."line_files_label_enum" RENAME VALUE 'NPL PDF' TO 'BOM PDF'`,
    );
  }
}
