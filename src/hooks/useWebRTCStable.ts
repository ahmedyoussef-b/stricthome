// hooks/useWebRTCStable.ts
import { useEffect, useRef, useState } from 'react';

// STOCKAGE GLOBAL pour survivre au Fast Refresh
const globalStreams = new Map<string, MediaStream>();

export function useWebRTCStable(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const initRef = useRef(false);

  useEffect(() => {
    // Vérifier si on a déjà un stream en cache (survie au Fast Refresh)
    const cachedStream = globalStreams.get(sessionId);
    if (cachedStream) {
      console.log('♻️ [useWebRTCStable] Récupération du stream depuis le cache');
      setLocalStream(cachedStream);
      setIsReady(true);
      return;
    }

    if (initRef.current) {
      console.log('⚡ [useWebRTCStable] Initialisation déjà en cours');
      return;
    }

    initRef.current = true;
    mountedRef.current = true;

    console.log('🚀 [useWebRTCStable] Nouvelle initialisation pour:', sessionId);

    const initializeWebRTC = async () => {
      try {
        console.log('🎥 [useWebRTCStable] Demande du flux média...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640 },
          audio: true
        });
        
        if (!mountedRef.current) {
          console.log('⚠️ [useWebRTCStable] Composant démonté pendant l\'init');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Stocker dans le cache global
        globalStreams.set(sessionId, stream);
        
        setLocalStream(stream);
        setIsReady(true);
        setError(null);
        console.log('✅ [useWebRTCStable] Flux média obtenu et caché');

      } catch (err) {
        console.error('❌ [useWebRTCStable] Erreur:', err);
        if (mountedRef.current) {
          setError('Impossible d\'accéder à la caméra/microphone');
          setIsReady(true);
        }
      }
    };

    initializeWebRTC();

    return () => {
      console.log('🧹 [useWebRTCStable] Nettoyage (Fast Refresh?)');
      mountedRef.current = false;
      
      // NE PAS nettoyer le stream ici - le laisser en cache
      // Fast Refresh va remonter le composant immédiatement
    };
  }, [sessionId]);

  return { localStream, isReady, error };
}
