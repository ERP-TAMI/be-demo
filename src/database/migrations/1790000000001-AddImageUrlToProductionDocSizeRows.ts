import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToProductionDocSizeRows1790000000001 implements MigrationInterface {
    name = 'AddImageUrlToProductionDocSizeRows1790000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" ADD COLUMN IF NOT EXISTS "image_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "production_doc_size_rows" DROP COLUMN "image_url"`);
    }
}
