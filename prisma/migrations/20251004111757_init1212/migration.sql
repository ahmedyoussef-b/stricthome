/*
  Warnings:

  - You are about to drop the `Annonce` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Classe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CoursSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EtatEleve` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskCompletion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ParticipantsSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Annonce" DROP CONSTRAINT "Annonce_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Annonce" DROP CONSTRAINT "Annonce_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Classe" DROP CONSTRAINT "Classe_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_initiatorId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "CoursSession" DROP CONSTRAINT "CoursSession_classeId_fkey";

-- DropForeignKey
ALTER TABLE "CoursSession" DROP CONSTRAINT "CoursSession_professeurId_fkey";

-- DropForeignKey
ALTER TABLE "EtatEleve" DROP CONSTRAINT "EtatEleve_metierId_fkey";

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

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_classeId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_etatEleveId_fkey";

-- DropForeignKey
ALTER TABLE "_ParticipantsSession" DROP CONSTRAINT "_ParticipantsSession_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParticipantsSession" DROP CONSTRAINT "_ParticipantsSession_B_fkey";

-- DropTable
DROP TABLE "Annonce";

-- DropTable
DROP TABLE "Classe";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "CoursSession";

-- DropTable
DROP TABLE "EtatEleve";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Metier";

-- DropTable
DROP TABLE "Reaction";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "TaskCompletion";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "_ParticipantsSession";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "ambition" TEXT,
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etats_eleves" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "isPunished" BOOLEAN NOT NULL DEFAULT false,
    "metierId" TEXT,

    CONSTRAINT "etats_eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metiers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "theme" JSONB NOT NULL,

    CONSTRAINT "metiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours_sessions" (
    "id" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "spotlightedParticipantSid" TEXT,
    "whiteboardControllerId" TEXT,

    CONSTRAINT "cours_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "classeId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "TaskType" NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SessionParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "etats_eleves_eleveId_key" ON "etats_eleves"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_messageId_userId_emoji_key" ON "reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_initiatorId_receiverId_key" ON "conversations"("initiatorId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "task_completions_userId_taskId_completedAt_key" ON "task_completions"("userId", "taskId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "_SessionParticipants_AB_unique" ON "_SessionParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_SessionParticipants_B_index" ON "_SessionParticipants"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etats_eleves" ADD CONSTRAINT "etats_eleves_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etats_eleves" ADD CONSTRAINT "etats_eleves_metierId_fkey" FOREIGN KEY ("metierId") REFERENCES "metiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_sessions" ADD CONSTRAINT "cours_sessions_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_sessions" ADD CONSTRAINT "cours_sessions_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionParticipants" ADD CONSTRAINT "_SessionParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "cours_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionParticipants" ADD CONSTRAINT "_SessionParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
