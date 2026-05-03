import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterSection1ImageUrlType1777501000000 implements MigrationInterface {
  name = 'AlterSection1ImageUrlType1777501000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'style_production_docs',
      'section1_image_url',
      new TableColumn({
        name: 'section1_image_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'style_production_docs',
      'section1_image_url',
      new TableColumn({
        name: 'section1_image_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }
}
