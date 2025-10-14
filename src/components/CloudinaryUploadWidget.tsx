// src/components/CloudinaryUploadWidget.tsx
'use client';

import { useState, useEffect, createContext, useCallback } from 'react';

interface CloudinaryScriptContextType {
  loaded: boolean;
}

const CloudinaryScriptContext = createContext<CloudinaryScriptContextType>({ loaded: false });

interface CloudinaryUploadWidgetProps {
  onUpload: (result: any) => void;
  children: (props: { open: () => void; loaded: boolean }) => React.ReactNode;
}

function CloudinaryUploadWidget({ onUpload, children }: CloudinaryUploadWidgetProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupération des variables d'environnement
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    // Vérifier les variables d'environnement au chargement
    if (!cloudName || !uploadPreset) {
      setError('Configuration Cloudinary manquante');
      return;
    }

    // Vérifier si le script est déjà chargé
    if ((window as any).cloudinary) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('id', 'cloudinary-upload-widget');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    
    const handleLoad = () => {
      console.log('[WIDGET] Cloudinary script loaded successfully');
      setLoaded(true);
      setError(null);
    };

    const handleError = () => {
      console.error('[WIDGET] Failed to load Cloudinary script');
      setError('Erreur de chargement du script Cloudinary');
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [cloudName, uploadPreset]);

  const openWidget = useCallback(() => {
    if (!loaded) {
      console.error("[WIDGET] Cloudinary script not loaded yet.");
      setError('Script Cloudinary non chargé');
      return;
    }

    if (!cloudName || !uploadPreset) {
      console.error("[WIDGET] Cloudinary configuration missing");
      setError('Configuration Cloudinary manquante');
      return;
    }

    try {
      const options = {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        cropping: true,
        croppingAspectRatio: 1, // Optionnel: ratio carré
        croppingDefaultSelectionRatio: 0.9,
        folder: 'stricthome',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0078FF",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#FF620C",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1"
          }
        }
      };

      const myWidget = (window as any).cloudinary.createUploadWidget(
        options,
        (error: any, result: any) => {
          if (error) {
            console.error('[WIDGET] Cloudinary upload error:', error);
            setError(`Erreur d'upload: ${error.message || 'Erreur inconnue'}`);
          }
          if (result && result.event === 'success') {
            console.log('[WIDGET] Upload successful:', result.info);
            setError(null);
            onUpload(result);
          }
          
          // Gérer d'autres événements si nécessaire
          if (result && result.event === 'close') {
            console.log('[WIDGET] Widget closed');
          }
        }
      );

      myWidget.open();
    } catch (err) {
      console.error('[WIDGET] Error opening widget:', err);
      setError('Erreur lors de l\'ouverture du widget');
    }
  }, [loaded, cloudName, uploadPreset, onUpload]);

  // Debug: afficher l'état du chargement
  useEffect(() => {
    console.log('[WIDGET] Status:', { loaded, cloudName: !!cloudName, uploadPreset: !!uploadPreset, error });
  }, [loaded, cloudName, uploadPreset, error]);

  return (
    <CloudinaryScriptContext.Provider value={{ loaded }}>
      {children({ open: openWidget, loaded })}
      {error && (
        <div style={{ 
          color: 'red', 
          fontSize: '14px', 
          marginTop: '10px',
          padding: '10px',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          Erreur: {error}
        </div>
      )}
    </CloudinaryScriptContext.Provider>
  );
}

export { CloudinaryUploadWidget, CloudinaryScriptContext };