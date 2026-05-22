import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSizeChartsTable1796000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."size_charts_status_enum" AS ENUM('Active', 'Inactive');
    `);
    await queryRunner.query(`
      CREATE TABLE "size_charts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "sizes" jsonb NOT NULL DEFAULT '[]',
        "status" "public"."size_charts_status_enum" NOT NULL DEFAULT 'Active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_size_charts" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "size_charts";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."size_charts_status_enum";`);
  }
}
