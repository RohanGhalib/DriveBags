import { google } from 'googleapis';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
];

/**
 * Get an authenticated Google Drive client using a refresh token.
 * This effectively acts as the user (Host) offline.
 */
export const getDriveClient = (refreshToken: string) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        // Redirect URL isn't strictly needed for refresh token flow on backend but good to have consistent
        process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback/google'
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Basic helper to create a folder in Drive.
 */
export const createDriveFolder = async (drive: any, folderName: string, parentId?: string) => {
    const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
        fileMetadata.parents = [parentId];
    }

    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return file.data.id;
    } catch (err) {
        console.error('Error creating folder:', err);
        throw err;
    }
};
