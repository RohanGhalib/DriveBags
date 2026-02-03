import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/drive/callback'
    );

    const scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial for refresh_token
        scope: scopes,
        prompt: 'consent' // Force consent to ensure we get a refresh_token
    });

    return NextResponse.redirect(url);
}
