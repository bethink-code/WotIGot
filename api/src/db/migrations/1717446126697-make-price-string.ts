import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePriceString1717446126697 implements MigrationInterface {
    name = 'MakePriceString1717446126697'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "price" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "item" ADD "price" double precision`);
    }

}
