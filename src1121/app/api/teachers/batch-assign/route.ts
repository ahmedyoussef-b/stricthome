// src/app/api/teachers/batch-assign/route.ts
// NOTE: This functionality for assigning supervisors has been deprecated and removed.
// The supervision logic has been removed from the Prisma schema and the rest of the application.
// This file is kept to avoid breaking the build but no longer performs any action.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Return a success response indicating no operation was performed.
  return NextResponse.json({ message: "La fonctionnalité d'assignation de superviseur est obsolète et n'est plus active." }, { status: 200 });
}
