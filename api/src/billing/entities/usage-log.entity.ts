import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum UsageActionType {
  ScanItem = 'scan_item',
  ReRecognize = 're_recognize',
  ReEstimate = 're_estimate',
  AskPrice = 'ask_price',
  Geocode = 'geocode',
}

export enum CreditSourceType {
  Rollover = 'rollover',
  Subscription = 'subscription',
  Purchased = 'purchased',
}

@Entity()
export class UsageLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  user_id: number;

  @Column({ type: 'varchar' })
  action_type: UsageActionType;

  @Column({ type: 'int' })
  credits_used: number;

  @Column({ type: 'varchar' })
  credit_source: CreditSourceType;

  @Column({ type: 'int' })
  balance_after: number;

  @Column({ nullable: true })
  item_id: number | null;

  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, any> | null;

  @Column({ default: false })
  refunded: boolean;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
