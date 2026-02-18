import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuth1740000000000 implements MigrationInterface {
  name = 'AddGoogleAuth1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "google_id" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_google_id" ON "user" ("google_id") WHERE "google_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "email" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(`DROP INDEX "IDX_user_google_id"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "google_id"`);
  }
}
