// src/app/api/parents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { parentSchema } from '@/lib/formValidationSchemas';

// POST (create) a new parent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = parentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // With Firebase Auth, user creation is handled separately via the registration form.
    // This endpoint should not create users with passwords.
    // Returning an error to indicate this flow is not supported.
    return NextResponse.json({ message: "La création de parents via cette route n'est pas supportée avec l'authentification Firebase. Le profil doit être créé lors de l'inscription." }, { status: 400 });

  } catch (error) {
    console.error('Erreur lors de la création du parent :', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: "Un utilisateur avec cet email ou nom d'utilisateur existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
