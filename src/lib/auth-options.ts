// src/lib/auth-options.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { Role, User as PrismaUser } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.role) {
          return null;
        }
        
        // This is for demo purposes only. In a real application,
        // you would hash and compare passwords.
        const isValid = credentials.password === 'password';

        if (isValid) {
          return user;
        }

        return null;
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });
  
        if (!dbUser) {
          // Create user and their state in a transaction
          const newUser = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
              data: {
                email: profile.email!,
                name: profile.name,
                image: (profile as any).picture,
                role: Role.ELEVE, // Default role for new Google sign-ups
              },
            });

            await tx.etatEleve.create({
              data: {
                eleveId: createdUser.id,
              }
            });

            return createdUser;
          });
          dbUser = newUser;
        }
        // Ensure the user object passed along has the correct id and role for the session callback
        user.id = dbUser.id;
        user.role = dbUser.role;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.role) {
           session.user.role = token.role as Role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

const handlers = NextAuth(authOptions);

export { handlers };
