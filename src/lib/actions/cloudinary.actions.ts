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
  const timestamp = Math.round(new Date().getTime() / 1000);

  if (!process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary API secret is not defined.');
  }

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      ...paramsToSign
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return { timestamp, signature };
}