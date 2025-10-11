// hooks/useWebRTCNegotiation.ts
import { useRef, useCallback } from 'react';

// Définir des types plus stricts pour les signaux
export type WebRTCSignal =
  | RTCSessionDescriptionInit
  | { type: 'ice-candidate', candidate: RTCIceCandidateInit | null };

export type PendingSignal = {
    fromUserId: string;
    signalData: {
      fromUserId: string;
      toUserId: string;
      signal: WebRTCSignal;
    };
};

export function useWebRTCNegotiation() {
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
    
    if (pendingSignals.current.length > 0) {
      const nextSignal = pendingSignals.current.shift();
      if (nextSignal) {
        console.log(`🔄 [WebRTC] Signal en attente libéré: ${pendingSignals.current.length} restant(s)`);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('webrtc-signal-retry', { 
            detail: nextSignal 
          }));
        }, 100);
      }
    }
  }, []);

  const queueSignal = useCallback((signal: PendingSignal) => {
    const { fromUserId, signalData } = signal;
    const isDuplicateOffer = pendingSignals.current.some(
      s => s.fromUserId === fromUserId && s.signalData.signal.type === 'offer' && signalData.signal.type === 'offer'
    );
    
    if (!isDuplicateOffer) {
      pendingSignals.current.push(signal);
      console.log(`📥 [WebRTC] Signal ${signalData.signal.type} mis en attente pour ${fromUserId}. File: ${pendingSignals.current.length}`);
    } else {
      console.log(`[WebRTC] Offre dupliquée de ${fromUserId} ignorée.`);
    }
  }, []);

  const clearPendingSignals = useCallback((userId?: string) => {
    if (userId) {
      pendingSignals.current = pendingSignals.current.filter(
        signal => signal.fromUserId !== userId
      );
      console.log(`🧹 [WebRTC] File d'attente nettoyée pour ${userId}`);
    } else {
      pendingSignals.current = [];
      console.log("🧹 [WebRTC] File d'attente complètement nettoyée");
    }
  }, []);

  return {
    beginNegotiation,
    endNegotiation,
    queueSignal,
    clearPendingSignals,
  };
};
