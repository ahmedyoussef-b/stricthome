import type { Prisma, Reaction as PrismaReaction, Message as PrismaMessage, Task, TaskCompletion } from '@prisma/client';

export type UserWithClasse = Prisma.UserGetPayload<{
    include: { classe: true }
}>

export type ClasseWithUsers = Prisma.ClasseGetPayload<{
    include: { eleves: true, professeur: true }
}>

export type StudentWithStateAndCareer = Prisma.UserGetPayload<{
    include: { 
        etat: {
            include: {
                metier: true
            }
        },
        sessionsParticipees: true,
        classe: {
          include: {
            chatroom: true
          }
        },
        taskCompletions: true,
    }
}>

export type ReactionWithUser = Prisma.ReactionGetPayload<{
    include: {
        user: {
            select: { name: true, id: true }
        }
    }
}>;

// Base message type from Prisma
export type MessageWithReactions = Prisma.MessageGetPayload<{
    include: { 
        reactions: {
            include: {
                user: {
                    select: { name: true, id: true }
                }
            }
        } 
    }
}>;

export type TaskWithCompletions = Task & {
    completions: TaskCompletion[];
};
