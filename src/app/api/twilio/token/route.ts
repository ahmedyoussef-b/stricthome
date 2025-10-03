// app/api/twilio/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

export async function POST(request: NextRequest) {
  try {
    const { identity, room } = await request.json();
    
    if (!identity || !room) {
        return NextResponse.json({ error: 'Identity and room name are required.' }, { status: 400 });
    }
    
    // Générer une identité unique pour chaque demande afin d'éviter les problèmes de "duplicate identity"
    // causés par le double-rendu de React StrictMode en développement.
    const uniqueIdentity = `${identity}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`🔑 [Twilio Token API] Demande de jeton pour l'identité unique "${uniqueIdentity}" dans la salle "${room}"`);

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
    const twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    console.log('🔍 [Twilio Token API] Vérification des variables d\'environnement...');

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret) {
      console.error('❌ [Twilio Token API] Erreur: Une ou plusieurs variables d\'environnement Twilio sont manquantes.');
      return NextResponse.json({ error: 'Configuration serveur Twilio incomplète. Veuillez vérifier les variables d\'environnement.' }, { status: 500 });
    }
    
    console.log('✅ [Twilio Token API] Variables d\'environnement trouvées.');

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
