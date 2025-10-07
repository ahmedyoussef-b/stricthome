-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ELEVE', 'PROFESSEUR');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'FINAL');

-- CreateEnum
CREATE TYPE "TaskDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('ACADEMIC', 'CREATIVE', 'COLLABORATIVE', 'PERSONAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL,
    "points" INTEGER DEFAULT 0,
    "ambition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classeId" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "professeurId" UUID NOT NULL,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtatEleve" (
    "id" UUID NOT NULL,
    "eleveId" UUID NOT NULL,
    "isPunished" BOOLEAN NOT NULL DEFAULT false,
    "metierId" UUID,

    CONSTRAINT "EtatEleve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metier" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "theme" JSONB NOT NULL,

    CONSTRAINT "Metier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursSession" (
    "id" TEXT NOT NULL,
    "professeurId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "spotlightedParticipantSid" TEXT,
    "whiteboardControllerId" TEXT,
    "classeId" UUID,

    CONSTRAINT "CoursSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annonce" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" UUID NOT NULL,
    "classeId" UUID,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "initiatorId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderId" UUID NOT NULL,
    "senderName" TEXT NOT NULL,
    "classeId" UUID,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "points" INTEGER NOT NULL,
    "difficulty" "TaskDifficulty" NOT NULL DEFAULT 'EASY',
    "category" "TaskCategory" NOT NULL DEFAULT 'ACADEMIC',
    "duration" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProgress" (
    "id" TEXT NOT NULL,
    "studentId" UUID NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3),
    "submittedProof" TEXT,
    "pointsAwarded" INTEGER NOT NULL,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "studentId" UUID NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "dailyPoints" INTEGER NOT NULL,
    "weeklyPoints" INTEGER NOT NULL,
    "monthlyPoints" INTEGER NOT NULL,
    "completedTasks" INTEGER NOT NULL,
    "currentStreak" INTEGER NOT NULL,
    "bestStreak" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "medal" TEXT,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionSettings" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "finalRoundDate" TIMESTAMP(3) NOT NULL,
    "pointsMultipliers" JSONB NOT NULL,

    CONSTRAINT "CompetitionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Participants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EtatEleve_eleveId_key" ON "EtatEleve"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "Metier_nom_key" ON "Metier"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_initiatorId_receiverId_key" ON "Conversation"("initiatorId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgress_studentId_taskId_key" ON "StudentProgress"("studentId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_studentId_key" ON "Leaderboard"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionSettings_academicYear_key" ON "CompetitionSettings"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "_Participants_AB_unique" ON "_Participants"("A", "B");

-- CreateIndex
CREATE INDEX "_Participants_B_index" ON "_Participants"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatEleve" ADD CONSTRAINT "EtatEleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatEleve" ADD CONSTRAINT "EtatEleve_metierId_fkey" FOREIGN KEY ("metierId") REFERENCES "Metier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursSession" ADD CONSTRAINT "CoursSession_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursSession" ADD CONSTRAINT "CoursSession_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgress" ADD CONSTRAINT "StudentProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgress" ADD CONSTRAINT "StudentProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Participants" ADD CONSTRAINT "_Participants_A_fkey" FOREIGN KEY ("A") REFERENCES "CoursSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Participants" ADD CONSTRAINT "_Participants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
