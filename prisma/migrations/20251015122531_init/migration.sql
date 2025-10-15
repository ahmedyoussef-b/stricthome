-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ELEVE', 'PROFESSEUR', 'ADMIN', 'PARENT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('ACADEMIC', 'PERSONAL', 'CREATIVE', 'COLLABORATIVE');

-- CreateEnum
CREATE TYPE "TaskDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'PENDING_VALIDATION');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('AUTOMATIC', 'PROFESSOR', 'PARENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ELEVE',
    "ambition" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "parentPassword" TEXT,
    "classroomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursSession" (
    "id" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "whiteboardControllerId" TEXT,
    "spotlightedParticipantSid" TEXT,
    "classroomId" TEXT,

    CONSTRAINT "CoursSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classroomId" TEXT,
    "conversationId" TEXT,
    "isQuestion" BOOLEAN,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtatEleve" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "isPunished" BOOLEAN NOT NULL DEFAULT false,
    "metierId" TEXT,

    CONSTRAINT "EtatEleve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "theme" JSONB NOT NULL,

    CONSTRAINT "Metier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "TaskType" NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "difficulty" "TaskDifficulty" NOT NULL,
    "duration" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,
    "validationType" "ValidationType" NOT NULL DEFAULT 'PROFESSOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "attachmentUrl" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completionDate" TIMESTAMP(3),
    "pointsAwarded" INTEGER,
    "submissionUrl" TEXT,
    "accuracy" DOUBLE PRECISION,
    "recipeName" TEXT,

    CONSTRAINT "StudentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentFeedback" (
    "id" TEXT NOT NULL,
    "studentProgressId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "taste" INTEGER NOT NULL,
    "presentation" INTEGER NOT NULL,
    "autonomy" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachmentUrl" TEXT,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "dailyPoints" INTEGER NOT NULL,
    "weeklyPoints" INTEGER NOT NULL,
    "monthlyPoints" INTEGER NOT NULL,
    "completedTasks" INTEGER NOT NULL,
    "currentStreak" INTEGER NOT NULL,
    "bestStreak" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "criteria" JSONB NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAchievement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalRound" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "winnerId" TEXT,

    CONSTRAINT "FinalRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalRoundParticipant" (
    "id" TEXT NOT NULL,
    "finalRoundId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FinalRoundParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantsToSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Classroom_professeurId_idx" ON "Classroom"("professeurId");

-- CreateIndex
CREATE INDEX "CoursSession_professeurId_idx" ON "CoursSession"("professeurId");

-- CreateIndex
CREATE INDEX "CoursSession_classroomId_idx" ON "CoursSession"("classroomId");

-- CreateIndex
CREATE INDEX "Conversation_initiatorId_idx" ON "Conversation"("initiatorId");

-- CreateIndex
CREATE INDEX "Conversation_receiverId_idx" ON "Conversation"("receiverId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_classroomId_idx" ON "Message"("classroomId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Reaction_messageId_idx" ON "Reaction"("messageId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EtatEleve_eleveId_key" ON "EtatEleve"("eleveId");

-- CreateIndex
CREATE INDEX "EtatEleve_eleveId_idx" ON "EtatEleve"("eleveId");

-- CreateIndex
CREATE INDEX "EtatEleve_metierId_idx" ON "EtatEleve"("metierId");

-- CreateIndex
CREATE UNIQUE INDEX "Metier_nom_key" ON "Metier"("nom");

-- CreateIndex
CREATE INDEX "StudentProgress_studentId_idx" ON "StudentProgress"("studentId");

-- CreateIndex
CREATE INDEX "StudentProgress_taskId_idx" ON "StudentProgress"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgress_studentId_taskId_completionDate_key" ON "StudentProgress"("studentId", "taskId", "completionDate");

-- CreateIndex
CREATE UNIQUE INDEX "ParentFeedback_studentProgressId_key" ON "ParentFeedback"("studentProgressId");

-- CreateIndex
CREATE INDEX "ParentFeedback_studentId_idx" ON "ParentFeedback"("studentId");

-- CreateIndex
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");

-- CreateIndex
CREATE INDEX "Announcement_classeId_idx" ON "Announcement"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_studentId_key" ON "Leaderboard"("studentId");

-- CreateIndex
CREATE INDEX "Leaderboard_studentId_idx" ON "Leaderboard"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_name_key" ON "Achievement"("name");

-- CreateIndex
CREATE INDEX "StudentAchievement_studentId_idx" ON "StudentAchievement"("studentId");

-- CreateIndex
CREATE INDEX "StudentAchievement_achievementId_idx" ON "StudentAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAchievement_studentId_achievementId_key" ON "StudentAchievement"("studentId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalRoundParticipant_finalRoundId_studentId_key" ON "FinalRoundParticipant"("finalRoundId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipantsToSession_AB_unique" ON "_ParticipantsToSession"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipantsToSession_B_index" ON "_ParticipantsToSession"("B");
