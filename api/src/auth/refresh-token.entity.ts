import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { PublicUserProfile } from '../users/user.entity';

/**
 * RefreshToken Entity to keep track of user refresh tokens (allows one refresh token per user)
 */
@Entity()
export class RefreshToken {
  @PrimaryColumn()
  userId: number;

  @Column()
  @Index()
  token: string;

  @Column({ type: 'json' })
  payload: PublicUserProfile;
}
