import { Repository, DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { LazyDatabaseService } from './lazy-database.service';
import { DatabaseNotReadyException } from './database-not-ready.exception';

export class LazyRepository<Entity extends ObjectLiteral> {
  private repository: Repository<Entity> | null = null;

  constructor(
    private lazyDb: LazyDatabaseService,
    private entity: EntityTarget<Entity>,
    private timeout: number = 30000,
  ) {}

  private async getRepository(): Promise<Repository<Entity>> {
    if (this.repository && this.lazyDb.isConnected()) {
      return this.repository;
    }

    try {
      const dataSource = await this.lazyDb.whenReady(this.timeout);
      this.repository = dataSource.getRepository(this.entity);
      return this.repository;
    } catch (error) {
      throw new DatabaseNotReadyException(
        'Database connection is not ready. Please try again in a few seconds.',
      );
    }
  }

  async find(...args: Parameters<Repository<Entity>['find']>) {
    const repo = await this.getRepository();
    return repo.find(...args);
  }

  async findOne(...args: Parameters<Repository<Entity>['findOne']>) {
    const repo = await this.getRepository();
    return repo.findOne(...args);
  }

  async findOneBy(...args: Parameters<Repository<Entity>['findOneBy']>) {
    const repo = await this.getRepository();
    return repo.findOneBy(...args);
  }

  async save(...args: Parameters<Repository<Entity>['save']>) {
    const repo = await this.getRepository();
    return repo.save(...args);
  }

  async remove(...args: Parameters<Repository<Entity>['remove']>) {
    const repo = await this.getRepository();
    return repo.remove(...args);
  }

  async delete(...args: Parameters<Repository<Entity>['delete']>) {
    const repo = await this.getRepository();
    return repo.delete(...args);
  }

  async update(...args: Parameters<Repository<Entity>['update']>) {
    const repo = await this.getRepository();
    return repo.update(...args);
  }

  async count(...args: Parameters<Repository<Entity>['count']>) {
    const repo = await this.getRepository();
    return repo.count(...args);
  }

  async create(...args: Parameters<Repository<Entity>['create']>) {
    const repo = await this.getRepository();
    return repo.create(...args);
  }

  async createQueryBuilder(...args: Parameters<Repository<Entity>['createQueryBuilder']>) {
    const repo = await this.getRepository();
    return repo.createQueryBuilder(...args);
  }

  get manager() {
    if (!this.repository) {
      throw new Error('Database not connected. Repository manager not available.');
    }
    return this.repository.manager;
  }
}

export function createLazyRepositoryProvider<Entity extends ObjectLiteral>(
  entity: EntityTarget<Entity>,
  token: string | symbol,
) {
  return {
    provide: token,
    useFactory: (lazyDb: LazyDatabaseService) => {
      return new LazyRepository(lazyDb, entity);
    },
    inject: [LazyDatabaseService],
  };
}
