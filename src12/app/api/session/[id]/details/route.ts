// src/app/api/session/[id]/details/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = params.id;

  try {
    const coursSession = await prisma.coursSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: { select: { id: true } }, // Select only IDs for security check
        professeur: true,
        classe: {
            include: {
                eleves: {
                     select: {
                        id: true,
                        name: true,
                        email: true,
                        etat: {
                            select: {
                                metier: true
                            }
                        }
                    },
                    orderBy: { name: 'asc' }
                }
            }
        }
      },
    });

    if (!coursSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Security check: only participants or the teacher can get details
    const isParticipant = coursSession.participants.some(p => p.id === session.user.id);
    
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // The class and its students are now included in the initial query
    const studentsInClass = coursSession.classe?.eleves || [];

    return NextResponse.json({ 
        session: coursSession, 
        students: studentsInClass,
        teacher: coursSession.professeur,
    });
  } catch (error) {
    console.error(`[API] Error fetching session details for ${sessionId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
