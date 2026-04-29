import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToSizeRows1777395960530 implements MigrationInterface {
    name = 'AddImageUrlToSizeRows1777395960530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ADD "image_url" text`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ALTER COLUMN "row_name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "po_lines" ADD CONSTRAINT "FK_94d4e17181fae569c4ddc2ebcef" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "po_lines" DROP CONSTRAINT "FK_94d4e17181fae569c4ddc2ebcef"`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ALTER COLUMN "row_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" DROP COLUMN "image_url"`);
    }

}
