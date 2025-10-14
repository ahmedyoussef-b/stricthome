// src/lib/firebase-admin-seed.js
// Fichier distinct pour le seeding afin d'éviter les problèmes avec ES Modules et CommonJS.
const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  try {
    const serviceAccount = require('../../../prisma/school-management-426516-firebase-adminsdk-j8v1y-ab239a045c.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("🔥 [Firebase Admin for Seeding] Initialisation réussie.");
    return admin;
  } catch (error) {
    console.error("❌ [Firebase Admin for Seeding] Erreur d'initialisation :", error);
    console.error("Assurez-vous que le fichier `school-management-426516-firebase-adminsdk-j8v1y-ab239a045c.json` existe à la racine du projet.");
    process.exit(1);
  }
}

module.exports = { initializeFirebaseAdmin };
