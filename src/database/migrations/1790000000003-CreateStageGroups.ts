import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStageGroups1790000000003 implements MigrationInterface {
  name = 'CreateStageGroups1790000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Stage Groups (công đoạn cha)
    await queryRunner.query(`
      CREATE TYPE "public"."stage_groups_status_enum" AS ENUM('Active', 'Inactive')
    `);
    await queryRunner.query(`
      CREATE TABLE "stage_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "group_code" character varying(50) NOT NULL,
        "group_name" character varying(255) NOT NULL,
        "description" text,
        "status" "public"."stage_groups_status_enum" NOT NULL DEFAULT 'Active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stage_groups_group_code" UNIQUE ("group_code"),
        CONSTRAINT "PK_stage_groups" PRIMARY KEY ("id")
      )
    `);

    // Stage Group Items (công đoạn con thuộc nhóm)
    await queryRunner.query(`
      CREATE TABLE "stage_group_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL,
        "stage_name" character varying(255) NOT NULL,
        "description" text,
        "ssv" numeric(8,3) NOT NULL DEFAULT '10',
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stage_group_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stage_group_items_group" FOREIGN KEY ("group_id")
          REFERENCES "stage_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_stage_group_items_group_id" ON "stage_group_items" ("group_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_stage_group_items_group_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "stage_group_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stage_groups"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."stage_groups_status_enum"`,
    );
  }
}
