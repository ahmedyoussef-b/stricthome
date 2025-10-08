// hooks/useWebRTCStable.ts
import { useEffect, useRef, useState } from 'react';

// STOCKAGE GLOBAL pour survivre au Fast Refresh
const globalStreams = new Map<string, MediaStream>();
const initializationPromises = new Map<string, Promise<MediaStream>>();

export function useWebRTCStable(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    console.log('🚀 [useWebRTCStable] Démarrage pour:', sessionId);

    const initializeWebRTC = async () => {
      // 1. Vérifier le cache d'abord
      const cachedStream = globalStreams.get(sessionId);
      if (cachedStream) {
        console.log('♻️ [useWebRTCStable] Stream depuis cache');
        return cachedStream;
      }

      // 2. Vérifier si une initialisation est déjà en cours
      const existingPromise = initializationPromises.get(sessionId);
      if (existingPromise) {
        console.log('⏳ [useWebRTCStable] Récupération promise existante');
        return existingPromise;
      }

      // 3. Nouvelle initialisation
      console.log('🎥 [useWebRTCStable] Nouvelle initialisation');
      const promise = (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640 },
            audio: true
          });
          
          // Stocker dans le cache
          globalStreams.set(sessionId, stream);
          initializationPromises.delete(sessionId);
          
          console.log('✅ [useWebRTCStable] Flux obtenu et caché');
          return stream;
        } catch (error) {
          initializationPromises.delete(sessionId);
          throw error;
        }
      })();

      initializationPromises.set(sessionId, promise);
      return promise;
    };

    // Démarrer l'initialisation
    initializeWebRTC()
      .then(stream => {
        if (!mountedRef.current) {
          console.log('⚠️ [useWebRTCStable] Composant démonté, stream ignoré');
          return;
        }
        setLocalStream(stream);
        setError(null);
        setIsReady(true);
        console.log('🎉 [useWebRTCStable] Stream défini dans le state');
      })
      .catch(err => {
        if (!mountedRef.current) return;
        console.error('❌ [useWebRTCStable] Erreur finale:', err);
        setError("Impossible d'accéder à la caméra/microphone. Veuillez vérifier les permissions de votre navigateur.");
        setIsReady(true); // Marquer comme prêt même en erreur
      });

    return () => {
      console.log('🧹 [useWebRTCStable] Nettoyage (démontage composant)');
      mountedRef.current = false;
      // NE PAS nettoyer le stream - il reste en cache global pour survivre au Fast Refresh
    };
  }, [sessionId]);

  return { localStream, isReady, error };
}