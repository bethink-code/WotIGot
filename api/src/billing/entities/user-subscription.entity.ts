import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SubscriptionStatus {
  Active = 'active',
  PastDue = 'past_due',
  Canceled = 'canceled',
  Trialing = 'trialing',
  Paused = 'paused',
}

@Entity()
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  user_id: number;

  @Column()
  @Index()
  plan_id: number;

  @Column({ type: 'varchar', default: SubscriptionStatus.Active })
  status: SubscriptionStatus;

  @Column({ nullable: true })
  stripe_customer_id: string | null;

  @Column({ nullable: true })
  stripe_subscription_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  current_period_start: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  current_period_end: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  canceled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  trial_end: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updated_at: Date;
}
