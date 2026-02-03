import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';

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

        // 2. Permission Check (Host Only)
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        const bagData = bagDoc.data();
        if (bagData?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Query Invites
        const q = dbAdmin.collection("invitations")
            .where("bagId", "==", bagId)
            .where("status", "==", "pending");

        const snap = await q.get();
        const invites = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json({ invites });
    } catch (error: any) {
        console.error('Error fetching bag invites:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
