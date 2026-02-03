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

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 2. Access Check (Only Host can share for now)
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        if (bagDoc.data()?.hostUid !== uid) {
            return NextResponse.json({ error: 'Only the host can invite users' }, { status: 403 });
        }

        // 3. Add to Invited Emails
        await bagRef.update({
            invitedEmails: admin.firestore.FieldValue.arrayUnion(email)
        });

        // Optional: Send Email Invitation? 
        // For prototype, we just add to list.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sharing bag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
