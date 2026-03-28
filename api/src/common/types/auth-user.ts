import { UserRole } from '@prisma/client';

export type AuthUser = {
  userId: string;
  role: UserRole;
};
