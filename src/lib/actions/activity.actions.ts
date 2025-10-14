// src/lib/actions/activity.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';

const POINTS_PER_INTERVAL = 20;
const MAX_DAILY_POINTS_FROM_ACTIVITY = 200; // Limite quotidienne pour l'activité de base

export async function trackStudentActivity(activeSeconds: number) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    
    if (!userId || session.user.role !== 'ELEVE') {
      // Ne rien faire si ce n'est pas un élève authentifié
      return { success: true, pointsAwarded: 0, reason: 'Not an authenticated student' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Récupérer l'état actuel du leaderboard
      let leaderboard = await tx.leaderboard.findUnique({
        where: { studentId: userId }
      });

      // Si l'entrée de classement n'existe pas, nous la créerons plus tard avec upsert.
      const currentDailyPoints = leaderboard?.dailyPoints || 0;

      // 2. Vérifier la limite quotidienne
      if (currentDailyPoints >= MAX_DAILY_POINTS_FROM_ACTIVITY) {
        return { success: true, pointsAwarded: 0, reason: 'Daily limit reached' };
      }

      // 3. Calculer les points à attribuer (respecter la limite)
      const pointsToAward = Math.min(
        POINTS_PER_INTERVAL,
        MAX_DAILY_POINTS_FROM_ACTIVITY - currentDailyPoints
      );

      if (pointsToAward <= 0) {
        return { success: true, pointsAwarded: 0, reason: 'No points to award' };
      }

      // 4. Mettre à jour les points totaux de l'utilisateur
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: { increment: pointsToAward }
        }
      });

      // 5. Mettre à jour ou créer l'entrée Leaderboard
      const updatedLeaderboard = await tx.leaderboard.upsert({
        where: { studentId: userId },
        create: {
          studentId: userId,
          dailyPoints: pointsToAward,
          weeklyPoints: pointsToAward,
          monthlyPoints: pointsToAward,
          totalPoints: updatedUser.points,
          completedTasks: 0,
          currentStreak: 1,
          bestStreak: 1,
          rank: 0 // Le rang sera calculé par un autre processus si nécessaire
        },
        update: {
          dailyPoints: { increment: pointsToAward },
          weeklyPoints: { increment: pointsToAward },
          monthlyPoints: { increment: pointsToAward },
          totalPoints: updatedUser.points,
          updatedAt: new Date()
        }
      });

      return { 
        success: true, 
        pointsAwarded: pointsToAward,
        dailyPoints: updatedLeaderboard.dailyPoints
      };
    });

    return result;
  } catch (error) {
    console.error('Error tracking student activity:', error);
    // Renvoyer une erreur générique pour ne pas exposer les détails de l'implémentation
    throw new Error('Failed to track activity.');
  }
}
