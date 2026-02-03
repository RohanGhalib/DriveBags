# DriveBags Project Documentation

**Application Name:** DriveBags  
**Description:** A collaborative file-sharing platform with Google Drive backend, real-time chat, and granular access controls. Users create "Bags" (Drive folders) and share them with customizable permissions.

**Current Version:** 1.0.0  
**Status:** Production Ready

---

## Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Framer Motion
*   **Backend**: Next.js API Routes (Serverless functions)
*   **Database**: Firebase Firestore
*   **Authentication**: Firebase Auth (Google Sign-In with Drive scope)
*   **Storage**: Google Drive API
*   **Animations**: Framer Motion

---

## Core Features

### 1. Access Control Modes
Each Bag has an `accessType` determining who can view it:
*   **Private**: Only the Host can access
*   **Public**: Anyone with the link can access
*   **Invite Only**: Users must be explicitly invited by the Host via email
*   **Request Access**: Users can request access; Host must approve

### 2. User Roles
*   **Host**: The creator of the Bag. Full control (manage access, delete, kick participants)
*   **Guest**: An invited or approved user. Can view/download files, participate in chat

### 3. Chat System
*   **Real-time Messaging**: Firestore-powered chat with 3-second polling
*   **Drive Persistence**: Messages sync to hidden `_chat_history.json` file in bag's Drive folder
*   **UI**: Split view (desktop), swipeable tabs (mobile)

### 4. Notifications
*   Real-time alerts for invites, requests, approvals, and kicks
*   Navbar bell icon with unread badge
*   Dropdown panel to view and mark as read

---

## Database Schema (Firestore)

### Collection: `users`
```typescript
{
  uid: string;              // Document ID (Firebase UID)
  email: string;
  displayName?: string;
  photoURL?: string;
  driveConnectedAt: string; // ISO timestamp
  driveRefreshToken: string; // Encrypted refresh token
}
```

### Collection: `bags`
```typescript
{
  name: string;
  hostUid: string;
  googleFolderId: string;   // Google Drive folder ID
  accessType: 'private' | 'public' | 'invite' | 'request';
  invitedEmails: string[];  // Whitelist of allowed emails
  createdAt: string;        // ISO timestamp
}
```

#### Subcollection: `bags/{bagId}/requests`
```typescript
{
  uid: string;              // Document ID (requester's UID)
  email: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'denied';
}
```

#### Subcollection: `bags/{bagId}/messages`
```typescript
{
  id: string;               // Auto-generated
  text: string;
  uid: string;
  email: string;
  createdAt: string;        // ISO timestamp
}
```

### Collection: `invitations`
```typescript
{
  bagId: string;
  bagName: string;
  senderUid: string;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
```

### Collection: `notifications`
```typescript
{
  userId: string;
  type: 'invite_received' | 'invite_accepted' | 'request_received' 
        | 'request_approved' | 'kicked';
  message: string;
  read: boolean;
  createdAt: string;
  metadata: {
    bagId: string;
    bagName: string;
    triggeredByUid: string;
    triggeredByEmail: string;
  };
}
```

---

## Application Structure

### Pages (Frontend)

*   **`/`**: Landing Page with Google Sign-In
*   **`/dashboard`**: Unified Dashboard
    *   Grid layout with filters (All Bags, Created by Me, Shared with Me)
    *   "Create Bag" modal
    *   Pending invitations section
    *   Pending requests section
*   **`/bag/[bagId]`**: Bag View
    *   **Desktop**: Split view (Files list | Chat panel)
    *   **Mobile**: Swipeable tabs (Files ↔ Chat)
    *   File upload (drag-drop + file picker)
    *   "Manage Access" panel (host) or "Participants" view (guest)

### Components

*   **`Navbar.tsx`**: Global navigation with notification bell
*   **`ManageAccessPanel.tsx`**: Slide-over panel for access control
    *   Change access type
    *   Invite users by email
    *   View/cancel pending invites
    *   View participants
    *   Kick participants (host only)
    *   Delete bag (host only, danger zone)
*   **`BagChat.tsx`**: Real-time chat interface with polling
*   **`NotificationsPanel.tsx`**: Dropdown for viewing notifications
*   **`UploadManager.tsx`**: Context provider for file uploads

---

## API Endpoints

### Authentication (`/api/auth`)
*   **`GET /api/auth/drive`**: Initiates Google OAuth flow with Drive scope
*   **`GET /api/auth/drive/callback`**: Handles OAuth callback, redirects to dashboard
*   **`POST /api/auth/drive/exchange`**: Exchanges auth code for refresh token

### Bags (`/api/bags`)
*   **`POST /api/bags/create`**: Creates new bag + Drive folder
*   **`GET /api/bags/[bagId]`**: Fetches bag metadata
*   **`PUT /api/bags/[bagId]`**: Updates bag (name, access type)
*   **`DELETE /api/bags/[bagId]`**: Deletes bag (host only)
*   **`GET /api/bags/[bagId]/files`**: Lists files (filters out system files)

### Access Control (`/api/bags/[bagId]`)
*   **`POST .../invite`**: Sends invitation to email
*   **`POST .../request`**: Submits access request
*   **`POST .../leave`**: Removes user from bag
*   **`DELETE .../participant`**: Kicks participant (host only)
*   **`GET .../requests`**: Lists pending requests (host only)
*   **`POST .../requests/decision`**: Approves/denies request

### Chat (`/api/bags/[bagId]/chat`)
*   **`GET .../chat`**: Fetches recent messages from Firestore
*   **`POST .../chat`**: Sends new message
*   **`POST .../chat/sync`**: Syncs Firestore messages to Drive JSON

### User Data (`/api/user`)
*   **`GET /api/user/invitations`**: Fetches user's pending invitations
*   **`GET /api/user/requests`**: Fetches user's outbound requests
*   **`GET /api/user/notifications`**: Fetches user's notifications
*   **`PUT /api/user/notifications`**: Marks notifications as read

### Invitations (`/api/invitations`)
*   **`POST /api/invitations/respond`**: Accepts/rejects invitation

---

## Key Logic Flows

### 1. Authentication & Drive Connection
1. User clicks "Sign in with Google"
2. Google popup requests Auth + Drive permissions (`drive.file` scope)
3. On success, Firebase Auth signs in user
4. If new user or Drive not connected, redirect to `/api/auth/drive`
5. OAuth callback exchanges code for refresh token
6. Token encrypted and stored in `users/{uid}/driveRefreshToken`

### 2. Creating a Bag
1. User clicks "Create Bag" on dashboard
2. If Drive not connected, prompt to connect
3. POST `/api/bags/create` with name + access type
4. Backend uses user's refresh token to create Drive folder
5. Firestore `bags` document created with `googleFolderId`
6. Frontend refreshes and shows new bag

### 3. Viewing a Bag
1. User navigates to `/bag/{bagId}`
2. Frontend fetches `/api/bags/{bagId}/files`
3. Backend checks access:
   - Host: `bagData.hostUid === user.uid`
   - Invited: `bagData.invitedEmails.includes(user.email)`
   - Public: `bagData.accessType === 'public'`
4. If authorized, backend uses host's refresh token to list Drive files
5. System files (`_chat_history.json`) filtered out
6. Frontend renders file table + chat panel

### 4. Chat Message Flow
1. User types message in `BagChat` component
2. POST `/api/bags/{bagId}/chat` with message text
3. Backend writes to `bags/{bagId}/messages` subcollection
4. Optimistic UI updates immediately
5. Polling (3s interval) fetches new messages for all users
6. Periodic sync writes messages to `_chat_history.json` in Drive

### 5. Notification Flow
1. User action triggers notification (e.g., invite sent)
2. API route calls `createNotification()` helper
3. Notification document created in `notifications/{notifId}`
4. Navbar polls for unread count
5. User clicks bell icon to view dropdown
6. Clicking a notification marks it as read

---

## Security

### Authentication
*   All API routes verify Firebase ID token via `Authorization: Bearer` header
*   Tokens validated using Firebase Admin SDK

### Authorization
*   Bag access checked on every request (host/invited/public)
*   Firestore security rules enforce read/write permissions
*   Only hosts can modify bag settings, kick users, delete bags

### Data Protection
*   Drive refresh tokens encrypted before storage
*   Environment variables never committed (`.env.local` in `.gitignore`)
*   Service account keys managed via environment variables

### API Security
*   Input validation on all POST/PUT endpoints
*   Rate limiting recommended (not implemented)
*   CORS configured for production domain

---

## Environment Variables

```bash
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google OAuth (Server)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Admin (JSON string)
FIREBASE_SERVICE_ACCOUNT=

# Encryption Key (32-byte hex)
ENCRYPTION_KEY=
```

---

## Deployment

**Recommended Platform**: Vercel

### Quick Steps:
1. Set up production Firebase project
2. Configure Google Cloud OAuth credentials
3. Add environment variables to Vercel
4. Connect GitHub repository
5. Deploy

See `deployment_guide.md` for detailed instructions.

---

## Known Limitations

1. **Chat Polling**: Uses 3-second polling instead of Firestore real-time listeners
2. **No Rate Limiting**: API routes vulnerable to spam/abuse
3. **Manual Sync**: Chat-to-Drive sync requires manual trigger (not automatic)
4. **File Size**: Large files (>100MB) may timeout during upload

---

## Future Enhancements

*   Real-time chat with Firestore `onSnapshot`
*   Email notifications via SendGrid
*   File preview (images, PDFs)
*   Search functionality
*   Activity logs
*   Dark mode
*   PWA support

---

**Last Updated**: 2026-02-03  
**Maintainer**: Rohan Ghalib
