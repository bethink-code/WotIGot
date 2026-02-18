import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  house_id: number;

  @Column()
  @Index()
  owner_id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  image: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'double precision', nullable: true })
  location_lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  location_long: number | null;
}
