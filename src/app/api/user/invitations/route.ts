import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
    try {
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

        // 2. Query Invitations
        const q = dbAdmin.collection("invitations")
            .where("toEmail", "==", email)
            .where("status", "==", "pending");

        const snap = await q.get();
        const invites = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json({ invites });
    } catch (error: any) {
        console.error('Error fetching user invites:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
