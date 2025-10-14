// src/app/api/auth/logout/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export async function POST(req: NextRequest) {
    console.log("--- 🚀 API: Firebase Logout ---");

    try {
        const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

        // Invalidate the cookie by setting it on the response with an expiration date in the past
        console.log("🍪 [API/logout] Invalidating session cookie.");
        response.cookies.set(SESSION_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: -1, // Expire immediately
            path: '/',
        });

        return response;

    } catch (error) {
        console.error("❌ [API/logout] Logout API Error:", error);
        return NextResponse.json({ message: 'Internal server error during logout.' }, { status: 500 });
    }
}
