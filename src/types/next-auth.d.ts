// src/types/next-auth.d.ts
import { Role } from '@prisma/client';
import type { DefaultSession, User as DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from '@auth/core/jwt';

declare module '@auth/core/types' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}
