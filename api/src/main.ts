import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { DatabaseExceptionFilter } from './database/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
  });
  app.useBodyParser('json', { limit: '10mb' });
  // app.useBodyParser('raw', { limit: '10mb' });
  // app.useBodyParser('urlencoded', { limit: '10mb' });
  // app.useBodyParser('text', { limit: '10mb' });
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get('BASE_PATH') as string);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new DatabaseExceptionFilter());

  // NOTE: Migrations are NOT run automatically in production to avoid race conditions
  // in Autoscale deployments. Run migrations manually before deploying using:
  // npm run migration:run (from api/ directory)

  const openApiConfig = new DocumentBuilder()
    .setTitle('ScanSure API')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup(`${config.get('BASE_PATH')}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Serve static frontend files in production
  if (config.get('NODE_ENV') === 'production') {
    const frontendPath = join(__dirname, '../../app/dist');
    if (existsSync(frontendPath)) {
      app.useStaticAssets(frontendPath);
      app.setBaseViewsDir(frontendPath);
      app.setViewEngine('html');
      
      // SPA fallback: serve index.html for all non-API routes
      // This enables client-side routing for deep links like /settings, /items, etc.
      const expressApp = app.getHttpAdapter().getInstance();
      const indexPath = join(frontendPath, 'index.html');
      expressApp.get('*', (req: any, res: any, next: any) => {
        // Skip API routes - they should be handled by NestJS controllers
        if (req.path.startsWith('/api')) {
          return next();
        }
        // Serve index.html for all other routes (SPA client-side routing)
        if (existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          next();
        }
      });
    }
  }

  // Start HTTP server IMMEDIATELY - database connection happens in background via LazyDatabaseModule
  await app.listen(String(config.get('PORT')));
  
  console.log(`Application is listening on port ${config.get('PORT')}`);
  console.log(`Health check available at: ${config.get('BASE_PATH')}/health`);
}
bootstrap();
