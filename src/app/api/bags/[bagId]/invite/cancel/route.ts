import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';

export async function POST(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;
        const { inviteId } = await req.json();

        if (!inviteId) {
            return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
        }

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Permission Check (Host Only)
        // Only host can cancel invites they sent.
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        const bagData = bagDoc.data();
        if (bagData?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Delete Invitation
        // Verify invite belongs to this bag
        const inviteRef = dbAdmin.collection('invitations').doc(inviteId);
        const inviteDoc = await inviteRef.get();

        if (!inviteDoc.exists) {
            return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
        }

        if (inviteDoc.data()?.bagId !== bagId) {
            return NextResponse.json({ error: 'Invite mismatch' }, { status: 400 });
        }

        await inviteRef.delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error cancelling invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
