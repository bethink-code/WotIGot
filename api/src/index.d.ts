import { PublicUserProfile } from './users/user.entity';

export {};

declare module 'express-serve-static-core' {
  export interface Request {
    user?: PublicUserProfile;
  }
}
