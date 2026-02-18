import { MigrationInterface, QueryRunner } from "typeorm";

export class PriceAndAmount1721145953230 implements MigrationInterface {
    name = 'PriceAndAmount1721145953230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" ADD "amount" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "price" numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "price" character varying`);
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "amount"`);
    }

}
