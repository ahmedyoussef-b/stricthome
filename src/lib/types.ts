import type { Prisma, Reaction as PrismaReaction, Message as PrismaMessage, Task, TaskCompletion, Annonce, Classe, User, Metier, CoursSession } from '@prisma/client';

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
        classe: true,
        taskCompletions: true,
        sessionsParticipees: {
            where: {
                endedAt: null
            }
        }
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
        initiator: { 
            select: { id: true, name: true }
        };
        receiver: { 
            select: { id: true, name: true }
        };
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

export type StudentWithCareer = Pick<User, 'id' | 'name' | 'email'> & {
    etat: {
        metier: Metier | null;
    } | null
}

export type ClasseWithDetails = Omit<Classe, 'professeurId'> & {
  eleves: StudentForCard[];
};

export type CareerWithTheme = Metier & {
  theme: {
    backgroundColor: string;
    textColor: string;
    primaryColor: string;
    accentColor: string;
    cursor: string;
    imageUrl: string;
  }
}
