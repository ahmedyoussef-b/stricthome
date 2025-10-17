/*
  Warnings:

  - The values [IN_PROGRESS,VERIFIED,PENDING_VALIDATION] on the enum `ProgressStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,PARENT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [ONE_TIME] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `endDate` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `unlockedAt` on the `StudentAchievement` table. All the data in the column will be lost.
  - You are about to drop the column `finalRoundId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_ParticipantsToSession` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nom]` on the table `Metier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,messageId,emoji]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `FinalRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `FinalRound` table without a default value. This is not possible if the table is not empty.
  - Made the column `icon` on table `Metier` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProgressStatus_new" AS ENUM ('NOT_STARTED', 'COMPLETED', 'VALIDATED', 'REJECTED');
ALTER TABLE "StudentProgress" ALTER COLUMN "status" TYPE "ProgressStatus_new" USING ("status"::text::"ProgressStatus_new");
ALTER TYPE "ProgressStatus" RENAME TO "ProgressStatus_old";
ALTER TYPE "ProgressStatus_new" RENAME TO "ProgressStatus";
DROP TYPE "ProgressStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ELEVE', 'PROFESSEUR');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ELEVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
ALTER TABLE "Task" ALTER COLUMN "type" TYPE "TaskType_new" USING ("type"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "TaskType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_finalRoundId_fkey";

-- DropForeignKey
ALTER TABLE "_ParticipantsToSession" DROP CONSTRAINT "_ParticipantsToSession_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParticipantsToSession" DROP CONSTRAINT "_ParticipantsToSession_B_fkey";

-- DropIndex
DROP INDEX "Reaction_messageId_userId_emoji_key";

-- DropIndex
DROP INDEX "User_finalRoundId_key";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FinalRound" DROP COLUMN "endDate",
DROP COLUMN "isActive",
DROP COLUMN "startDate",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isFinished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Leaderboard" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "directMessageSenderId" TEXT;

-- AlterTable
ALTER TABLE "Metier" ALTER COLUMN "icon" SET NOT NULL;

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "StudentAchievement" DROP COLUMN "unlockedAt",
ADD COLUMN     "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "finalRoundId";

-- DropTable
DROP TABLE "_ParticipantsToSession";

-- CreateTable
CREATE TABLE "_SessionParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SessionParticipants_AB_unique" ON "_SessionParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_SessionParticipants_B_index" ON "_SessionParticipants"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Metier_nom_key" ON "Metier"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_messageId_emoji_key" ON "Reaction"("userId", "messageId", "emoji");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_directMessageSenderId_fkey" FOREIGN KEY ("directMessageSenderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentFeedback" ADD CONSTRAINT "ParentFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionParticipants" ADD CONSTRAINT "_SessionParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "CoursSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionParticipants" ADD CONSTRAINT "_SessionParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
