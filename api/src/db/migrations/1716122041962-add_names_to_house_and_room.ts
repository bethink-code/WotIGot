import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNamesToHouseAndRoom1716122041962 implements MigrationInterface {
  name = 'AddNamesToHouseAndRoom1716122041962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "house" ADD "name" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "name"`);
  }
}
