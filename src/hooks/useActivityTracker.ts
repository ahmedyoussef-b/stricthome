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
    lastActivityTimeRef.current = Date.now();
  }, []);

  const pingServer = useCallback(async () => {
    const now = Date.now();
    const isInactive = now - lastActivityTimeRef.current > INACTIVITY_THRESHOLD;

    // Ne rien envoyer si l'onglet n'est pas visible ou si l'utilisateur est inactif
    if (document.visibilityState !== 'visible' || isInactive) {
      return;
    }
    
    try {
      // Envoyer le temps écoulé depuis le dernier ping réussi.
      // Le serveur s'attend à recevoir une valeur numérique.
      await trackStudentActivity(PING_INTERVAL / 1000);
    } catch (error) {
      console.error('[ActivityTracker] Failed to ping server:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      return;
    }

    // Initialisation
    lastActivityTimeRef.current = Date.now();

    // Écouteurs d'événements
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, handleActivity));
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityTimeRef.current = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Intervalle
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(pingServer, PING_INTERVAL);

    // Nettoyage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleActivity, pingServer]);

}
