# DriveBags Project Documentation

**Application Name:** DriveBags
**Description:** A Google Drive-backed file sharing application with granular access controls (Private, Public, Invite Only, Request). Authenticated users can host "Bags" (folders) and share them with others.

## Tech Stack
*   **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Lucide Icons.
*   **Backend**: Next.js API Routes (Serverless functions).
*   **Database**: Firebase Firestore.
*   **Authentication**: Firebase Auth (Google Sign-In).
*   **Storage**: Google Drive API (via Service Account & Host Delegation).

## Core Concepts

### 1. Access Modes
Each Bag has an `accessType` determining who can view it:
*   **Private**: Only the Host can access.
*   **Public**: Anyone with the link can access.
*   **Invite Only**: Users must be explicitly invited by the Host via email.
*   **Request Access**: Users can request access; Host must approve.

### 2. User Roles
*   **Host**: The creator of the Bag. Has full control (Edit, Delete, Manage Access).
*   **Guest**: An invited or approved user. Can view and download files.

## Database Schema (Firestore)

### Collection: `users`
*   `uid` (Document ID): User's Firebase UID.
*   `email`: User's email.
*   `displayName`: User's name.
*   `photoURL`: Profile picture.
*   `driveConnectedAt`: Timestamp if they have connected Google Drive.
*   `driveRefreshToken`: Encrypted refresh token for Drive access.

### Collection: `bags`
*   `name`: Display name of the bag.
*   `hostUid`: UID of the creator.
*   `googleFolderId`: ID of the backing Google Drive folder.
*   `accessType`: `'private' | 'public' | 'invite' | 'request'`.
*   `invitedEmails`: Array[String] - Whitelist of emails allowed to access.
*   `createdAt`: Timestamp.

#### Subcollection: `bags/{bagId}/requests`
*   `uid` (Document ID): Requester's UID.
*   `email`: Requester's email.
*   `createdAt`: Timestamp.
*   `status`: `'pending' | 'approved' | 'denied'`.

### Collection: `invitations`
*   `bagId`: ID of the bag.
*   `bagName`: Name of the bag.
*   `hostUid`: Sender's UID.
*   `toEmail`: Recipient's email.
*   `status`: `'pending' | 'accepted' | 'rejected'`.
*   `createdAt`: Timestamp.

## Application Structure

### Pages (Frontend)
*   **`/`**: Landing Page / Login.
*   **`/dashboard`**: Main User Hub.
    *   **My Bags**: List of bags hosted by user.
    *   **Joined Bags**: List of bags user has access to.
    *   **Inbox**: Pending invitations (Accept/Reject).
    *   **Pending Approval**: Status of outbound access requests.
*   **`/bag/[bagId]`**: Bag View.
    *   **Header**: Navigation, Settings (Host), Share, Leave Bag (Guest).
    *   **Content**: File list fetched from Google Drive.
    *   **Access Denied**: Shown if user lacks permission (with "Request Access" button if applicable).

### API Endpoints (Backend)

#### Authentication (`/api/auth`)
*   **`GET /api/auth/drive`**: Initiates Google OAuth flow to connect Drive.
*   **`POST /api/auth/drive/exchange`**: Exchanges Auth Code for Refresh Token.

#### Bags (`/api/bags`)
*   **`POST /api/bags/create`**: Creates a new Bag + Drive Folder.
*   **`PUT /api/bags/[bagId]`**: Updates Bag metadata (Name, Access Mode). Clears `invitedEmails` if switching to restricted mode.
*   **`DELETE /api/bags/[bagId]`**: Deletes a Bag.
*   **`GET /api/bags/[bagId]/files`**: Lists files in the bag.
    *   *Logic*: Checks DB permissions. Uses Host's Refresh Token to allow Guests to view files without their own Drive access.
    *   *Returns*: File list + Metadata (`isHost`, `accessType`).

#### Access Control (`/api/bags/[bagId]`)
*   **`POST .../invite`**: Sends an invitation to an email.
*   **`POST .../request`**: Submits an access request for the current user.
*   **`POST .../leave`**: Removes the current user from `invitedEmails`.
*   **`GET .../requests`**: Lists pending requests (Host only).
*   **`POST .../requests/decision`**: Approves/Denies a request.

#### User Data (`/api/user`)
*   **`GET /api/user/invitations`**: Fetches pending invitations for current user.
*   **`GET /api/user/requests`**: Fetches pending outbound requests for current user.
*   **`POST /api/invitations/respond`**: Accepts or Rejects an invitation.

## Key Logic Flows

1.  **Connecting Drive**: User authorizes App -> App stores Refresh Token in `users/{uid}`.
2.  **Creating Bag**: App uses User's Token to create Folder in Drive -> Stores ID in Firestore.
3.  **Viewing Bag**: 
    1.  API checks Firestore permissions (`hostUid` match, `invitedEmails` include, or `public`).
    2.  API retrieves Host's Refresh Token from `users` collection.
    3.  API uses Token to list Drive files on behalf of Host.
    4.  Frontend displays files.
