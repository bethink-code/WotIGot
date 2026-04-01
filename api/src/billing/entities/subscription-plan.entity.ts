import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum PlanTier {
  Free = 'free',
  Pro = 'pro',
  Business = 'business',
}

@Entity()
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  tier: PlanTier;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_zar: number;

  @Column({ type: 'int' })
  monthly_credits: number;

  @Column({ type: 'int' })
  max_properties: number;

  @Column({ type: 'int' })
  max_rooms_per_property: number;

  @Column({ type: 'int' })
  max_items: number;

  @Column({ type: 'int', default: 0 })
  max_credit_rollover: number;

  @Column({ nullable: true })
  stripe_price_id: string | null;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
