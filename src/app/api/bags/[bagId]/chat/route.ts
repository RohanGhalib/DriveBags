
import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { decrypt } from '@/lib/crypto';
import { getDriveClient } from '@/lib/google/drive';
import { FieldValue } from 'firebase-admin/firestore';

// Helper to get Bag and verify access
async function getBagAndVerify(bagId: string, req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const bagRef = dbAdmin.collection('bags').doc(bagId);
    const bagDoc = await bagRef.get();

    if (!bagDoc.exists) throw new Error('Bag not found');
    const bagData = bagDoc.data();

    const isHost = bagData?.hostUid === uid;
    const isInvited = bagData?.invitedEmails?.includes(email);
    const isPublic = bagData?.accessType === 'public';

    if (!isHost && !isInvited && !isPublic) throw new Error('Forbidden');

    return { bagData, uid, email, isHost };
}

export async function GET(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;
        const { bagData } = await getBagAndVerify(bagId, req);

        // 1. Fetch Request from Firestore (Recent/Realtime Cache)
        const messagesRef = dbAdmin.collection('bags').doc(bagId).collection('messages');
        const snapshot = await messagesRef.orderBy('createdAt', 'asc').limitToLast(50).get();
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // NOTE: For full history, we would fetch _chat_history.json from Drive if needed.
        // For MVP/smoothness, we just show recent 50 messages from Firestore which acts as the buffer.
        // The Sync process (separate) ensures long-term storage in Drive.

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error('Chat GET Error:', error);
        const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function POST(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;
        const { bagData, uid, email } = await getBagAndVerify(bagId, req);
        const { text } = await req.json();

        if (!text || !text.trim()) return NextResponse.json({ error: 'Message empty' }, { status: 400 });

        // 1. Add Message to Firestore
        const messageData = {
            text,
            uid,
            email,
            createdAt: new Date().toISOString(),
            // Optional: User display name if we had it easily
        };

        const docRef = await dbAdmin.collection('bags').doc(bagId).collection('messages').add(messageData);

        // 2. Trigger Sync to Drive (Optional: debounced or immediate)
        // For simplicity, we just write to Firestore. A dedicated endpoint or background trigger 
        // should handle the aggregation to JSON to avoid slowing down every message send.

        return NextResponse.json({ success: true, id: docRef.id, ...messageData });
    } catch (error: any) {
        console.error('Chat POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
