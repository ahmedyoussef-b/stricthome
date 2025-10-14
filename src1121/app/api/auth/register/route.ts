// src/app/api/auth/register/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Role, type SafeUser } from '@/types';

export async function POST(req: NextRequest) {
  console.log("--- 🚀 API: Tentative d'inscription de profil ---");
  try {
    const body = await req.json();
    // Le mot de passe n'est plus géré ici, mais l'UID de Firebase est maintenant requis.
    const { email, role, name, uid } = body;

    if (!email || !role || !name || !uid) {
        console.warn("🚫 [API/Register] Données d'inscription incomplètes. UID, email, nom et rôle sont requis.");
        return NextResponse.json({ message: "Données d'inscription incomplètes." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: uid } });
    if (existingUser) {
      console.warn(`[API/Register] Tentative de création de profil pour un UID existant: ${uid}`);
      return NextResponse.json({ message: "Un profil pour cet utilisateur existe déjà." }, { status: 409 });
    }

    console.log(`[API/Register] Création d'un nouveau profil dans la BDD pour ${email} avec le rôle ${role} et l'UID ${uid}...`);
    
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                id: uid, // L'UID de Firebase devient l'ID de l'utilisateur
                email: email,
                username: email, // Le nom d'utilisateur par défaut est l'email
                name: name,
                role,
                active: true, // Activer le compte dès l'inscription
            }
        });

        // Créer le profil de rôle correspondant
        if (role === Role.TEACHER) {
            await tx.teacher.create({ data: { userId: user.id, name: firstName, surname: lastName } });
        } else if (role === Role.PARENT) {
            await tx.parent.create({ data: { userId: user.id, name: firstName, surname: lastName, address: '' } });
        }
        
        return user;
    });
    
    console.log(`[API/Register] Profil utilisateur et de rôle créés avec succès. ID utilisateur: ${newUser.id}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json({ user: safeUser as SafeUser }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [API/Register] Erreur lors de la création du profil:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ message: "Un utilisateur avec cet email ou nom d'utilisateur existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ message: "Une erreur interne est survenue." }, { status: 500 });
  }
}
