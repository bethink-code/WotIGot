import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig();

// Use DEV_DATABASE_URL for migrations (dev branch of your Neon database)
const neonDatabaseUrl = process.env.DEV_DATABASE_URL || process.env.PROD_DATABASE_URL;

const config = neonDatabaseUrl
  ? {
      type: 'postgres',
      url: neonDatabaseUrl,
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: ['dist/db/migrations/*{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: false,
    }
  : {
      type: 'postgres',
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: ['dist/db/migrations/*{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: false,
    };

export const connectionSource = new DataSource(config as DataSourceOptions);
