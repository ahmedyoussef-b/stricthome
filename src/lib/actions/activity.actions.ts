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
      console.log('👤 [Activity] Action ignorée: Pas un élève authentifié.');
      return { success: true, pointsAwarded: 0, reason: 'Not an authenticated student' };
    }
    
    console.log(`💓 [Activity] Ping reçu pour l'élève ${userId}.`);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Récupérer l'état actuel du leaderboard
      const currentLeaderboard = await tx.leaderboard.findUnique({
        where: { studentId: userId }
      });

      // 2. Vérifier la limite quotidienne
      if (currentLeaderboard && currentLeaderboard.dailyPoints >= MAX_DAILY_POINTS) {
        console.log(`📈 [Activity] Limite quotidienne de ${MAX_DAILY_POINTS} points atteinte pour ${userId}.`);
        return { success: true, pointsAwarded: 0, reason: 'Daily limit reached' };
      }

      // 3. Calculer les points à attribuer
      const pointsToAward = Math.min(
        POINTS_PER_INTERVAL,
        MAX_DAILY_POINTS - (currentLeaderboard?.dailyPoints || 0)
      );

      if (pointsToAward <= 0) {
        console.log(`ℹ️ [Activity] Aucun point à attribuer pour ${userId}.`);
        return { success: true, pointsAwarded: 0, reason: 'No points to award' };
      }
      
      console.log(`💰 [Activity] Attribution de ${pointsToAward} points à ${userId}.`);

      // 4. Mettre à jour User et Leaderboard en parallèle
      const [, updatedLeaderboard] = await Promise.all([
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
              totalPoints: pointsToAward,
              completedTasks: 0,
              currentStreak: 1,
              bestStreak: 1,
              rank: 0
            },
            update: {
              dailyPoints: { increment: pointsToAward },
              weeklyPoints: { increment: pointsToAward },
              monthlyPoints: { increment: pointsToAward },
              totalPoints: { increment: pointsToAward },
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
    console.error('❌ [Activity] Erreur lors du suivi de l\'activité:', error);
    throw new Error('Failed to track activity.');
  }
}
