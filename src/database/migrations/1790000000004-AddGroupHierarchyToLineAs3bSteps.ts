import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupHierarchyToLineAs3bSteps1790000000004
  implements MigrationInterface
{
  name = 'AddGroupHierarchyToLineAs3bSteps1790000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "line_as3b_steps"
        ADD COLUMN IF NOT EXISTS "parent_row_id" uuid NULL,
        ADD COLUMN IF NOT EXISTS "is_group"       boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "group_id"       uuid NULL,
        ADD COLUMN IF NOT EXISTS "group_items"    jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "line_as3b_steps"
        DROP COLUMN IF EXISTS "parent_row_id",
        DROP COLUMN IF EXISTS "is_group",
        DROP COLUMN IF EXISTS "group_id",
        DROP COLUMN IF EXISTS "group_items"
    `);
  }
}
