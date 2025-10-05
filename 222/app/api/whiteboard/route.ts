// src/app/api/whiteboard/route.ts
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, event, data } = await request.json();

    if (!sessionId || !event || !data) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const channel = `presence-whiteboard-${sessionId}`;
    
    // On ne relaie que l'événement, sans le stocker, pour un tableau blanc éphémère.
    await pusherServer.trigger(channel, event, { ...data, senderId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [Whiteboard API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
