// src/app/api/pusher/timer/route.ts
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (session?.user.role !== 'PROFESSEUR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, event, data } = await request.json();

    if (!sessionId || !event) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    
    const coursSession = await prisma.coursSession.findFirst({
        where: { id: sessionId, professeurId: session.user.id }
    });

    if (!coursSession) {
        return NextResponse.json({ error: 'Session not found or you are not the host.' }, { status: 403 });
    }

    const channel = `presence-session-${sessionId}`;
    
    await pusherServer.trigger(channel, event, data || {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [Timer API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
