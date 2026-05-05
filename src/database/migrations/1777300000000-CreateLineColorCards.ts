import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLineColorCards1777300000000 implements MigrationInterface {
  name = 'CreateLineColorCards1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng line_color_cards (quan hệ 1:1 với line_colors)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "line_color_cards" (
        "id"             uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "line_color_id"  uuid        NOT NULL,
        "file_path"      varchar(500) NOT NULL,
        "file_name"      varchar(200),
        "uploaded_by"    uuid        NOT NULL,
        "uploaded_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status"         varchar(20)  NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_line_color_cards" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_line_color_cards_line_color_id" UNIQUE ("line_color_id")
      )
    `);

    // FK: line_color_cards -> line_colors
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_line_color_cards_line_color'
        ) THEN
          ALTER TABLE "line_color_cards"
          ADD CONSTRAINT "FK_line_color_cards_line_color"
          FOREIGN KEY ("line_color_id") REFERENCES "line_colors"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    // Index để query nhanh theo line_color_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_line_color_cards_line_color_id"
      ON "line_color_cards" ("line_color_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_line_color_cards_line_color_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "line_color_cards" DROP CONSTRAINT IF EXISTS "FK_line_color_cards_line_color"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "line_color_cards"`);
  }
}
