// src/components/CloudinaryUploadWidget.tsx
'use client';

import { useState, useEffect, createContext } from 'react';

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

  const openWidget = () => {
    if (!loaded) {
      console.error("[WIDGET] Cloudinary script not loaded yet.");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("[WIDGET] Cloudinary cloud_name or upload_preset is missing from environment variables.");
      return;
    }

    const options = {
      cloudName: cloudName,
      uploadPreset: uploadPreset,
      cropping: true,
      folder: 'stricthome',
      sources: ['local', 'url', 'camera'],
      multiple: false,
    };

    const myWidget = (window as any).cloudinary.createUploadWidget(
      options,
      (error: any, result: any) => {
        if (error) {
            console.error('[WIDGET] Erreur Cloudinary:', error);
        }
        if (result && result.event === 'success') {
          onUpload(result);
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
