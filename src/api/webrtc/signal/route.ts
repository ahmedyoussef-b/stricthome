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
    const { sessionId, signalData } = await request.json();

    if (!sessionId || !signalData) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Le canal de signalisation est un canal privé pour la session.
    const channel = `private-webrtc-session-${sessionId}`;
    const event = 'signal';
    
    // Diffuser le signal à tous les clients du canal, sauf à l'expéditeur.
    // L'expéditeur est identifié par le socket_id qui est automatiquement géré par Pusher.
    // On inclut l'ID de l'expéditeur dans les données pour que le client puisse l'ignorer.
    await pusherServer.trigger(channel, event, signalData, {
        socket_id: signalData.from, // Le `from` est le socket_id du client qui envoie
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [WebRTC Signal API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
