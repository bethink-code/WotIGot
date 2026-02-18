import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export type PublicUserProfile = Pick<
  User,
  'id' | 'user_name' | 'name' | 'role'
>;

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  @Index({ unique: true })
  user_name: string;

  @Column({ nullable: true })
  password: string | null;

  @Column({ nullable: true, unique: true })
  google_id: string | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ type: 'enum', default: UserRole.User, enum: UserRole })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;
}
