// hooks/useWebRTCNegotiation.ts
import { useRef } from 'react';

export function useWebRTCNegotiation() {
  const isNegotiating = useRef(false);
  const pendingOffers = useRef<Array<{ from: string, signalData: any }>>([]);

  const startNegotiation = () => {
    if (isNegotiating.current) {
      console.log('⚠️ [WebRTC] Négociation déjà en cours, attente...');
      return false;
    }
    isNegotiating.current = true;
    console.log('🔒 [WebRTC] Début de négociation - verrouillé');
    return true;
  };

  const endNegotiation = () => {
    isNegotiating.current = false;
    console.log('🔓 [WebRTC] Fin de négociation - déverrouillé');
    
    // Traiter les offres en attente
    if (pendingOffers.current.length > 0) {
      const nextOffer = pendingOffers.current.shift();
      return nextOffer;
    }
    return null;
  };

  const addPendingOffer = (from: string, signalData: any) => {
    pendingOffers.current.push({ from, signalData });
    console.log(`📥 [WebRTC] Offre mise en attente de ${from}. File: ${pendingOffers.current.length}`);
  };

  const clearPendingOffers = () => {
    pendingOffers.current = [];
  };

  return {
    isNegotiatingRef: isNegotiating,
    startNegotiation,
    endNegotiation,
    addPendingOffer,
    clearPendingOffers,
    processNextOffer: () => {
      if (pendingOffers.current.length > 0) {
        return pendingOffers.current.shift();
      }
      return null;
    }
  };
}
