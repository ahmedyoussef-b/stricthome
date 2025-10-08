// src/app/api/session/[id]/whiteboard-control/route.ts
import { serverSetWhiteboardController } from '@/lib/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  try {
    const { participantId } = await request.json();
     if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    // participantId can be null to give control back to teacher
    await serverSetWhiteboardController(sessionId, participantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('💥 [Whiteboard Control API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
