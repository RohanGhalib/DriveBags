import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { createNotification } from '@/lib/notifications';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { inviteId, decision } = await req.json();

        if (!['accept', 'reject'].includes(decision)) {
            return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
        }

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const email = decodedToken.email;

        // 2. Get Invite
        const inviteRef = dbAdmin.collection('invitations').doc(inviteId);
        const inviteDoc = await inviteRef.get();

        if (!inviteDoc.exists) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        const inviteData = inviteDoc.data();

        // Check if this invite is for this user
        if (inviteData?.toEmail !== email) {
            return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
        }

        if (inviteData?.status !== 'pending') {
            return NextResponse.json({ error: 'Invitation already processed' }, { status: 400 });
        }

        // 3. Process Decision
        if (decision === 'accept') {
            // Add email to bag's invitedEmails
            await dbAdmin.collection('bags').doc(inviteData?.bagId).update({
                invitedEmails: admin.firestore.FieldValue.arrayUnion(email)
            });
            await inviteRef.update({ status: 'accepted' });

            // Notify Host
            if (inviteData?.hostUid) {
                await createNotification(
                    inviteData.hostUid,
                    'invite_accepted',
                    `${email} joined ${inviteData.bagName || 'your bag'}`,
                    {
                        bagId: inviteData.bagId,
                        bagName: inviteData.bagName,
                        triggeredByUid: decodedToken.uid,
                        triggeredByEmail: email
                    }
                );
            }
        } else {
            await inviteRef.update({ status: 'rejected' });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error responding to invite:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
