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
        const email = decodedToken.email;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        // 2. Remove from invitedEmails
        const bagRef = dbAdmin.collection('bags').doc(bagId);

        await bagRef.update({
            invitedEmails: admin.firestore.FieldValue.arrayRemove(email)
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error leaving bag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
