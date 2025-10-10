// hooks/useWebRTCNegotiation.ts
import { useRef, useCallback } from 'react';

// Définir des types plus stricts pour les signaux
export type WebRTCSignal =
  | RTCSessionDescriptionInit
  | { type: 'ice-candidate', candidate: RTCIceCandidateInit | null };

type PendingSignal = {
    fromUserId: string;
    signalData: {
      fromUserId: string;
      toUserId: string;
      signal: WebRTCSignal;
    };
};

export function useWebRTCNegotiation(processPendingSignal: (signal: PendingSignal) => void) {
  const isNegotiating = useRef(false);
  const pendingSignals = useRef<PendingSignal[]>([]);

  const beginNegotiation = useCallback(async (): Promise<boolean> => {
    if (isNegotiating.current) {
      console.log('⏳ [WebRTC] Négociation déjà en cours, attente...');
      return false;
    }
    
    isNegotiating.current = true;
    console.log('🔒 [WebRTC] Début de négociation - verrouillé');
    return true;
  }, []);

  const endNegotiation = useCallback(() => {
    isNegotiating.current = false;
    console.log('🔓 [WebRTC] Fin de négociation - déverrouillé');
    
    // Traiter les signaux en attente
    if (pendingSignals.current.length > 0) {
      const nextSignal = pendingSignals.current.shift();
      if (nextSignal) {
        console.log('🔄 [WebRTC] Traitement signal en attente');
        // Retraiter le signal
        processPendingSignal(nextSignal);
      }
    }
  }, [processPendingSignal]);

  const queueSignal = useCallback((signal: PendingSignal) => {
    pendingSignals.current.push(signal);
    console.log(`📥 [WebRTC] Signal ${signal.signalData.signal.type} mis en attente. File: ${pendingSignals.current.length}`);
  }, []);

  return {
    beginNegotiation,
    endNegotiation,
    queueSignal,
    isNegotiating: isNegotiating.current
  };
};
