import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity()
export class CreditBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  user_id: number;

  @Column({ type: 'int', default: 0 })
  subscription_credits: number;

  @Column({ type: 'int', default: 0 })
  purchased_credits: number;

  @Column({ type: 'int', default: 0 })
  rollover_credits: number;

  @Column({ type: 'int', default: 0 })
  lifetime_credits_purchased: number;

  @Column({ type: 'int', default: 0 })
  lifetime_credits_used: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updated_at: Date;
}
