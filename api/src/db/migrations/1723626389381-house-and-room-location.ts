import { MigrationInterface, QueryRunner } from "typeorm";

export class HouseAndRoomLocation1723626389381 implements MigrationInterface {
    name = 'HouseAndRoomLocation1723626389381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room" ADD "location_lat" double precision`);
        await queryRunner.query(`ALTER TABLE "room" ADD "location_long" double precision`);
        await queryRunner.query(`ALTER TABLE "house" ADD "location_lat" double precision`);
        await queryRunner.query(`ALTER TABLE "house" ADD "location_long" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "location_long"`);
        await queryRunner.query(`ALTER TABLE "house" DROP COLUMN "location_lat"`);
        await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "location_long"`);
        await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "location_lat"`);
    }

}
