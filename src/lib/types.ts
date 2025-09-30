import type { Prisma, Reaction as PrismaReaction, Message as PrismaMessage, Task, TaskCompletion, Annonce, Classe, User } from '@prisma/client';

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
        classe: true,
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

export type FullConversation = Prisma.ConversationGetPayload<{
    include: {
        messages: {
            orderBy: {
                createdAt: 'asc'
            }
        };
        initiator: Pick<User, 'id' | 'name'>;
        receiver: Pick<User, 'id' | 'name'>;
    }
}>

export type AnnouncementWithAuthor = Annonce & {
    author: {
        name: string | null;
    }
};

export type StudentForCard = Pick<User, 'id' | 'name' | 'email'> & {
  etat: {
    isPunished: boolean;
  } | null;
};

export type ClasseWithDetails = Classe & {
  eleves: StudentForCard[];
};
