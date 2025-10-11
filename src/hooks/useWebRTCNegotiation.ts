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
    
    // Traiter UN SEUL signal en attente pour éviter la boucle
    if (pendingSignals.current.length > 0) {
      const nextSignal = pendingSignals.current.shift();
      if (nextSignal) {
        console.log(`🔄 [WebRTC] Signal en attente libéré: ${pendingSignals.current.length} restant(s)`);
        // Utiliser setTimeout pour briser le cycle synchrone
        setTimeout(() => {
          // Émettre un événement personnalisé pour que le composant principal puisse retraiter le signal
          window.dispatchEvent(new CustomEvent('webrtc-signal-retry', { 
            detail: nextSignal 
          }));
        }, 100);
      }
    }
  }, []);

  const queueSignal = useCallback((signal: PendingSignal) => {
    const { fromUserId, signalData } = signal;
    // Éviter les doublons de signaux 'offer' pour le même utilisateur
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

  return {
    beginNegotiation,
    endNegotiation,
    queueSignal,
  };
};
