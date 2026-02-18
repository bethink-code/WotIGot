import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initialize1716116914960 implements MigrationInterface {
  name = 'Initialize1716116914960';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "user_name" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d34106f8ec1ebaf66f4f8609dd" ON "user" ("user_name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_token" ("userId" integer NOT NULL, "token" character varying NOT NULL, "payload" json NOT NULL, CONSTRAINT "PK_8e913e288156c133999341156ad" PRIMARY KEY ("userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c31d0a2f38e6e99110df62ab0a" ON "refresh_token" ("token") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c31d0a2f38e6e99110df62ab0a"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d34106f8ec1ebaf66f4f8609dd"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
