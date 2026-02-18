import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThumbnailUrl1733127600000 implements MigrationInterface {
  name = 'AddThumbnailUrl1733127600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_image" ADD "thumbnail_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_image" DROP COLUMN "thumbnail_url"`,
    );
  }
}
