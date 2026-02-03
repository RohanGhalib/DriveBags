import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { encrypt } from '@/lib/crypto';
import { getDriveClient } from '@/lib/google/drive';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { code } = await req.json();

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/drive/callback'
        );

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            // If the user has already authorized, we might not get a refresh token unless we forced prompt='consent'.
            // The /api/auth/drive route should enforce this.
            return NextResponse.json({ error: 'No refresh token returned. Revoke access and try again.' }, { status: 400 });
        }

        // Encrypt and store
        const encryptedToken = encrypt(tokens.refresh_token);

        await dbAdmin.collection('users').doc(uid).set({
            driveRefreshToken: encryptedToken,
            driveConnectedAt: new Date().toISOString(),
            email: decodedToken.email
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error connecting drive:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
