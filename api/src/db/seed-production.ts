import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { User } from '../users/user.entity';

/**
 * Seed production database with default admin user
 * This runs automatically on first production startup
 * Uses upsert to be safe for concurrent Autoscale instances
 */
export async function seedProductionDatabase(dataSource: DataSource) {
  try {
    console.log('Seeding production database with default admin user...');
    
    // Hash the password
    const hashedPassword = await hash('admin123', 10);
    
    // Use raw query with INSERT ... ON CONFLICT DO NOTHING for idempotent, concurrency-safe insertion
    // This ensures multiple Autoscale instances can run this simultaneously without errors
    const result = await dataSource.query(
      `INSERT INTO "user" (user_name, name, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_name) DO NOTHING
       RETURNING id`,
      ['admin', 'Admin User', hashedPassword, 'admin']
    );

    if (result.length > 0) {
      console.log('✓ Default admin user created successfully');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      console.log('✓ Admin user already exists (concurrent insert prevented)');
    }
  } catch (error) {
    console.error('Error seeding production database:', error);
    // Don't throw - we don't want to crash the app if seeding fails
    // The error will be logged but the app will continue starting
  }
}
