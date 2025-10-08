// src/app/api/session/[id]/timer/route.ts
import { broadcastTimerEvent } from '@/lib/actions';
import { getAuthSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (session?.user?.role !== 'PROFESSEUR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = params.id;
  
  try {
    const { event, time } = await request.json();

    if (!sessionId || !event) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    
    await broadcastTimerEvent(sessionId, event, { time });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [Timer API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
