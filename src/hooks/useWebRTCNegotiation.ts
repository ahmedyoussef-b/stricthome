// hooks/useWebRTCNegotiation.ts - VERSION AMÉLIORÉE
import { useRef } from 'react';

export function useWebRTCNegotiation() {
  const isNegotiating = useRef(false);
  const pendingSignals = useRef<Array<{ type: string; data: any }>>([]);

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
    
    // Traiter les signaux en attente
    if (pendingSignals.current.length > 0) {
      console.log('🔄 [WebRTC] Traitement des signaux en attente:', pendingSignals.current.length);
      const signals = [...pendingSignals.current];
      pendingSignals.current = [];
      return signals;
    }
    return [];
  };

  const addPendingSignal = (type: string, data: any) => {
    console.log('📥 [WebRTC] Signal mis en attente:', type);
    pendingSignals.current.push({ type, data });
  };

  return {
    startNegotiation,
    endNegotiation,
    addPendingSignal,
    isNegotiating: isNegotiating.current
  };
}
