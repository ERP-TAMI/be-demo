import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStyleDetailTables1777110000000 implements MigrationInterface {
  name = 'CreateStyleDetailTables1777110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'style_production_docs_status_enum'
        ) THEN
          CREATE TYPE "style_production_docs_status_enum" AS ENUM ('Draft', 'In_Progress', 'Completed');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "style_as3b_steps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "style_id" uuid NOT NULL,
        "stage_id" uuid,
        "step_name" varchar(255) NOT NULL,
        "description" text,
        "time_per_pc" decimal(8,3) NOT NULL DEFAULT 0,
        "smv" decimal(8,3) NOT NULL DEFAULT 0,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_style_as3b_steps" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "style_version_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "style_id" uuid NOT NULL,
        "actor" varchar(255) NOT NULL,
        "type" varchar(100) NOT NULL,
        "reason" text NOT NULL,
        "target_id" uuid,
        "target_label" varchar(255),
        "changes" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_style_version_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "style_production_docs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "style_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "status" "style_production_docs_status_enum" NOT NULL DEFAULT 'Draft',
        "section1_description" text,
        "section1_image_url" varchar(500),
        "section2_accessories" text,
        "section3_notes" text,
        "section4_customer_feedback" text,
        "size_data" jsonb,
        "attachments" jsonb,
        "sections" jsonb,
        "created_by" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_style_production_docs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_style_as3b_steps_style'
        ) THEN
          ALTER TABLE "style_as3b_steps"
          ADD CONSTRAINT "FK_style_as3b_steps_style"
          FOREIGN KEY ("style_id") REFERENCES "styles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_style_version_logs_style'
        ) THEN
          ALTER TABLE "style_version_logs"
          ADD CONSTRAINT "FK_style_version_logs_style"
          FOREIGN KEY ("style_id") REFERENCES "styles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_style_production_docs_style'
        ) THEN
          ALTER TABLE "style_production_docs"
          ADD CONSTRAINT "FK_style_production_docs_style"
          FOREIGN KEY ("style_id") REFERENCES "styles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_style_as3b_steps_style_id"
      ON "style_as3b_steps" ("style_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_style_as3b_steps_order_index"
      ON "style_as3b_steps" ("order_index")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_style_version_logs_style_id"
      ON "style_version_logs" ("style_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_style_version_logs_created_at"
      ON "style_version_logs" ("created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_style_production_docs_style_id"
      ON "style_production_docs" ("style_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_style_production_docs_style_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_style_version_logs_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_style_version_logs_style_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_style_as3b_steps_order_index"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_style_as3b_steps_style_id"`);

    await queryRunner.query(`
      ALTER TABLE "style_production_docs"
      DROP CONSTRAINT IF EXISTS "FK_style_production_docs_style"
    `);
    await queryRunner.query(`
      ALTER TABLE "style_version_logs"
      DROP CONSTRAINT IF EXISTS "FK_style_version_logs_style"
    `);
    await queryRunner.query(`
      ALTER TABLE "style_as3b_steps"
      DROP CONSTRAINT IF EXISTS "FK_style_as3b_steps_style"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "style_production_docs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "style_version_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "style_as3b_steps"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'style_production_docs_status_enum'
        ) THEN
          DROP TYPE "style_production_docs_status_enum";
        END IF;
      END$$;
    `);
  }
}
