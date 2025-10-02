// test-twilio.js
const { Twilio } = require('twilio');

// Configuration - Remplacez avec vos vraies valeurs
const config = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'AC_votre_account_sid',
  apiKey: process.env.TWILIO_API_KEY_SID || 'SK_votre_api_key', 
  apiSecret: process.env.TWILIO_API_KEY_SECRET || 'votre_api_secret'
};

async function testTwilio() {
  console.log('🧪 TEST DIAGNOSTIC TWILIO');
  console.log('=' .repeat(50));
  
  // 1. Vérification des credentials
  console.log('\n🔍 1. Vérification des credentials...');
  console.log(`Account SID: ${config.accountSid ? `${config.accountSid.substring(0, 10)}...` : '❌ MANQUANT'}`);
  console.log(`API Key: ${config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '❌ MANQUANT'}`);
  console.log(`API Secret: ${config.apiSecret ? '***PRÉSENT***' : '❌ MANQUANT'}`);

  if (!config.accountSid || !config.apiKey || !config.apiSecret) {
    console.log('\n❌ ERREUR: Variables d\'environnement manquantes!');
    console.log('💡 Solution: Vérifiez votre fichier .env.local ou remplacez les valeurs dans ce script');
    return;
  }

  try {
    // 2. Initialisation du client Twilio
    console.log('\n🔄 2. Connexion à Twilio...');
    const twilioClient = new Twilio(config.apiKey, config.apiSecret, { 
      accountSid: config.accountSid 
    });

    // 3. Test de l'API Video
    console.log('\n🎥 3. Test de l\'API Video...');
    const rooms = await twilioClient.video.rooms.list({ limit: 3 });
    console.log(`✅ Connexion API Video réussie`);
    console.log(`   Rooms existantes: ${rooms.length}`);
    rooms.forEach(room => {
      console.log(`   - ${room.uniqueName} (${room.status})`);
    });

    // 4. Test de génération de token
    console.log('\n🎫 4. Test de génération de token...');
    const testToken = new twilioClient.jwt.AccessToken(
      config.accountSid,
      config.apiKey,
      config.apiSecret,
      {
        identity: 'test-user-diagnostic',
        ttl: 3600,
      }
    );

    const videoGrant = new twilioClient.jwt.AccessToken.VideoGrant({
      room: 'test-room-diagnostic',
    });
    testToken.addGrant(videoGrant);
    
    const jwtToken = testToken.toJwt();
    console.log('✅ Token généré avec succès');
    console.log(`   Token: ${jwtToken.substring(0, 80)}...`);
    console.log(`   Longueur: ${jwtToken.length} caractères`);
    console.log(`   Identity: test-user-diagnostic`);
    console.log(`   Room: test-room-diagnostic`);

    // 5. Vérification du token
    console.log('\n🔐 5. Analyse du token...');
    const tokenParts = jwtToken.split('.');
    if (tokenParts.length === 3) {
      console.log('✅ Format JWT valide');
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log(`   Issuer (iss): ${payload.iss}`);
        console.log(`   Subject (sub): ${payload.sub}`);
        console.log(`   Identity: ${payload.grants?.identity}`);
        console.log(`   Expiration: ${new Date(payload.exp * 1000).toLocaleTimeString()}`);
      } catch (e) {
        console.log('⚠️  Impossible de décoder le payload JWT');
      }
    }

    // 6. Test complet réussi
    console.log('\n🎉 DIAGNOSTIC RÉUSSI!');
    console.log('✅ Tous les tests passent avec succès');
    console.log('✅ Votre configuration Twilio est valide');
    console.log('\n💡 Prochaines étapes:');
    console.log('   - Vérifiez que votre endpoint API utilise les mêmes credentials');
    console.log('   - Assurez-vous que le room name est correct dans votre application');

  } catch (error) {
    console.log('\n❌ ERREUR DURANT LE TEST:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    console.log(`   Status: ${error.status || 'N/A'}`);
    
    console.log('\n🔧 DIAGNOSTIC DE L\'ERREUR:');
    
    if (error.message.includes('Authentication Error') || error.message.includes('Invalid API Key')) {
      console.log('   ➤ Problème: Credentials Twilio invalides');
      console.log('   💡 Solution: Vérifiez votre Account SID, API Key et Secret');
      console.log('   🔗 Allez sur: https://console.twilio.com');
      
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      console.log('   ➤ Problème: Compte Twilio introuvable');
      console.log('   💡 Solution: Vérifiez votre Account SID');
      
    } else if (error.message.includes('permission') || error.message.includes('authorization')) {
      console.log('   ➤ Problème: Permissions API insuffisantes');
      console.log('   💡 Solution: L\'API Key doit avoir les permissions Video');
      console.log('   🔗 Regénérez une API Key avec Video activé');
      
    } else if (error.message.includes('network') || error.message.includes('connect')) {
      console.log('   ➤ Problème: Erreur réseau');
      console.log('   💡 Solution: Vérifiez votre connexion internet');
      
    } else {
      console.log('   ➤ Problème: Erreur inconnue');
      console.log('   💡 Solution: Vérifiez la console Twilio pour plus de détails');
    }
    
    console.log('\n📋 VÉRIFICATIONS:');
    console.log('   1. Account SID commence par "AC"...');
    console.log('   2. API Key commence par "SK"...'); 
    console.log('   3. Le compte Twilio a Video activé');
    console.log('   4. L\'API Key a les permissions Video');
  }
}

// Exécution du test
testTwilio().catch(console.error);