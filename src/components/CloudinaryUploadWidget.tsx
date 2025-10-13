// src/components/CloudinaryUploadWidget.tsx
'use client';

import { useState, useEffect, createContext } from 'react';
import { getCloudinarySignature } from '@/lib/actions/cloudinary.actions';

interface CloudinaryScriptContextType {
  loaded: boolean;
}

const CloudinaryScriptContext = createContext<CloudinaryScriptContextType>({ loaded: false });

interface CloudinaryUploadWidgetProps {
  onUpload: (result: any) => void;
  children: (props: { open: () => void }) => React.ReactNode;
}

function CloudinaryUploadWidget({ onUpload, children }: CloudinaryUploadWidgetProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('id', 'uw_script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.addEventListener('load', () => setLoaded(true));
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', () => setLoaded(true));
      document.body.removeChild(script);
    };
  }, []);

  const openWidget = async () => {
    console.log('[WIDGET] openWidget appelé. Script chargé:', loaded);
    if (!loaded) {
      console.error("[WIDGET] Cloudinary script not loaded yet.");
      return;
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    console.log('[WIDGET] Variables d\'environnement lues:', { cloudName, uploadPreset, apiKey });

    if (!cloudName || !uploadPreset || !apiKey) {
      console.error("[WIDGET] Cloudinary configuration is missing from environment variables.");
      return;
    }

    const paramsToSign = {
        cropping: true,
        folder: 'stricthome',
        source: 'uw', // Important for signed uploads with the widget
        upload_preset: uploadPreset,
    };
    
    console.log('[WIDGET] Paramètres à envoyer au serveur pour signature:', paramsToSign);

    const { timestamp, signature } = await getCloudinarySignature(paramsToSign);

    console.log('[WIDGET] Réponse reçue du serveur:', { timestamp, signature });

    const widgetOptions = {
        cloudName: cloudName,
        apiKey: apiKey,
        uploadSignature: signature,
        uploadSignatureTimestamp: timestamp,
        ...paramsToSign,
    };

    console.log('[WIDGET] Options finales passées à createUploadWidget:', widgetOptions);

    const myWidget = (window as any).cloudinary.createUploadWidget(
      widgetOptions,
      (error: any, result: any) => {
        if (error) {
            console.error('[WIDGET] Erreur Cloudinary:', error);
        }
        if (result && result.event === 'success') {
          console.log('[WIDGET] Upload réussi:', result);
          onUpload(result);
        } else if (result) {
            console.log('[WIDGET] Événement Cloudinary:', result.event, result);
        }
      }
    );

    myWidget.open();
  };

  return (
    <CloudinaryScriptContext.Provider value={{ loaded }}>
      {children({ open: openWidget })}
    </CloudinaryScriptContext.Provider>
  );
}

export { CloudinaryUploadWidget };
export { CloudinaryScriptContext };