// src/app/api/video/token/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Twilio from 'twilio';
import { getServerSession } from '@/lib/auth-utils';

const { AccessToken } = Twilio.jwt;
const { VideoGrant } = AccessToken;

export async function POST(req: NextRequest) {
    // La session est toujours vérifiée pour la sécurité de la route
    const session = await getServerSession();
    if (!session?.user?.id) {
        console.error("❌ [API/video/token] Accès non autorisé : aucune session utilisateur trouvée.");
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }
    
    const { identity, roomName } = await req.json();

    if (!identity || !roomName) {
        return NextResponse.json({ message: 'L\'identité de l\'utilisateur et le nom de la salle sont requis' }, { status: 400 });
    }
    
    // S'assurer que l'utilisateur ne demande un jeton que pour lui-même
    if (identity !== session.user.id) {
        console.warn(`⚠️ [API/video/token] Tentative de création de jeton pour un autre utilisateur : demandé=${identity}, session=${session.user.id}`);
        return NextResponse.json({ message: 'Non autorisé à créer un jeton pour un autre utilisateur' }, { status: 403 });
    }

    console.log(`✅ [API/video/token] Génération du jeton pour l'identité: ${identity} et la salle: ${roomName}`);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY_SID; // CORRECTED: Use API Key SID
    const apiSecret = process.env.TWILIO_API_SECRET;

    if (!accountSid || !apiKey || !apiSecret) {
        console.error("❌ [API/video/token] Les variables d'environnement Twilio ne sont pas configurées.");
        return NextResponse.json({ message: 'Configuration du serveur incomplète' }, { status: 500 });
    }
    
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600 // 1 heure
    });
    
    const videoGrant = new VideoGrant({
      room: roomName,
    });

    accessToken.addGrant(videoGrant);
    const jwtToken = accessToken.toJwt();
    console.log("✅ [API/video/token] Jeton Twilio généré avec succès.");

    return NextResponse.json({ token: jwtToken });
}
