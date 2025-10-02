// test-twilio.js - VERSION CORRIGÉE
const { Twilio } = require('twilio');

async function testTwilio() {
  console.log('🧪 TEST DIAGNOSTIC TWILIO - VERSION CORRIGÉE');
  console.log('='.repeat(50));
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;

  console.log('\n🔍 Vérification des credentials...');
  console.log('Account SID:', accountSid ? `${accountSid.substring(0, 20)}...` : '❌ MANQUANT');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '❌ MANQUANT');
  console.log('API Secret:', apiSecret ? '***PRÉSENT***' : '❌ MANQUANT');

  if (!accountSid || !apiKey || !apiSecret) {
    console.log('\n❌ VARIABLES MANQUANTES DANS .env.local!');
    console.log('💡 Ajoutez ces lignes dans .env.local:');
    console.log(`
TWILIO_ACCOUNT_SID=AC_votre_vrai_sid
TWILIO_API_KEY_SID=SK_votre_vrai_key  
TWILIO_API_KEY_SECRET=votre_vrai_secret
    `);
    return;
  }

  // VÉRIFICATION DU FORMAT
  console.log('\n🔎 Vérification du format...');
  if (!accountSid.startsWith('AC')) {
    console.log('❌ Account SID doit commencer par "AC"');
  } else {
    console.log('✅ Format Account SID: OK');
  }
  
  if (!apiKey.startsWith('SK')) {
    console.log('❌ API Key doit commencer par "SK"');
  } else {
    console.log('✅ Format API Key: OK');
  }

  try {
    console.log('\n🔄 Test de connexion à Twilio...');
    const twilioClient = new Twilio(apiKey, apiSecret, { accountSid });

    // Test avec la nouvelle API
    console.log('🎥 Test de l\'API Video (v1)...');
    const rooms = await twilioClient.video.v1.rooms.list({ limit: 1 });
    console.log('✅ Connexion API Video réussie!');

    console.log('\n🎫 Test de génération de token...');
    const token = twilioClient.jwt.AccessToken(accountSid, apiKey, apiSecret, {
      identity: 'test-user',
      ttl: 3600,
    });

    const videoGrant = new twilioClient.jwt.AccessToken.VideoGrant({
      room: 'test-room',
    });
    token.addGrant(videoGrant);

    const jwtToken = token.toJwt();
    console.log('✅ Token généré avec succès!');
    console.log(`📏 Longueur: ${jwtToken.length} caractères`);

    console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS!');
    console.log('💡 Vos credentials Twilio sont maintenant valides!');

  } catch (error) {
    console.log('\n❌ ERREUR:', error.message);
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Allez sur https://console.twilio.com');
    console.log('2. Créez une nouvelle API Key avec permissions Video');
    console.log('3. Copiez les VRAIES valeurs dans .env.local');
    console.log('4. Redémarrez votre application');
  }
}

testTwilio().catch(console.error);