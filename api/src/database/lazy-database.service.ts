import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { House } from '../items/entities/house.entity';
import { Room } from '../items/entities/room.entity';
import { Item } from '../items/entities/item.entity';
import { ItemImage } from '../items/entities/item-image.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { seedProductionDatabase } from '../db/seed-production';

export enum DatabaseState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

@Injectable()
export class LazyDatabaseService {
  private readonly logger = new Logger(LazyDatabaseService.name);
  private dataSource: DataSource | null = null;
  private connectionPromise: Promise<DataSource> | null = null;
  private state: DatabaseState = DatabaseState.DISCONNECTED;
  private lastError: string | null = null;
  private productionSeeded = false;

  constructor(private config: ConfigService) {}

  getState(): DatabaseState {
    return this.state;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  isConnected(): boolean {
    return this.dataSource?.isInitialized || false;
  }

  async whenReady(timeout: number = 30000): Promise<DataSource> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.dataSource?.isInitialized) {
        return this.dataSource;
      }

      if (this.connectionPromise) {
        try {
          return await Promise.race([
            this.connectionPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout waiting for database')), timeout - (Date.now() - startTime))
            ),
          ]);
        } catch (error) {
          if (error.message === 'Timeout waiting for database') {
            throw error;
          }
          // Connection failed, wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    throw new Error(`Database not ready within ${timeout}ms timeout`);
  }

  async getDataSource(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    throw new Error('Database not connected. Please wait for connection to establish.');
  }

  async startConnection(): Promise<void> {
    if (this.connectionPromise) {
      this.logger.log('Connection already in progress...');
      return;
    }

    this.connectionPromise = this.connectWithRetry();
    
    try {
      await this.connectionPromise;
    } catch (error) {
      this.logger.error('Failed to establish database connection after retries, will retry in background:', error);
      this.connectionPromise = null;
      
      // Restart retry loop after delay
      setTimeout(() => {
        this.logger.log('Restarting connection attempts...');
        this.startConnection().catch(() => {
          // Error already logged, will retry again
        });
      }, 10000); // Wait 10 seconds before retrying
    }
  }

  private async connectWithRetry(): Promise<DataSource> {
    const maxAttempts = 20;
    const baseDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.state = DatabaseState.CONNECTING;
        this.logger.log(`Database connection attempt ${attempt}/${maxAttempts}...`);

        if (!this.dataSource) {
          const isProduction = this.config.get('NODE_ENV') === 'production';
          const prodDatabaseUrl = this.config.get('PROD_DATABASE_URL');
          const devDatabaseUrl = this.config.get('DEV_DATABASE_URL');
          
          const databaseUrl = isProduction ? prodDatabaseUrl : devDatabaseUrl;
          const envName = isProduction ? 'PROD_DATABASE_URL' : 'DEV_DATABASE_URL';
          const branchName = isProduction ? 'production' : 'development';
          
          if (!databaseUrl) {
            const errorMsg = `FATAL: ${envName} is not set. This app requires Neon database.
            
WARNING: Do NOT use the Replit database tool (execute_sql_tool) for debugging!
It connects to a different database (Replit DB) than this app uses (Neon DB).

To query the Neon database, use: npm run db:query -- "YOUR SQL HERE"`;
            
            this.logger.error(errorMsg);
            throw new Error(`${envName} is required for ${branchName} environment. This app uses Neon database only.`);
          }
          
          this.logger.log(`╔════════════════════════════════════════════════════════════╗`);
          this.logger.log(`║  DATABASE: Neon (${branchName} branch)`.padEnd(61) + '║');
          this.logger.log(`║  NOTE: Replit's database tool queries a DIFFERENT database ║`);
          this.logger.log(`╚════════════════════════════════════════════════════════════╝`);
          
          this.dataSource = new DataSource({
            type: 'postgres',
            url: databaseUrl,
            entities: [User, House, Room, Item, ItemImage, RefreshToken],
            synchronize: false,
            ssl: true,
            extra: {
              ssl: {
                rejectUnauthorized: false,
              },
              connectionTimeoutMillis: 30000,
            },
          });
        }

        await this.dataSource.initialize();
        
        this.state = DatabaseState.CONNECTED;
        this.lastError = null;
        this.logger.log('✓ Database connected successfully!');

        // Run production seeding once if in production mode
        if (this.config.get('NODE_ENV') === 'production' && !this.productionSeeded) {
          try {
            await seedProductionDatabase(this.dataSource);
            this.productionSeeded = true;
          } catch (error) {
            this.logger.error('Production seeding failed:', error);
          }
        }

        return this.dataSource;
      } catch (error) {
        this.state = DatabaseState.ERROR;
        this.lastError = error.message;
        
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxAttempts} failed: ${error.message}`
        );

        if (attempt === maxAttempts) {
          this.logger.error('Max database connection attempts reached. Giving up.');
          throw new Error(`Failed to connect to database after ${maxAttempts} attempts: ${error.message}`);
        }

        // Exponential backoff with jitter
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 30000);
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }

    throw new Error('Failed to connect to database');
  }
}
