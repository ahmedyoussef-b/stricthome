/*
  Warnings:

  - You are about to drop the column `eleveId` on the `EtatEleve` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,taskId,completedAt]` on the table `TaskCompletion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[etatEleveId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `professeurId` on table `Classe` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Classe" DROP CONSTRAINT "Classe_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_initiatorId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "EtatEleve" DROP CONSTRAINT "EtatEleve_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCompletion" DROP CONSTRAINT "TaskCompletion_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCompletion" DROP CONSTRAINT "TaskCompletion_userId_fkey";

-- DropIndex
DROP INDEX "EtatEleve_eleveId_key";

-- DropIndex
DROP INDEX "Metier_nom_key";

-- AlterTable
ALTER TABLE "Classe" ALTER COLUMN "professeurId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CoursSession" ADD COLUMN     "whiteboardControllerId" TEXT;

-- AlterTable
ALTER TABLE "EtatEleve" DROP COLUMN "eleveId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "etatEleveId" TEXT,
ALTER COLUMN "ambition" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Message_classeId_idx" ON "Message"("classeId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_userId_taskId_completedAt_key" ON "TaskCompletion"("userId", "taskId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_etatEleveId_key" ON "User"("etatEleveId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_etatEleveId_fkey" FOREIGN KEY ("etatEleveId") REFERENCES "EtatEleve"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
