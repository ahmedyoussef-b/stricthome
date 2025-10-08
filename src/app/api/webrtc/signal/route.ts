// src/app/api/webrtc/signal/route.ts
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, toUserId, fromUserId, signal } = await request.json();

    if (!sessionId || !toUserId || !fromUserId || !signal) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    
    // Le signal doit être un objet, nous le transmettons tel quel.
    if (typeof signal !== 'object' || signal === null) {
      console.error('❌ [API] Signal invalide, ce n\'est pas un objet:', signal);
      return NextResponse.json({ error: 'Invalid signal format' }, { status: 400 });
    }

    const channel = `presence-session-${sessionId}`;
    const event = 'webrtc-signal';
    
    // Relayer le signal complet sans le modifier.
    // Le client qui reçoit gérera la logique.
    await pusherServer.trigger(channel, event, {
        fromUserId,
        toUserId,
        signal
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [WebRTC Signal API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
