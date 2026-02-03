import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { encrypt } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Verify user is logged in via session cookie or check auth header if this were a direct API call
    // For this callback flows, usually we rely on a state param or a cookie set before redirect.
    // For this prototype, we'll assume the user has a Firebase ID token in a cookie named 'token'
    // or we can't easily associate without it. 
    // ALTERNATIVE: The user does this flow on the client, and we pass the code to an API endpoint ourselves.
    // BUT: The callback comes from Google.

    // SIMPLER PROTOYPE FLOW:
    // 1. User is on Dashboard.
    // 2. Click "Connect Drive" -> Opens Popup or Redirects to /api/auth/drive?uid=USER_ID (Unsafe? No, verify token)
    // Let's rely on a temporary cookie set by the client before calling this route, or handle code exchange on client (unsafe for secret).

    // Let's try to parse the 'uid' from a cookie or state.
    // For the generated boilerplate, I will assume a cookie 'mock-auth-uid' or similar for simplicity, 
    // OR better: The user should manually post the code to a separate endpoint if we want to be strict.
    // BUT, to keep it standard:
    // We will assume the user has a session. If not, we fail.

    // FIXME: Robust auth here is complex. I'll implement a simple code exchange that returns the success status, 
    // and the CLIENT is responsible for sending that code to a POST endpoint with their AUTH TOKEN.
    // This avoids the callback needing access to the user's session directly if it's strictly same-site.

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Redirect to Dashboard with code so client can handle the exchange with their session token
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?google_drive_code=${code}`);
}
