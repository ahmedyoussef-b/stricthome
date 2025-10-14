// src/lib/actions/activity.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';

// NOTE: The point awarding logic has been disabled from this action.
// The sole source of points is now the completion of tasks via `task.actions.ts`.
// This action is kept for potential future use (e.g., tracking pure online time without points).

export async function trackStudentActivity(activeSeconds: number) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    
    if (!userId || session.user.role !== 'ELEVE') {
      // Do nothing if not an authenticated student
      return { success: true, pointsAwarded: 0, reason: 'Not an authenticated student or point logic disabled' };
    }

    // Point logic is intentionally disabled here to avoid double-counting.
    // The responsibility for awarding points is now centralized in `completeTask`.
    
    // We could still track raw activity time here if needed in the future,
    // for example by updating a field like `activeSeconds` on the Leaderboard model.

    return { success: true, pointsAwarded: 0, reason: 'Activity tracking is enabled, but point awarding is disabled.' };

  } catch (error) {
    console.error('Error tracking student activity:', error);
    // Return a generic error to avoid exposing implementation details
    throw new Error('Failed to track activity.');
  }
}
