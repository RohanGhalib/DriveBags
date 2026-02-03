
import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { decrypt } from '@/lib/crypto';
import { getDriveClient } from '@/lib/google/drive';

export async function POST(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;

        // 1. Auth Check (Must be Host or authorized trigger)
        // For now, let's allow any participant to trigger a sync if they notice it's stale, 
        // OR restricts to Host. Let's stick to standard auth for now.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        await authAdmin.verifyIdToken(token); // Verify validity

        // 2. Get Bag & Host Credentials
        const bagDoc = await dbAdmin.collection('bags').doc(bagId).get();
        if (!bagDoc.exists) return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        const bagData = bagDoc.data();

        const hostUserDoc = await dbAdmin.collection('users').doc(bagData?.hostUid).get();
        const hostData = hostUserDoc.data();

        if (!hostData?.driveRefreshToken) {
            return NextResponse.json({ error: 'Host Drive disconnected' }, { status: 400 });
        }

        const refreshToken = decrypt(hostData.driveRefreshToken);
        const drive = getDriveClient(refreshToken);

        // 3. Fetch All Messages from Firestore
        const msgsRef = dbAdmin.collection('bags').doc(bagId).collection('messages');
        const snapshot = await msgsRef.orderBy('createdAt', 'asc').get();

        if (snapshot.empty) return NextResponse.json({ success: true, count: 0 });

        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 4. Update/Create _chat_history.json in Drive
        // a. Check if file exists
        const q = `'${bagData?.googleFolderId}' in parents and name = '_chat_history.json' and trashed = false`;
        const listRes = await drive.files.list({ q });

        let fileId = listRes.data.files?.[0]?.id;

        // b. Create content string
        const fileContent = JSON.stringify(messages, null, 2);

        if (fileId) {
            // Update
            await drive.files.update({
                fileId,
                media: { mimeType: 'application/json', body: fileContent }
            });
        } else {
            // Create
            await drive.files.create({
                requestBody: {
                    name: '_chat_history.json',
                    parents: [bagData?.googleFolderId]
                },
                media: { mimeType: 'application/json', body: fileContent }
            });
        }

        return NextResponse.json({ success: true, count: messages.length });

    } catch (error: any) {
        console.error('Chat Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
