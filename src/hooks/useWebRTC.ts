// hooks/useWebRTC.ts - Version robuste
import { useEffect, useRef, useState } from 'react';

export function useWebRTC(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const initRef = useRef(false);

  useEffect(() => {
    // Protection contre l'initialisation multiple
    if (initRef.current) {
      console.log('⚡ [useWebRTC] Déjà initialisé, ignore');
      return;
    }
    
    initRef.current = true;
    mountedRef.current = true;
    
    console.log('🎥 [useWebRTC] Initialisation POUR DE BON:', sessionId);

    const initialize = async () => {
      try {
        console.log('🎥 [useWebRTC] Demande du flux média...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640 },
          audio: true
        });
        
        if (mountedRef.current) {
          streamRef.current = stream;
          setLocalStream(stream);
          setIsReady(true);
          console.log('✅ [useWebRTC] Flux média obtenu avec succès');
        } else {
          // Composant démonté, nettoyer immédiatement
          console.log('⚠️ [useWebRTC] Composant démonté pendant l\'initialisation');
          stream.getTracks().forEach(track => track.stop());
        }

      } catch (error) {
        console.error('❌ [useWebRTC] Erreur accès média:', error);
        if (mountedRef.current) {
          setIsReady(true); // Marquer comme prêt même en cas d'erreur
        }
      }
    };

    initialize();

    return () => {
      console.log('🧹 [useWebRTC] NETTOYAGE DÉFINITIF');
      mountedRef.current = false;
      if (streamRef.current) {
        console.log('🧹 [useWebRTC] Arrêt des tracks média');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [sessionId]);

  return { localStream, isReady };
}
