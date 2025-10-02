// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptions as NextAuthOptions);

export { handler as GET, handler as POST };
