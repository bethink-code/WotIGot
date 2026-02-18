import { connectionSource } from './typeorm-migrations.config';

/**
 * Run migrations to the database in production.
 * Use lock table to prevent parallel execution of migrations.
 */
export const runMigrationsInProduction = async () => {
  await connectionSource.initialize();
  // create database lock for migrations
  do {
    try {
      await connectionSource.query('CREATE TABLE "_lock" ("lock" INT)');
      break;
    } catch (err) {
      console.log(err);
      // lock table already exists. wait for release and try again.
      console.log('Database lock table (_lock) already exists. Waiting for release...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } while (true);

  // run migrations
  await connectionSource.runMigrations({ transaction: 'all' });

  // drop the lock table, thereby releasing other parallel executing applications
  await connectionSource.query('DROP TABLE "_lock"');
  await connectionSource.destroy();
};
