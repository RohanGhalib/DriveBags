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
        const uid = decodedToken.uid;

        // 2. Collection Group Query
        // Find all docs in "requests" subcollection where uid == current user
        // Note: keeping status inside the request doc is key here.
        const requestsQuery = dbAdmin.collectionGroup('requests')
            .where('uid', '==', uid)
            .where('status', '==', 'pending');

        const requestsSnap = await requestsQuery.get();

        const requests = [];

        // 3. Enrich with Bag Name
        // The parent of the request doc is accessRequests collection, parent of that is the Bag doc.
        // We need to fetch bag names.
        // TODO: Optimize this with Promise.all
        for (const doc of requestsSnap.docs) {
            const bagRef = doc.ref.parent.parent;
            if (bagRef) {
                const bagDoc = await bagRef.get();
                if (bagDoc.exists) {
                    requests.push({
                        bagId: bagRef.id,
                        bagName: bagDoc.data()?.name || 'Unknown Bag',
                        requestedAt: doc.data().createdAt
                    });
                }
            }
        }

        return NextResponse.json({ requests });
    } catch (error: any) {
        console.error('Error fetching user requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
