// src/lib/actions/activity.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';

const POINTS_PER_INTERVAL = 20;
const MAX_DAILY_POINTS = 200;

export async function trackStudentActivity(activeSeconds: number) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    
    if (!userId || session.user.role !== 'ELEVE') {
      return { success: true, pointsAwarded: 0, reason: 'Not an authenticated student' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Récupérer l'état actuel du leaderboard
      const currentLeaderboard = await tx.leaderboard.findUnique({
        where: { studentId: userId }
      });

      // 2. Vérifier la limite quotidienne
      if (currentLeaderboard && currentLeaderboard.dailyPoints >= MAX_DAILY_POINTS) {
        return { success: true, pointsAwarded: 0, reason: 'Daily limit reached' };
      }

      // 3. Calculer les points à attribuer
      const pointsToAward = Math.min(
        POINTS_PER_INTERVAL,
        MAX_DAILY_POINTS - (currentLeaderboard?.dailyPoints || 0)
      );

      if (pointsToAward <= 0) {
        return { success: true, pointsAwarded: 0, reason: 'No points to award' };
      }

      // 4. Mettre à jour User et Leaderboard en parallèle
      const [updatedUser, updatedLeaderboard] = await Promise.all([
         tx.user.update({
            where: { id: userId },
            data: {
              points: { increment: pointsToAward }
            }
         }),
         tx.leaderboard.upsert({
            where: { studentId: userId },
            create: {
              studentId: userId,
              dailyPoints: pointsToAward,
              weeklyPoints: pointsToAward,
              monthlyPoints: pointsToAward,
              totalPoints: pointsToAward, // Will be corrected after user update
              completedTasks: 0,
              currentStreak: 1,
              bestStreak: 1,
              rank: 0
            },
            update: {
              dailyPoints: { increment: pointsToAward },
              weeklyPoints: { increment: pointsToAward },
              monthlyPoints: { increment: pointsToAward },
              totalPoints: { increment: pointsToAward }, // Increment is safer in transactions
              updatedAt: new Date()
            }
          })
      ]);
      
      return { 
        success: true, 
        pointsAwarded: pointsToAward,
        dailyPoints: updatedLeaderboard.dailyPoints
      };
    });

    return result;
  } catch (error) {
    console.error('Error tracking student activity:', error);
    // Masquer les détails de l'erreur au client
    throw new Error('Failed to track activity.');
  }
}
