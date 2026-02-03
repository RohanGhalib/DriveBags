import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { decrypt } from '@/lib/crypto';
import { getDriveClient } from '@/lib/google/drive';
import { Readable } from 'stream';

// Helper to check if user is authenticated
// ... (omitted)

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Guest or Host)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Parse Query Params
        const searchParams = req.nextUrl.searchParams;
        const bagId = searchParams.get('bagId');
        const filename = searchParams.get('filename');
        const mimeType = searchParams.get('mimeType');

        if (!bagId || !filename) {
            return NextResponse.json({ error: 'Missing bagId or filename' }, { status: 400 });
        }

        // 3. Get Bag Metadata
        const bagDoc = await dbAdmin.collection('bags').doc(bagId).get();
        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }
        const bagData = bagDoc.data();

        // 4. Permission Check
        // If Host, allow. If Guest, check access (simplified for prototype: check if in invitedEmails or public)
        const isHost = bagData?.hostUid === uid;
        const isInvited = bagData?.invitedEmails?.includes(decodedToken.email);
        const isPublic = bagData?.accessType === 'public';

        if (!isHost && !isInvited && !isPublic) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 5. Get Host's Refresh Token (Always upload as Host)
        const hostUserDoc = await dbAdmin.collection('users').doc(bagData?.hostUid).get();
        const hostData = hostUserDoc.data();

        if (!hostData?.driveRefreshToken) {
            return NextResponse.json({ error: 'Host Drive disconnected' }, { status: 400 });
        }

        const refreshToken = decrypt(hostData.driveRefreshToken);
        const drive = getDriveClient(refreshToken);

        // 6. Stream Upload to Google Drive
        // We assume the body IS the file content (Raw Binary implementation for simplicity & speed)
        // Client must send: fetch('/api/upload...', { method: 'POST', body: fileObject })
        const bodyStream = req.body;

        if (!bodyStream) {
            return NextResponse.json({ error: 'No file body' }, { status: 400 });
        }

        // Convert Web Stream to Node Stream for Google API
        // @ts-ignore - Readable.fromWeb is available in Node 18+ (Next.js 15+)
        const nodeStream = Readable.fromWeb(bodyStream);

        const driveResponse = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [bagData?.googleFolderId],
                mimeType: mimeType || 'application/octet-stream',
            },
            media: {
                mimeType: mimeType || 'application/octet-stream',
                body: nodeStream,
            },
            fields: 'id, name, size, webViewLink',
        });

        return NextResponse.json({
            success: true,
            fileId: driveResponse.data.id,
            webViewLink: driveResponse.data.webViewLink
        });

    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
