// app/api/pusher/auth/route.ts
import { pusherServer } from '@/lib/pusher/server';
import { getAuthSession } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!channelName.startsWith('presence-chatroom-')) {
      return new Response(JSON.stringify({ error: 'Invalid channel type' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userData = {
      user_id: session.user.id,
      user_info: {
        name: session.user.name || 'Utilisateur',
        email: session.user.email || 'user@example.com',
      },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, userData);
    
    return new Response(JSON.stringify(authResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 [Pusher Auth] Internal Server Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
