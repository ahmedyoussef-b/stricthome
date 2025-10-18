// src/app/api/pusher/tldraw/route.ts
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { channelName, eventName, data } = await request.json();

    if (!channelName || !eventName || !data) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Basic security: ensure user is part of the session they are trying to broadcast to.
    // In a real app, you'd check against a DB record of session participants.
    if (!channelName.startsWith(`presence-session-`)) {
        return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
    }

    // Trigger event on the channel
    await pusherServer.trigger(channelName, eventName, data, {
        socket_id: data.socketId, // Exclude the sender
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [Pusher Tldraw API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
