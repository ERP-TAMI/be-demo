import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocFoldersTables1776800000000 implements MigrationInterface {
  name = 'CreateDocFoldersTables1776800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doc_folders" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"        varchar(255) NOT NULL,
        "description" text,
        "created_by"  varchar(255),
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doc_folders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "doc_files" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"        varchar(500) NOT NULL,
        "type"        varchar(50) NOT NULL,
        "size"        varchar(50),
        "url"         varchar(1000),
        "folder_id"   uuid NOT NULL,
        "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doc_files" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doc_files_folder"
          FOREIGN KEY ("folder_id")
          REFERENCES "doc_folders"("id")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "doc_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doc_folders"`);
  }
}
