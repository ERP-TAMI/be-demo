import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMastersTables1776108996824 implements MigrationInterface {
  name = 'CreateMastersTables1776108996824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Workshops
    await queryRunner.query(
      `CREATE TYPE "public"."workshops_status_enum" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workshops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "manager" character varying(200), "location" character varying(255), "capacity" integer NOT NULL DEFAULT '0', "status" "public"."workshops_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_43a3dcc06a838a398e203c8d40f" UNIQUE ("workshop_code"), CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY ("id"))`,
    );

    // Stages
    await queryRunner.query(
      `CREATE TYPE "public"."stages_status_enum" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stage_code" character varying(50) NOT NULL, "stage_name" character varying(255) NOT NULL, "description" text, "smv" numeric(8,3) NOT NULL DEFAULT '0', "status" "public"."stages_status_enum" NOT NULL DEFAULT 'Active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_32df1c32e9079cba17a9a15b9a6" UNIQUE ("stage_code"), CONSTRAINT "PK_16efa0f8f5386328944769b9e6d" PRIMARY KEY ("id"))`,
    );

    // Material groups (entity-based: UUID PK, name, display_order, is_active)
    await queryRunner.query(`
      CREATE TABLE "material_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL UNIQUE,
        "display_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_material_groups" PRIMARY KEY ("id")
      )
    `);

    // Material status enum
    await queryRunner.query(
      `CREATE TYPE "public"."materials_status_enum" AS ENUM('Active', 'Inactive')`,
    );

    // Materials (entity-based: FK material_group_id, current_stock, low_stock_threshold)
    await queryRunner.query(`
      CREATE TABLE "materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "material_code" varchar(50) NOT NULL,
        "material_name" varchar(255) NOT NULL,
        "material_group_id" uuid,
        "unit" varchar(50) NOT NULL,
        "default_yield_pct" decimal(5,2) NOT NULL DEFAULT 0,
        "last_unit_cost" decimal(15,2) NOT NULL DEFAULT 0,
        "status" "public"."materials_status_enum" NOT NULL DEFAULT 'Active',
        "current_stock" decimal(15,2) NOT NULL DEFAULT 0,
        "low_stock_threshold" decimal(15,2) NOT NULL DEFAULT 10,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_materials" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_180eec59d9027e95b2467ec66f7" UNIQUE ("material_code"),
        CONSTRAINT "FK_materials_material_group" FOREIGN KEY ("material_group_id")
          REFERENCES "material_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Stock movements
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movements_movement_type_enum" AS ENUM('INBOUND', 'OUTBOUND', 'ADJUSTMENT')`,
    );
    await queryRunner.query(`
      CREATE TABLE "stock_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "material_id" uuid NOT NULL,
        "movement_type" "public"."stock_movements_movement_type_enum" NOT NULL,
        "quantity" decimal(15,2) NOT NULL,
        "reason" varchar(255),
        "created_by_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_movements_material" FOREIGN KEY ("material_id")
          REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_stock_movements_user" FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "idx_stock_movements_material_id" ON "stock_movements" ("material_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stock_movements_created_at" ON "stock_movements" ("created_at" DESC)`,
    );

    // Material sizes (entity-based)
    await queryRunner.query(`
      CREATE TABLE "material_sizes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "material_id" uuid NOT NULL,
        "size" varchar(20) NOT NULL,
        "barcode" varchar(50),
        "unit_cost" decimal(15,2),
        "current_stock" decimal(15,2) NOT NULL DEFAULT 0,
        "low_stock_threshold" decimal(15,2) NOT NULL DEFAULT 10,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_material_sizes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_material_sizes_material_size" UNIQUE ("material_id", "size"),
        CONSTRAINT "FK_material_sizes_material" FOREIGN KEY ("material_id")
          REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_material_sizes_material_id" ON "material_sizes" ("material_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_material_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_material_sizes_material_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "material_sizes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."stock_movements_movement_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "materials"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."materials_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "material_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stages"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."stages_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workshops"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."workshops_status_enum"`);
  }
}
