// src/app/api/session/[id]/spotlight/route.ts
import { serverSpotlightParticipant } from '@/lib/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  try {
    const { participantId } = await request.json();
    if (!sessionId || participantId === undefined) { // participantId can be null
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    await serverSpotlightParticipant(sessionId, participantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`💥 [Spotlight API] Error for session ${sessionId}:`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
