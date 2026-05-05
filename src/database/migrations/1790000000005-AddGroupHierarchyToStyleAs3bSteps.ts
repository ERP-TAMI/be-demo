import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupHierarchyToStyleAs3bSteps1790000000005 implements MigrationInterface {
    name = 'AddGroupHierarchyToStyleAs3bSteps1790000000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" ADD "parent_row_id" uuid`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" ADD "is_group" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" ADD "group_id" uuid`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" ADD "group_items" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" DROP COLUMN "group_items"`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" DROP COLUMN "is_group"`);
        await queryRunner.query(`ALTER TABLE "style_as3b_steps" DROP COLUMN "parent_row_id"`);
    }

}
