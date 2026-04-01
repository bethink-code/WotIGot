import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class CreditPack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_zar: number;

  @Column({ nullable: true })
  stripe_price_id: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;
}
