import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMastersTables1776108996824 implements MigrationInterface {
  name = 'CreateMastersTables1776108996824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workshops_status_enum" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workshops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "manager" character varying(200), "location" character varying(255), "capacity" integer NOT NULL DEFAULT '0', "status" "public"."workshops_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_43a3dcc06a838a398e203c8d40f" UNIQUE ("workshop_code"), CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stages_status_enum" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stage_code" character varying(50) NOT NULL, "stage_name" character varying(255) NOT NULL, "description" text, "smv" numeric(8,3) NOT NULL DEFAULT '0', "status" "public"."stages_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_32df1c32e9079cba17a9a15b9a6" UNIQUE ("stage_code"), CONSTRAINT "PK_16efa0f8f5386328944769b9e6d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."materials_material_group_enum" AS ENUM('Vải chính', 'Vải lót', 'Phụ liệu', 'Nhãn & Bao bì')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."materials_status_enum" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "material_code" character varying(50) NOT NULL, "material_name" character varying(255) NOT NULL, "material_group" "public"."materials_material_group_enum" NOT NULL, "unit" character varying(50) NOT NULL, "default_yield_pct" numeric(5,2) NOT NULL DEFAULT '0', "last_unit_cost" numeric(15,2) NOT NULL DEFAULT '0', "status" "public"."materials_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_180eec59d9027e95b2467ec66f7" UNIQUE ("material_code"), CONSTRAINT "PK_2fd1a93ecb222a28bef28663fa0" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "materials"`);
    await queryRunner.query(`DROP TYPE "public"."materials_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."materials_material_group_enum"`,
    );
    await queryRunner.query(`DROP TABLE "stages"`);
    await queryRunner.query(`DROP TYPE "public"."stages_status_enum"`);
    await queryRunner.query(`DROP TABLE "workshops"`);
    await queryRunner.query(`DROP TYPE "public"."workshops_status_enum"`);
  }
}
