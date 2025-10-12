// src/hooks/useActivityTracker.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trackStudentActivity } from '@/lib/actions/activity.actions';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
const PING_INTERVAL = 30 * 1000; // 30 seconds

export function useActivityTracker(enabled: boolean) {
  const lastActivityTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
  }, []);

  const pingServer = useCallback(async () => {
    const now = Date.now();
    const elapsedSeconds = (now - lastActivityTimeRef.current) / 1000;
    
    // Only track if document is visible
    if (document.visibilityState === 'visible') {
        // Send the actual time since last activity. The server will handle inactivity logic.
        try {
            await trackStudentActivity(PING_INTERVAL / 1000);
        } catch (error) {
            console.error('[ActivityTracker] Failed to ping server:', error);
        }
    }
    // Update last activity time after pinging to measure next interval correctly
    lastActivityTimeRef.current = now;
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

    // Set initial activity time
    lastActivityTimeRef.current = Date.now();

    // Add event listeners for user activity
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, handleActivity));
    
    // Add visibility change listener
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            lastActivityTimeRef.current = Date.now();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up the interval to ping the server
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(pingServer, PING_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleActivity, pingServer]);
}
