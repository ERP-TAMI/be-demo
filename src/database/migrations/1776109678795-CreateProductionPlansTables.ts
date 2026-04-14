import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductionPlansTables1776109678795 implements MigrationInterface {
  name = 'CreateProductionPlansTables1776109678795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "daily_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "day" smallint NOT NULL, "planned_qty" integer NOT NULL DEFAULT '0', "actual_qty" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_f0efedcf3380bb3834de2602627" UNIQUE ("plan_id", "day"), CONSTRAINT "PK_ebf4c93c574708a8ba6919252df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "production_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "line_id" uuid NOT NULL, "workshop_id" uuid, "month" smallint NOT NULL, "year" smallint NOT NULL, "planned_quantity" integer NOT NULL DEFAULT '0', "note" text, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_171d3990efc1882102b85f3b71e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_plans" ADD CONSTRAINT "FK_d5bcd4109a4edecb06c706259c2" FOREIGN KEY ("plan_id") REFERENCES "production_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_plans" ADD CONSTRAINT "FK_3b55512fc15736e893f69a64e5f" FOREIGN KEY ("line_id") REFERENCES "po_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_plans" ADD CONSTRAINT "FK_c2699caba528ab1be154bd5dc58" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_plans" ADD CONSTRAINT "FK_aeb91fc016c969848a5db32bb52" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_plans" DROP CONSTRAINT "FK_aeb91fc016c969848a5db32bb52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_plans" DROP CONSTRAINT "FK_c2699caba528ab1be154bd5dc58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_plans" DROP CONSTRAINT "FK_3b55512fc15736e893f69a64e5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_plans" DROP CONSTRAINT "FK_d5bcd4109a4edecb06c706259c2"`,
    );
    await queryRunner.query(`DROP TABLE "production_plans"`);
    await queryRunner.query(`DROP TABLE "daily_plans"`);
  }
}
