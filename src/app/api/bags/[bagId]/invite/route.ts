import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';

export async function POST(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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
        // Only host can invite? For now yes.
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        const bagData = bagDoc.data();
        if (bagData?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Create Invitation
        // Check if already invited? 
        if (bagData?.invitedEmails?.includes(email)) {
            return NextResponse.json({ error: 'User already has access' }, { status: 400 });
        }

        // Create invitation doc
        await dbAdmin.collection('invitations').add({
            bagId,
            bagName: bagData?.name,
            hostUid: uid,
            toEmail: email,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
