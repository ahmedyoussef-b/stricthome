// app/api/twilio/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

export async function POST(request: NextRequest) {
  try {
    const { identity, room } = await request.json();
    
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
    const twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    console.log('🔍 [API Route] Vérification des variables d\'environnement...');

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret) {
      console.error('❌ [API Route] Erreur: Une ou plusieurs variables d\'environnement Twilio sont manquantes.');
      return NextResponse.json({ error: 'Configuration serveur Twilio incomplète. Veuillez vérifier les variables d\'environnement.' }, { status: 500 });
    }
    
    console.log('✅ [API Route] Variables d\'environnement trouvées.');

    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKeySid, 
      twilioApiKeySecret,
      { identity, ttl: 3600 }
    );

    token.addGrant(new VideoGrant({ room }));
    
    const jwt = token.toJwt();
    console.log('✅ [API Route] Token généré, longueur:', jwt.length);
    
    return NextResponse.json({ token: jwt });
  } catch (error) {
    let errorMessage = 'Erreur inconnue de génération de jeton';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('❌ [API Route] Erreur de génération du jeton:', {
        message: errorMessage,
        errorObject: error
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
