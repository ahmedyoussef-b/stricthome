// src/lib/actions/cloudinary.actions.ts
'use server';

import { v2 as cloudinary } from 'cloudinary';

// Note: This needs to be configured with your Cloudinary credentials
// You should set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function getCloudinarySignature(paramsToSign: Record<string, unknown>) {
  console.log('[SERVER ACTION] getCloudinarySignature: Reçu paramsToSign:', paramsToSign);
  
  const timestamp = Math.round(new Date().getTime() / 1000);

  if (!process.env.CLOUDINARY_API_SECRET) {
      console.error('[SERVER ACTION] ERREUR: CLOUDINARY_API_SECRET non défini.');
      throw new Error('Cloudinary API secret is not defined.');
  }

  // Crée un nouvel objet pour la signature en excluant upload_preset
  const signatureParams = { ...paramsToSign, timestamp };
  delete (signatureParams as any).upload_preset;

  console.log('[SERVER ACTION] Paramètres réellement utilisés pour la signature:', signatureParams);

  const signature = cloudinary.utils.api_sign_request(
    signatureParams,
    process.env.CLOUDINARY_API_SECRET
  );
  
  console.log('[SERVER ACTION] Signature générée:', signature);
  console.log('[SERVER ACTION] Timestamp renvoyé:', timestamp);

  return { timestamp, signature };
}