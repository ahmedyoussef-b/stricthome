
import type { Prisma, Reaction as PrismaReaction, Message as PrismaMessage, Task, StudentProgress, Announcement as PrismaAnnouncement, Classroom, User, Metier, CoursSession, Leaderboard } from '@prisma/client';

export type UserWithClassroom = Prisma.UserGetPayload<{
    include: { classroom: true }
}>

export type ClassroomWithUsers = Prisma.ClassroomGetPayload<{
    include: { eleves: true, professeur: true }
}>

export type StudentWithStateAndCareer = Prisma.UserGetPayload<{
    include: { 
        etat: {
            include: {
                metier: true
            }
        },
        classroom: true,
        progress: true,
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

export type TaskWithProgress = Task & {
    progress: StudentProgress[];
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

export type AnnouncementWithAuthor = PrismaAnnouncement & {
    author: {
        name: string | null;
    }
};

export type StudentForCard = Pick<User, 'id' | 'name' | 'email' | 'points'> & {
  etat: {
    isPunished: boolean;
  } | null;
};

export type StudentWithCareer = Pick<User, 'id' | 'name' | 'email'> & {
    etat: {
        metier: Metier | null;
    } | null
}

export type ClasseWithDetails = Omit<Classroom, 'professeurId'> & {
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

export type CoursSessionWithRelations = CoursSession & {
    participants: User[];
    professeur: User;
    classroom: Classroom | null;
};

// Competition System Types
export type { Task, StudentProgress, Leaderboard } from '@prisma/client';
