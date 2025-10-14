// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Role } from '@/types';
import type { SafeUser } from '@/types';

export async function POST(request: NextRequest) {
  console.log("🔐 API: Tentative de connexion via Firebase");
  
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { message: "Le jeton ID est requis." }, 
        { status: 400 }
      );
    }
    
    // Initialiser Firebase Admin et obtenir l'instance
    const admin = initializeFirebaseAdmin();
    const auth = admin.auth();
    
    // Vérifier le token
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;

    console.log(`✅ Token vérifié pour: ${email}`);
    
    // Vérifier que l'email est confirmé (important pour Google)
    if (!email_verified) {
      return NextResponse.json(
        { message: "Veuillez vérifier votre adresse email avant de vous connecter." }, 
        { status: 401 }
      );
    }

    // Rechercher ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      console.log(`👤 Création d'un nouveau profil pour: ${email}`);
      
      const [firstName, ...lastNameParts] = (name || '').split(' ');
      const lastName = lastNameParts.join(' ') || '';

      user = await prisma.user.create({
        data: {
          id: uid,
          email: email!,
          username: email!,
          name: name || email!,
          img: picture,
          role: Role.PARENT,
          active: true,
        }
      });

      // Créer le profil parent associé
      await prisma.parent.create({
        data: {
          userId: user.id,
          name: firstName,
          surname: lastName,
          address: '',
        }
      });
    }
    
    // Créer le cookie de session
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 jours
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    // Préparer la réponse
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;
    const response = NextResponse.json({ 
      user: safeUser as SafeUser,
      message: "Connexion réussie" 
    });

    // Définir le cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours en secondes
      path: '/',
    });

    console.log(`✅ Session créée pour: ${email}`);
    return response;

  } catch (error: any) {
    console.error('❌ Erreur de création de session:', error);
    
    // Gestion d'erreurs spécifiques Firebase
    if (error.code === 'auth/id-token-revoked') {
      return NextResponse.json(
        { message: "Session expirée. Veuillez vous reconnecter." }, 
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { message: "Token d'authentification invalide." }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Erreur interne du serveur." }, 
      { status: 500 }
    );
  }
}

// Ajouter la gestion des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
