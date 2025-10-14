// src/lib/actions/auth-actions.ts
'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Role, type SafeUser } from '@/types';

interface LoginResult {
    user?: SafeUser;
    error?: string;
}

export async function loginWithIdToken(idToken: string): Promise<LoginResult> {
  console.log("🔐 [Server Action] Tentative de connexion via Firebase avec un ID Token");
  
  if (!idToken) {
    return { error: "Le jeton ID est requis." };
  }

  try {
    const admin = initializeFirebaseAdmin();
    const auth = admin.auth();
    
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;

    console.log(`✅ [Server Action] Token vérifié pour: ${email}`);
    
    if (!email_verified) {
      return { error: "Veuillez vérifier votre adresse email avant de vous connecter." };
    }

    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      console.log(`👤 [Server Action] Création d'un nouveau profil pour: ${email}`);
      const [firstName, ...lastNameParts] = (name || '').split(' ');
      const lastName = lastNameParts.join(' ') || '';

      user = await prisma.user.create({
        data: {
          id: uid,
          email: email!,
          username: email!,
          name: name || email!,
          img: picture,
          role: Role.PARENT, // Default to PARENT, can be changed later
          active: true,
        }
      });

      await prisma.parent.create({
        data: {
          userId: user.id,
          name: firstName,
          surname: lastName,
          address: '',
        }
      });
    }
    
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 jours
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;
    
    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
      path: '/',
    });

    console.log(`✅ [Server Action] Session créée et cookie défini pour: ${email}`);
    return { user: safeUser as SafeUser };

  } catch (error: any) {
    console.error('❌ [Server Action] Erreur de création de session:', error);
    
    if (error.code === 'auth/id-token-revoked') {
      return { error: "Session expirée. Veuillez vous reconnecter." };
    }
    
    if (error.code === 'auth/argument-error') {
      return { error: "Token d'authentification invalide." };
    }
    
    return { error: "Erreur interne du serveur." };
  }
}
