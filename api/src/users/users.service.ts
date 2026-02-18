import { hash, compare } from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Injectable, Inject } from '@nestjs/common';
import { LazyRepository } from '../database/lazy-repository';
import { USER_REPOSITORY } from '../database/repository-tokens';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private usersRepository: LazyRepository<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(data: CreateUserDto): Promise<User> {
    const user = await this.usersRepository.create(data);
    user.password = await this.hashPassword(data.password);
    return this.usersRepository.save(user);
  }

  /**
   * Update a user
   * @param id ID of the user to update
   * @param data New user data (password is optional - only updates if provided)
   * @returns Updated user
   */
  async update(id: number, data: Partial<CreateUserDto> & { name: string; user_name: string }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    user.name = data.name;
    user.user_name = data.user_name;
    
    if (data.password && data.password.trim().length > 0) {
      user.password = await this.hashPassword(data.password);
    }
    
    return this.usersRepository.save(user);
  }

  /**
   * Find a user by username
   */
  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { user_name: username } });
  }

  /**
   * Get all users
   * @returns All users
   */
  async find(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Compare a password with a hash
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }

  /**
   * Update user profile (name only)
   */
  async updateProfile(id: number, data: { name: string }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    user.name = data.name;
    return this.usersRepository.save(user);
  }

  /**
   * Change user password
   */
  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.password) {
      const isValid = await this.validatePassword(currentPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
    }

    user.password = await this.hashPassword(newPassword);
    await this.usersRepository.save(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Find a user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { google_id: googleId } });
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Create a user from Google OAuth (no password required)
   */
  async createFromGoogle(data: {
    name: string;
    email: string;
    google_id: string;
  }): Promise<User> {
    const user = await this.usersRepository.create({
      name: data.name,
      user_name: data.email,
      email: data.email,
      google_id: data.google_id,
      password: null,
    });
    return this.usersRepository.save(user);
  }

  /**
   * Link a Google account to an existing user
   */
  async linkGoogleAccount(userId: number, googleId: string, email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.google_id = googleId;
    if (!user.email) {
      user.email = email;
    }
    return this.usersRepository.save(user);
  }

  /**
   * Delete a user
   */
  async delete(id: number): Promise<void> {
    await this.usersRepository.delete({ id });
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }
}
