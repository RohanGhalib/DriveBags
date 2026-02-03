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

        if (bagDoc.data()?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Fetch Requests
        const requestsSnap = await bagRef.collection('requests').where('status', '==', 'pending').get();
        const requests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ requests });

    } catch (error: any) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
