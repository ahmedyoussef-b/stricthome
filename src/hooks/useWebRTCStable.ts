// hooks/useWebRTCStable.ts
import { useEffect, useRef, useState } from 'react';

export function useWebRTCStable(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const initAttemptRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    initAttemptRef.current = 0;

    console.log('🚀 [useWebRTCStable] Démarrage pour session:', sessionId);

    const initializeWebRTC = async (attempt = 0) => {
      if (!mountedRef.current) return;
      
      try {
        console.log(`🎥 [useWebRTCStable] Tentative ${attempt + 1} - Demande flux média...`);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640 },
          audio: true
        });
        
        if (!mountedRef.current) {
          console.log('⚠️ [useWebRTCStable] Composant démonté, nettoyage immédiat');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setLocalStream(stream);
        setIsReady(true);
        setError(null);
        console.log('✅ [useWebRTCStable] Flux média obtenu avec succès');

      } catch (err) {
        console.error(`❌ [useWebRTCStable] Erreur tentative ${attempt + 1}:`, err);
        
        if (!mountedRef.current) return;

        if (attempt < 2) { // Maximum 3 tentatives
          const delay = Math.min(1000 * (attempt + 1), 3000);
          console.log(`⏳ [useWebRTCStable] Nouvelle tentative dans ${delay}ms...`);
          setTimeout(() => initializeWebRTC(attempt + 1), delay);
        } else {
          setError('Impossible d\'accéder à la caméra/microphone');
          setIsReady(true); // Marquer comme prêt même en erreur
        }
      }
    };

    // Démarrer avec un petit délai pour laisser le composant se stabiliser
    setTimeout(() => {
      if (mountedRef.current) {
        initializeWebRTC(0);
      }
    }, 100);

    return () => {
      console.log('🧹 [useWebRTCStable] Nettoyage définitif');
      mountedRef.current = false;
      if (streamRef.current) {
        console.log('🧹 [useWebRTCStable] Arrêt des tracks média');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [sessionId]);

  return { localStream, isReady, error };
}