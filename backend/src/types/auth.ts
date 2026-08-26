import { Role } from '@prisma/client';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
}

