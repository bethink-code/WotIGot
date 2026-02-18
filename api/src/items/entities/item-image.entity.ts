import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ItemImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  item_id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  thumbnail_url: string | null;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ type: 'double precision', nullable: true })
  location_lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  location_long: number | null;

  @CreateDateColumn()
  created_at: Date;
}
