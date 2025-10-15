// src/hooks/useActivityTracker.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trackStudentActivity } from '@/lib/actions/activity.actions';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
const PING_INTERVAL = 30 * 1000; // 30 seconds
const INACTIVITY_THRESHOLD = 60 * 1000; // 1 minute

export function useActivityTracker(enabled: boolean) {
  const lastActivityTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleActivity = useCallback(() => {
    // console.log('🏃‍♂️ [Heartbeat] Activité détectée');
    lastActivityTimeRef.current = Date.now();
  }, []);

  const pingServer = useCallback(async () => {
    const now = Date.now();
    const isInactive = now - lastActivityTimeRef.current > INACTIVITY_THRESHOLD;

    if (document.visibilityState !== 'visible' || isInactive) {
      console.log(`🟡 [Heartbeat] Ping ignoré (Visible: ${document.visibilityState === 'visible'}, Inactif: ${isInactive})`);
      return;
    }
    
    console.log('💓 [Heartbeat] Envoi du ping au serveur...');
    try {
      const result = await trackStudentActivity(PING_INTERVAL / 1000);
      console.log('✅ [Heartbeat] Réponse du serveur:', result);
    } catch (error) {
      console.error('❌ [Heartbeat] Échec du ping au serveur:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        console.log('🛑 [Heartbeat] Tracker désactivé et intervalle nettoyé.');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      return;
    }

    console.log('🚀 [Heartbeat] Tracker d\'activité initialisé.');
    lastActivityTimeRef.current = Date.now();

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, handleActivity));
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 [Heartbeat] Onglet devenu visible, réinitialisation du temps d\'activité.');
        lastActivityTimeRef.current = Date.now();
      } else {
        console.log('🙈 [Heartbeat] Onglet devenu caché.');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(pingServer, PING_INTERVAL);
    console.log(`⏰ [Heartbeat] Intervalle de ping défini toutes les ${PING_INTERVAL / 1000} secondes.`);

    return () => {
      console.log('🧹 [Heartbeat] Nettoyage du tracker d\'activité.');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleActivity, pingServer]);

}
