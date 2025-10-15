// src/types/next-auth.d.ts
import { Role } from '@prisma/client';
import type { DefaultSession, User as DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: Role;
      classeId?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role?: Role;
    classeId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    classeId?: string;
  }
}
