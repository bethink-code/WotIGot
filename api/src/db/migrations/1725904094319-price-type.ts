import { MigrationInterface, QueryRunner } from "typeorm";

export class PriceType1725904094319 implements MigrationInterface {
    name = 'PriceType1725904094319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."item_price_type_enum" AS ENUM('AI', 'user', 'invoice')`);
        await queryRunner.query(`ALTER TABLE "item" ADD "price_type" "public"."item_price_type_enum" NOT NULL DEFAULT 'user'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "price_type"`);
        await queryRunner.query(`DROP TYPE "public"."item_price_type_enum"`);
    }

}
