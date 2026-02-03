import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { createNotification } from '@/lib/notifications';
import * as admin from 'firebase-admin';

export async function DELETE(req: NextRequest, props: { params: Promise<{ bagId: string }> }) {
    try {
        const params = await props.params;
        const { bagId } = params;
        const { email } = await req.json(); // Email to kick

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        // 1. Auth Check (Host Only)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const bagRef = dbAdmin.collection('bags').doc(bagId);
        const bagDoc = await bagRef.get();

        if (!bagDoc.exists) {
            return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
        }

        // Only host can kick
        if (bagDoc.data()?.hostUid !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Remove from invitedEmails array
        await bagRef.update({
            invitedEmails: admin.firestore.FieldValue.arrayRemove(email)
        });

        // 3. Mark any invitiations as 'revoked' (optional but good for history)
        // We can just query for pending/accepted invites for this email and bag and delete or update them.
        const invitesSnapshot = await dbAdmin.collection('invitations')
            .where('bagId', '==', bagId)
            .where('toEmail', '==', email)
            .get();

        const batch = dbAdmin.batch();
        invitesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref); // Or update status to 'kicked'
        });
        await batch.commit();

        // Notify Kicked User
        try {
            const userRecord = await authAdmin.getUserByEmail(email);
            if (userRecord) {
                await createNotification(
                    userRecord.uid,
                    'kicked',
                    `You have been removed from ${bagDoc.data()?.name || 'a bag'}`,
                    {
                        bagId,
                        bagName: bagDoc.data()?.name,
                        triggeredByUid: uid,
                        triggeredByEmail: decodedToken.email
                    }
                );
            }
        } catch (e) {
            // User might not exist or error
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error kicking participant:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
