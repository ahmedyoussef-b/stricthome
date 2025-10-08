// hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';

export function useWebRTC(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    console.log('🎥 [useWebRTC] Initialisation pour session:', sessionId);

    let mounted = true;

    const initialize = async () => {
      try {
        console.log('🎥 [useWebRTC] Demande du flux média...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640 }, 
          audio: true
        });
        
        if (mounted) {
          streamRef.current = stream;
          setLocalStream(stream);
          setIsReady(true);
          console.log('✅ [useWebRTC] Flux média obtenu');
        } else {
          // Composant démonté, nettoyer
          stream.getTracks().forEach(track => track.stop());
        }

      } catch (error) {
        console.error('❌ [useWebRTC] Erreur:', error);
        if (mounted) setIsReady(true); // Marquer comme prêt même en cas d'erreur pour débloquer l'UI
      }
    };

    initialize();

    return () => {
      console.log('🧹 [useWebRTC] Nettoyage');
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId]);

  return { localStream, isReady };
}
