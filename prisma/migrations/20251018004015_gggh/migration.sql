/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `classroomId` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `FinalRound` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,finalRoundId]` on the table `FinalRoundParticipant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom]` on the table `Metier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,messageId,emoji]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `professeurId` on table `Classroom` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `endDate` to the `FinalRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `FinalRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `FinalRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `FinalRoundParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "FinalRound" DROP CONSTRAINT "FinalRound_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "ParentFeedback" DROP CONSTRAINT "ParentFeedback_studentId_fkey";

-- AlterTable
ALTER TABLE "Classroom" ALTER COLUMN "professeurId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "FinalRound" DROP COLUMN "classroomId",
DROP COLUMN "endTime",
DROP COLUMN "isActive",
DROP COLUMN "startTime",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FinalRoundParticipant" ADD COLUMN     "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rank" INTEGER NOT NULL,
ALTER COLUMN "score" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Leaderboard" ALTER COLUMN "totalPoints" DROP DEFAULT,
ALTER COLUMN "completedTasks" DROP DEFAULT,
ALTER COLUMN "rank" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "directMessageSenderId" TEXT;

-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "StudentProgress" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED',
ALTER COLUMN "accuracy" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "FinalRoundParticipant_studentId_finalRoundId_key" ON "FinalRoundParticipant"("studentId", "finalRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "Metier_nom_key" ON "Metier"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_messageId_emoji_key" ON "Reaction"("userId", "messageId", "emoji");

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
