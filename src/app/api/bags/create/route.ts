import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin } from '@/lib/firebase/admin';
import { decrypt } from '@/lib/crypto';
import { getDriveClient, createDriveFolder } from '@/lib/google/drive';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const { name, accessType, invitedEmails } = await req.json();

        // 1. Get Host's Refresh Token
        const userDoc = await dbAdmin.collection('users').doc(uid).get();
        const userData = userDoc.data();

        if (!userData?.driveRefreshToken) {
            return NextResponse.json({ error: 'Drive not connected' }, { status: 400 });
        }

        const refreshToken = decrypt(userData.driveRefreshToken);

        // 2. Initialize Drive Client
        const drive = getDriveClient(refreshToken);

        // 3. Create Folder in Host's Drive
        // We create a root folder "DriveBags" if it doesn't exist, then the Bag folder inside it?
        // For simplicity, just create in Root.
        const folderId = await createDriveFolder(drive, `Bag: ${name}`);

        // 4. Create Bag in Firestore
        const bagRef = dbAdmin.collection('bags').doc();
        const bagData = {
            bagId: bagRef.id,
            hostUid: uid,
            name,
            googleFolderId: folderId,
            accessType: accessType || 'private', // 'public', 'private', 'request'
            invitedEmails: invitedEmails || [],
            createdAt: new Date().toISOString(),
            size: 0, // Track usage?
        };

        await bagRef.set(bagData);

        return NextResponse.json({ bagId: bagRef.id, folderId });
    } catch (error: any) {
        console.error('Error creating bag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
