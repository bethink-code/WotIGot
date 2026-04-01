import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingEntities1740100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Subscription Plan table
    await queryRunner.query(`
      CREATE TABLE "subscription_plan" (
        "id" SERIAL PRIMARY KEY,
        "tier" VARCHAR NOT NULL UNIQUE,
        "name" VARCHAR NOT NULL,
        "price_zar" DECIMAL(10,2) NOT NULL,
        "monthly_credits" INT NOT NULL,
        "max_properties" INT NOT NULL,
        "max_rooms_per_property" INT NOT NULL,
        "max_items" INT NOT NULL,
        "max_credit_rollover" INT NOT NULL DEFAULT 0,
        "stripe_price_id" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 2. User Subscription table
    await queryRunner.query(`
      CREATE TABLE "user_subscription" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL,
        "plan_id" INT NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'active',
        "stripe_customer_id" VARCHAR,
        "stripe_subscription_id" VARCHAR,
        "current_period_start" TIMESTAMP,
        "current_period_end" TIMESTAMP,
        "canceled_at" TIMESTAMP,
        "trial_end" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_subscription_user_id" ON "user_subscription" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_subscription_plan_id" ON "user_subscription" ("plan_id")`);

    // 3. Credit Balance table
    await queryRunner.query(`
      CREATE TABLE "credit_balance" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL,
        "subscription_credits" INT NOT NULL DEFAULT 0,
        "purchased_credits" INT NOT NULL DEFAULT 0,
        "rollover_credits" INT NOT NULL DEFAULT 0,
        "lifetime_credits_purchased" INT NOT NULL DEFAULT 0,
        "lifetime_credits_used" INT NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_credit_balance_user_id" ON "credit_balance" ("user_id")`);

    // 4. Usage Log table
    await queryRunner.query(`
      CREATE TABLE "usage_log" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL,
        "action_type" VARCHAR NOT NULL,
        "credits_used" INT NOT NULL,
        "credit_source" VARCHAR NOT NULL,
        "balance_after" INT NOT NULL,
        "item_id" INT,
        "metadata" JSONB,
        "refunded" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_usage_log_user_id" ON "usage_log" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_usage_log_created_at" ON "usage_log" ("created_at")`);

    // 5. Credit Pack table
    await queryRunner.query(`
      CREATE TABLE "credit_pack" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "credits" INT NOT NULL,
        "price_zar" DECIMAL(10,2) NOT NULL,
        "stripe_price_id" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "sort_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 6. Credit Transaction table
    await queryRunner.query(`
      CREATE TABLE "credit_transaction" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INT NOT NULL,
        "type" VARCHAR NOT NULL,
        "amount" INT NOT NULL,
        "balance_after" INT NOT NULL,
        "description" VARCHAR,
        "reference_id" VARCHAR,
        "metadata" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_credit_transaction_user_id" ON "credit_transaction" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_credit_transaction_created_at" ON "credit_transaction" ("created_at")`);

    // Seed subscription plans
    await queryRunner.query(`
      INSERT INTO "subscription_plan" ("tier", "name", "price_zar", "monthly_credits", "max_properties", "max_rooms_per_property", "max_items", "max_credit_rollover")
      VALUES
        ('free', 'Free', 0, 10, 1, 3, 50, 0),
        ('pro', 'Pro', 99, 100, 5, 20, 500, 0),
        ('business', 'Business', 249, 500, -1, -1, -1, 100)
    `);

    // Seed credit packs
    await queryRunner.query(`
      INSERT INTO "credit_pack" ("name", "credits", "price_zar", "sort_order")
      VALUES
        ('Starter', 10, 15, 1),
        ('Standard', 50, 60, 2),
        ('Bulk', 150, 150, 3),
        ('Mega', 500, 400, 4)
    `);

    // Migrate existing users to Free plan with 20 welcome credits
    const freePlan = await queryRunner.query(`SELECT id FROM "subscription_plan" WHERE tier = 'free'`);
    if (freePlan.length > 0) {
      const freePlanId = freePlan[0].id;

      // Create subscriptions for all existing users
      await queryRunner.query(`
        INSERT INTO "user_subscription" ("user_id", "plan_id", "status", "current_period_start", "current_period_end")
        SELECT u.id, $1, 'active', now(), now() + interval '30 days'
        FROM "user" u
        WHERE NOT EXISTS (SELECT 1 FROM "user_subscription" us WHERE us.user_id = u.id)
      `, [freePlanId]);

      // Create credit balances with 20 welcome credits
      await queryRunner.query(`
        INSERT INTO "credit_balance" ("user_id", "subscription_credits")
        SELECT u.id, 20
        FROM "user" u
        WHERE NOT EXISTS (SELECT 1 FROM "credit_balance" cb WHERE cb.user_id = u.id)
      `);

      // Log the welcome credits as admin adjustment
      await queryRunner.query(`
        INSERT INTO "credit_transaction" ("user_id", "type", "amount", "balance_after", "description")
        SELECT u.id, 'admin_adjustment', 20, 20, 'Welcome bonus: 20 free credits for early adopters'
        FROM "user" u
        WHERE NOT EXISTS (
          SELECT 1 FROM "credit_transaction" ct
          WHERE ct.user_id = u.id AND ct.description = 'Welcome bonus: 20 free credits for early adopters'
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_transaction"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usage_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_balance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_subscription"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_pack"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plan"`);
  }
}
