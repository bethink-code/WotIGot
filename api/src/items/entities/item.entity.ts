import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum PriceType {
  ai = 'AI',
  user = 'user',
  invoice = 'invoice',
}

export const priceTypeNameMap: Record<PriceType, string> = {
  [PriceType.ai]: 'Price suggested by AI',
  [PriceType.user]: 'Price captured on ScanSure',
  [PriceType.invoice]: 'Price from invoice',
};

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  room_id: number;

  @Column()
  @Index()
  house_id: number;

  @Column()
  @Index()
  owner_id: number;

  @Column({ nullable: true })
  image: string | null;

  @Column({ nullable: true, type: 'decimal' })
  price: number | null;

  @Column({ type: 'enum', enum: PriceType, default: PriceType.user })
  price_type: PriceType;

  @Column({ default: 1, type: 'int' })
  amount: number;

  @Column({ nullable: true })
  description: string | null;

  @Column()
  category: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ nullable: true })
  receipt_image: string | null;

  @Column({ nullable: true })
  serial_number: string | null;

  @Column({ type: 'double precision', nullable: true })
  location_lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  location_long: number | null;

  @CreateDateColumn()
  created_at: Date;
}
