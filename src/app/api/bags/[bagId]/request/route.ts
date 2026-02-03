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
        const email = decodedToken.email;

        // 2. Add to Requests List
        // We'll store requests in a subcollection or just an array on the bag?
        // Array is easier for prototype: `accessRequests`: [{ uid, email, timestamp }]
        // But Firestore arrayUnion with objects only works if object is exact match.
        // Let's use a subcollection `requests`.

        // Actually, user just wants "sends a request".
        // Let's us `accessRequests` array of emails for simplicity, similar to invitedEmails.
        // If we need timestamps, subcollection is better.
        // Let's go with subcollection 'requests' for scalability as requested in prompt "Scalability".

        const requestRef = dbAdmin.collection('bags').doc(bagId).collection('requests').doc(uid);

        await requestRef.set({
            uid,
            email,
            createdAt: new Date().toISOString(),
            status: 'pending' // pending, approved, denied
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error requesting access:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
