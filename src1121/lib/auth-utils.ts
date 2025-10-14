
'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';
import type { SafeUser } from '@/types';
import { initializeFirebaseAdmin } from './firebase-admin';
import prisma from './prisma';


/**
 * Retrieves the server-side session by verifying the session cookie with Firebase Admin SDK.
 * @returns A promise that resolves to the session payload (containing the user) or null if invalid.
 */
export async function getServerSession(): Promise<{ user: SafeUser } | null> {
  console.log('--- 🍪 [Serveur] Tentative de récupération de la session (Firebase-first) ---');
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      console.log('🚫 [Serveur] Pas de cookie de session trouvé.');
      return null;
    }

    const admin = await initializeFirebaseAdmin();
    console.log('✅ [Serveur] Cookie de session trouvé, tentative de vérification avec Firebase Admin...');
    
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    
    // The user is authenticated with Firebase, now fetch their profile from our DB
    const user = await prisma.user.findUnique({
        where: { id: decodedToken.uid }
    });

    if (!user) {
        console.error(`❌ [Serveur/Session] Utilisateur authentifié par Firebase (UID: ${decodedToken.uid}) non trouvé dans la BDD.`);
        return null;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    console.log(`✅ [Serveur/Session] Session valide trouvée pour: ${safeUser.email}`);

    return { user: safeUser as SafeUser };
    
  } catch (error) {
    console.error('❌ [Serveur] Erreur de vérification du cookie de session:', error);
    // This will catch expired cookies, invalid cookies, etc.
    return null;
  }
}
