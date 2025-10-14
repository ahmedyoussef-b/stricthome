// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

/**
 * A singleton pattern to initialize Firebase Admin SDK.
 * Ensures that the SDK is initialized only once and returns the admin instance.
 * @returns {admin.app.App} The initialized Firebase Admin app instance.
 */
export function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  console.log("🔥 [Firebase Admin] Initializing Admin SDK...");

  const adminConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!adminConfig.projectId || !adminConfig.clientEmail || !adminConfig.privateKey) {
      console.error("🔥 [Firebase Admin] ❌ Missing Firebase Admin SDK configuration. Check environment variables (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).");
      throw new Error('Firebase Admin SDK configuration is incomplete.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(adminConfig),
    });
    console.log("🔥 [Firebase Admin] ✅ Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("🔥 [Firebase Admin] ❌ Error initializing Admin SDK:", error.message);
    throw new Error("Could not initialize Firebase Admin SDK: " + error.message);
  }

  return admin;
}

/**
 * Returns the Firebase Admin Auth service.
 * Throws an error if the SDK has not been initialized.
 * @returns {admin.auth.Auth} The Firebase Admin Auth service.
 */
export function getAdminAuth(): admin.auth.Auth {
    // This function will implicitly use the initialized default app.
    return admin.auth();
}
