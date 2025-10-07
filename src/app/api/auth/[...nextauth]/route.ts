// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth-options';
import { NextResponse } from 'next/server';

export const { GET, POST } = handlers;

// Ajouté pour gérer les requêtes preflight OPTIONS et corriger les erreurs CORS
// dans l'environnement Cloud Workstation.
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
