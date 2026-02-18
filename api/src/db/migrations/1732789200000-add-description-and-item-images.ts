import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionAndItemImages1732789200000
  implements MigrationInterface
{
  name = 'AddDescriptionAndItemImages1732789200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item" ADD "description" character varying`,
    );

    await queryRunner.query(
      `CREATE TABLE "item_image" (
        "id" SERIAL NOT NULL,
        "item_id" integer NOT NULL,
        "url" character varying NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "location_lat" double precision,
        "location_long" double precision,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_item_image" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_item_image_item_id" ON "item_image" ("item_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "item_image" ADD CONSTRAINT "FK_item_image_item_id" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_image" DROP CONSTRAINT "FK_item_image_item_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_item_image_item_id"`);
    await queryRunner.query(`DROP TABLE "item_image"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "description"`);
  }
}
