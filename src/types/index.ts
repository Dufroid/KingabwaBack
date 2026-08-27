import { Request } from 'express';

export type UserRole = 'VISITOR' | 'VOTER' | 'ADMIN' | 'SUPER_ADMIN';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
