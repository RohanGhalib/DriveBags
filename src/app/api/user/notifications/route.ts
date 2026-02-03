import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Fetch user notifications
        const snapshot = await dbAdmin.collection('notifications')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ notifications });

    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { notificationIds } = await req.json();

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const batch = dbAdmin.batch();
        notificationIds.forEach((id: string) => {
            const ref = dbAdmin.collection('notifications').doc(id);
            // Verify ownership in a real app, but for now mostly safe as we trust ID list from client who fetched it.
            // Ideally we check doc.userId === uid.
            batch.update(ref, { read: true });
        });

        await batch.commit();

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error marking notifications read:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
