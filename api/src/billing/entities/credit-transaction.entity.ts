import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionType {
  SubscriptionAllocation = 'subscription_allocation',
  PackPurchase = 'pack_purchase',
  Usage = 'usage',
  Rollover = 'rollover',
  Expiry = 'expiry',
  Refund = 'refund',
  AdminAdjustment = 'admin_adjustment',
}

@Entity()
export class CreditTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  user_id: number;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int' })
  balance_after: number;

  @Column({ nullable: true })
  description: string | null;

  @Column({ nullable: true })
  reference_id: string | null;

  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
