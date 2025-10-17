/*
  Warnings:

  - You are about to drop the column `description` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `isFinished` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `FinalRoundParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Leaderboard` table. All the data in the column will be lost.
  - You are about to drop the column `directMessageSenderId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `earnedAt` on the `StudentAchievement` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Task` table. All the data in the column will be lost.
  - Added the required column `classroomId` to the `FinalRound` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ProgressStatus" ADD VALUE 'IN_PROGRESS';

-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_directMessageSenderId_fkey";

-- DropIndex
DROP INDEX "FinalRoundParticipant_finalRoundId_studentId_key";

-- DropIndex
DROP INDEX "Metier_nom_key";

-- DropIndex
DROP INDEX "Reaction_userId_messageId_emoji_key";

-- AlterTable
ALTER TABLE "Classroom" ALTER COLUMN "professeurId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FinalRound" DROP COLUMN "description",
DROP COLUMN "isFinished",
DROP COLUMN "name",
ADD COLUMN     "classroomId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FinalRoundParticipant" DROP COLUMN "joinedAt";

-- AlterTable
ALTER TABLE "Leaderboard" DROP COLUMN "createdAt",
ALTER COLUMN "totalPoints" SET DEFAULT 0,
ALTER COLUMN "dailyPoints" SET DEFAULT 0,
ALTER COLUMN "weeklyPoints" SET DEFAULT 0,
ALTER COLUMN "monthlyPoints" SET DEFAULT 0,
ALTER COLUMN "completedTasks" SET DEFAULT 0,
ALTER COLUMN "currentStreak" SET DEFAULT 0,
ALTER COLUMN "bestStreak" SET DEFAULT 0,
ALTER COLUMN "rank" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "directMessageSenderId";

-- AlterTable
ALTER TABLE "StudentAchievement" DROP COLUMN "earnedAt",
ADD COLUMN     "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "StudentProgress" ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalRound" ADD CONSTRAINT "FinalRound_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
