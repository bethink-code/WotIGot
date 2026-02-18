import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { LazyDatabaseModule } from './database/lazy-database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { MediaModule } from './media/media.module';
import { GeocodeModule } from './geocode/geocode.module';
import { IndexController } from './index.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DEV_DATABASE_URL: Joi.string().when('NODE_ENV', {
          is: Joi.valid('development', 'test'),
          then: Joi.required().messages({
            'any.required': 'DEV_DATABASE_URL is required for development/test environment. This app uses Neon database only.',
          }),
          otherwise: Joi.optional(),
        }),
        PROD_DATABASE_URL: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required().messages({
            'any.required': 'PROD_DATABASE_URL is required for production environment. This app uses Neon database only.',
          }),
          otherwise: Joi.optional(),
        }),
        BASE_PATH: Joi.string().default(''),
        APP_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
        AWS_S3_BUCKET: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        PGHOST: Joi.string().optional(),
        PGPORT: Joi.number().optional(),
        PGUSER: Joi.string().optional(),
        PGPASSWORD: Joi.string().optional(),
        PGDATABASE: Joi.string().optional(),
      }),
    }),
    LazyDatabaseModule,
    AuthModule,
    UsersModule,
    ItemsModule,
    MediaModule,
    GeocodeModule,
  ],
  controllers: [IndexController],
})
export class AppModule {}
