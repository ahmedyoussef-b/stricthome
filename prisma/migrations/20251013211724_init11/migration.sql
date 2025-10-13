/*
  Warnings:

  - The values [FAILED] on the enum `ProgressStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `updatedAt` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `FinalRound` table. All the data in the column will be lost.
  - You are about to drop the column `recipeName` on the `StudentProgress` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Etalonnage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nom` to the `Classroom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theme` to the `FinalRound` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastUpdated` to the `Leaderboard` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParticipationStatut" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- AlterEnum
BEGIN;
CREATE TYPE "ProgressStatus_new" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'PENDING_VALIDATION');
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

-- DropForeignKey
ALTER TABLE "Etalonnage" DROP CONSTRAINT "Etalonnage_studentId_fkey";

-- DropForeignKey
ALTER TABLE "FinalRoundParticipant" DROP CONSTRAINT "FinalRoundParticipant_finalRoundId_fkey";

-- DropForeignKey
ALTER TABLE "FinalRoundParticipant" DROP CONSTRAINT "FinalRoundParticipant_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAchievement" DROP CONSTRAINT "StudentAchievement_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAchievement" DROP CONSTRAINT "StudentAchievement_studentId_fkey";

-- DropIndex
DROP INDEX "Achievement_name_key";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Classroom" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "nom" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FinalRound" DROP COLUMN "isActive",
DROP COLUMN "title",
ADD COLUMN     "theme" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Leaderboard" ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StudentProgress" DROP COLUMN "recipeName",
ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED',
ALTER COLUMN "startedAt" DROP NOT NULL,
ALTER COLUMN "startedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "requiresAccuracy" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";

-- DropTable
DROP TABLE "Etalonnage";

-- DropTable
DROP TABLE "VerificationToken";

-- AddForeignKey
ALTER TABLE "FinalRoundParticipant" ADD CONSTRAINT "FinalRoundParticipant_finalRoundId_fkey" FOREIGN KEY ("finalRoundId") REFERENCES "FinalRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalRoundParticipant" ADD CONSTRAINT "FinalRoundParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
