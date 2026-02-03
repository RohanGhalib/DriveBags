import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { decrypt } from '@/lib/crypto';
import { getDriveClient } from '@/lib/google/drive';

export async function GET(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Get Bag Info
        const bagDoc = await dbAdmin.collection('bags').doc(bagId).get();
        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }
        const bagData = bagDoc.data();

        // Check Access
        const isHost = bagData?.hostUid === uid;
        const isInvited = bagData?.invitedEmails?.includes(decodedToken.email);
        const isPublic = bagData?.accessType === 'public';

        console.log(`[Files Access Check] Bag: ${bagId}`);
        console.log(`- Request User: ${decodedToken.email} (${uid})`);
        console.log(`- Host: ${bagData?.hostUid}`);
        console.log(`- Access Type: ${bagData?.accessType}`);
        console.log(`- Invited: ${JSON.stringify(bagData?.invitedEmails)}`);
        console.log(`- Result: Host=${isHost}, Invited=${isInvited}, Public=${isPublic}`);

        if (!isHost && !isInvited && !isPublic) {
            return NextResponse.json({
                error: 'Forbidden',
                debug: {
                    userEmail: decodedToken.email,
                    isHost,
                    isInvited,
                    isPublic
                }
            }, { status: 403 });
        }

        // 3. Get Drive Client (Host credentials)
        const hostUserDoc = await dbAdmin.collection('users').doc(bagData?.hostUid).get();
        const hostData = hostUserDoc.data();

        if (!hostData?.driveRefreshToken) {
            return NextResponse.json({ error: 'Host Drive disconnected' }, { status: 400 });
        }

        const refreshToken = decrypt(hostData.driveRefreshToken);
        const drive = getDriveClient(refreshToken);

        // 4. List Files from Drive Folder
        const q = `'${bagData?.googleFolderId}' in parents and trashed = false`;
        const listRes = await drive.files.list({
            q,
            fields: 'files(id, name, mimeType, iconLink, webViewLink, size)',
            orderBy: 'folder, modifiedTime desc',
            pageSize: 100,
        });

        return NextResponse.json({ files: listRes.data.files });
    } catch (error: any) {
        console.error('Error listing files:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
