import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
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

        const { requestId, decision } = await req.json(); // requestId is the User UID of requester

        if (!requestId || !['approve', 'deny'].includes(decision)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // 2. Permission Check (Host Only)
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        if (bagDoc.data()?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Process Decision
        const requestRef = bagRef.collection('requests').doc(requestId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const requestData = requestDoc.data();

        if (decision === 'approve') {
            // Add to invitedEmails
            await bagRef.update({
                invitedEmails: admin.firestore.FieldValue.arrayUnion(requestData?.email)
            });
            await requestRef.update({ status: 'approved' });
        } else {
            await requestRef.update({ status: 'denied' });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
