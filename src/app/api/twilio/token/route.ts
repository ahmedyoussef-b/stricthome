
// app/api/twilio/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateUniqueUserId } from '@/lib/utils';

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

export async function POST(request: NextRequest) {
  try {
    const { identity, room, role } = await request.json();
    
    if (!identity || !room || !role) {
        return NextResponse.json({ error: 'Identity, room name, and role are required.' }, { status: 400 });
    }
    
    // Générer une identité unique côté serveur pour chaque demande de jeton.
    const uniqueIdentity = generateUniqueUserId(role, identity);

    console.log(`🔑 [Twilio Token API] Demande de jeton pour l'identité unique "${uniqueIdentity}" dans la salle "${room}"`);

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
    const twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret) {
      console.error('❌ [Twilio Token API] Erreur: Une ou plusieurs variables d\'environnement Twilio sont manquantes.');
      return NextResponse.json({ error: 'Configuration serveur Twilio incomplète. Veuillez vérifier les variables d\'environnement.' }, { status: 500 });
    }
    
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKeySid, 
      twilioApiKeySecret,
      { identity: uniqueIdentity, ttl: 3600 } // Utilisation de l'identité unique
    );
    
    const videoGrant = new VideoGrant({ room });
    token.addGrant(videoGrant);
    
    const jwt = token.toJwt();
    console.log('✅ [Twilio Token API] Jeton généré avec succès.');
    
    return NextResponse.json({ token: jwt });
  } catch (error) {
    let errorMessage = 'Erreur inconnue de génération de jeton';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('❌ [Twilio Token API] Erreur de génération du jeton:', {
        message: errorMessage,
        errorObject: error
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
