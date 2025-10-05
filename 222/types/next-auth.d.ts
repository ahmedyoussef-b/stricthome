// src/types/next-auth.d.ts
import { Role } from '@prisma/client';
import type { DefaultSession, User as DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}
