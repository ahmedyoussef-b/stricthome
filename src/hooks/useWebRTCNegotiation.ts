// hooks/useWebRTCNegotiation.ts
import { useRef, useCallback } from 'react';

type PendingOffer = {
    fromUserId: string;
    signalData: any;
};

export function useWebRTCNegotiation() {
  const isNegotiating = useRef(false);
  const pendingOffers = useRef<PendingOffer[]>([]);

  const startNegotiation = useCallback(() => {
    if (isNegotiating.current) {
      console.log('⚠️ [WebRTC] Négociation déjà en cours, attente...');
      return false;
    }
    isNegotiating.current = true;
    console.log('🔒 [WebRTC] Début de négociation - verrouillé');
    return true;
  }, []);

  const endNegotiation = useCallback((): PendingOffer | null => {
    isNegotiating.current = false;
    console.log('🔓 [WebRTC] Fin de négociation - déverrouillé');
    
    // Retourner la première offre en attente
    if (pendingOffers.current.length > 0) {
      const nextOffer = pendingOffers.current.shift();
      console.log(`🔄 [WebRTC] Offre en attente libérée: ${pendingOffers.current.length} restante(s)`);
      return nextOffer!;
    }
    return null;
  }, []);

  const addPendingOffer = useCallback((fromUserId: string, signalData: any) => {
    pendingOffers.current.push({ fromUserId, signalData });
    console.log(`📥 [WebRTC] Offre mise en attente de ${fromUserId}. File: ${pendingOffers.current.length}`);
  }, []);

  const clearPendingOffers = useCallback(() => {
    console.log(`🧹 [WebRTC] Nettoyage de ${pendingOffers.current.length} offre(s) en attente`);
    pendingOffers.current = [];
  }, []);

  const getPendingCount = useCallback(() => {
    return pendingOffers.current.length;
  }, []);

  return {
    isNegotiatingRef: isNegotiating,
    startNegotiation,
    endNegotiation,
    addPendingOffer,
    clearPendingOffers,
    getPendingCount,
  };
}
