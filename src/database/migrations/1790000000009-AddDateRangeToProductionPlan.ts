import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateRangeToProductionPlan1790000000009 implements MigrationInterface {
    name = 'AddDateRangeToProductionPlan1790000000009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "production_plans" ADD "start_date" date`);
        await queryRunner.query(`ALTER TABLE "production_plans" ADD "end_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "production_plans" DROP COLUMN "end_date"`);
        await queryRunner.query(`ALTER TABLE "production_plans" DROP COLUMN "start_date"`);
    }

}
