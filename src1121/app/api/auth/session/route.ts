// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';

export async function GET() {
  console.log("--- 🚀 API: Vérification de la Session ---");
  const session = await getServerSession();

  if (session?.user) {
    console.log(`✅ [API/session] Session active trouvée pour l'utilisateur : ${session.user.email}`);
    return NextResponse.json({ user: session.user });
  }
  
  console.log("🚫 [API/session] Aucune session active trouvée.");
  return NextResponse.json({ user: null });
}
