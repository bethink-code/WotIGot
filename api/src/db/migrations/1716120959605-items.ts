import { MigrationInterface, QueryRunner } from 'typeorm';

export class Items1716120959605 implements MigrationInterface {
  name = 'Items1716120959605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room" ("id" SERIAL NOT NULL, "house_id" integer NOT NULL, "owner_id" integer NOT NULL, "image" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3b973d62d6ce150513a64d9df7" ON "room" ("house_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6dfeeefd28618a1351a1a1a917" ON "room" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "item" ("id" SERIAL NOT NULL, "room_id" integer NOT NULL, "house_id" integer NOT NULL, "owner_id" integer NOT NULL, "image" character varying, "price" double precision, "category" character varying NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "receipt_image" character varying, "serial_number" character varying, "location_lat" double precision, "location_long" double precision, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1465e9f0ace918feede31d5534" ON "item" ("room_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2197200577ca9260cf08c970be" ON "item" ("house_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97736239993f7f9b3dbfe2510f" ON "item" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "house" ("id" SERIAL NOT NULL, "owner_id" integer NOT NULL, "image" character varying, "address" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c9220195fd0a289745855fe908" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9da79b9e0b921fccda7ff0999e" ON "house" ("owner_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9da79b9e0b921fccda7ff0999e"`,
    );
    await queryRunner.query(`DROP TABLE "house"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97736239993f7f9b3dbfe2510f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2197200577ca9260cf08c970be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1465e9f0ace918feede31d5534"`,
    );
    await queryRunner.query(`DROP TABLE "item"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6dfeeefd28618a1351a1a1a917"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3b973d62d6ce150513a64d9df7"`,
    );
    await queryRunner.query(`DROP TABLE "room"`);
  }
}
