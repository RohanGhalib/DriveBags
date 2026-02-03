import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';

export async function GET(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;

        // 1. Auth Check - anyone who can access the bag can see details?
        // Actually, only Host or Participants should see details.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        // 2. Fetch Bag
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        const bagData = bagDoc.data();

        // 3. Access Check
        const isHost = bagData?.hostUid === uid;
        const isParticipant = bagData?.invitedEmails?.includes(email);
        const isPublic = bagData?.accessType === 'public';

        if (!isHost && !isParticipant && !isPublic) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            id: bagDoc.id,
            ...bagData
        });

    } catch (error: any) {
        console.error('Error fetching bag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
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

        const { name, accessType } = await req.json();

        // 2. Permission Check (Host Only)
        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        if (bagDoc.data()?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Update
        const updates: any = {
            name,
            accessType
        };

        // If changing from something else TO a restricted mode, clear invitedEmails
        // Requirement: "all of the participants have to re join"
        if (['private', 'invite', 'request'].includes(accessType)) {
            updates.invitedEmails = [];
        }

        // If mode is public, we don't necessarily need to clear, but it doesn't hurt.
        // But if we switch TO public, invitedEmails technically becomes irrelevant until we switch back.
        // Let's stick to the requirement: "if the user changes it... then all of the participants have to re join".
        // This implies resetting the whitelist.

        await bagRef.update(updates);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating bag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
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

        // 3. Delete
        // ideally we should also delete subcollections (requests) and invitations linked to this bag.
        // Firestore requires recursive delete. For now, we'll just delete the bag doc.
        // For a hackathon/prototype level, this is okay.
        await bagRef.delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting bag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
