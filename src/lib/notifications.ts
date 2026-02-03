import { dbAdmin } from './firebase/admin';
import * as admin from 'firebase-admin';

export type NotificationType =
    | 'invite_received'
    | 'invite_accepted'
    | 'request_received'
    | 'request_approved'
    | 'kicked';

export async function createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    metadata: Record<string, any>
) {
    try {
        await dbAdmin.collection('notifications').add({
            userId,
            type,
            message, // Human readable fallback
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // We don't throw here to avoid failing the main action just because notification failed
    }
}
