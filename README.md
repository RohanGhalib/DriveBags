# 🎒 DriveBags

<div align="center">

![DriveBags Logo](https://img.shields.io/badge/DriveBags-v1.0.0-58CC02?style=for-the-badge&logo=google-drive&logoColor=white)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Turn Drive Folders into Collaborative Bags**

A modern file-sharing platform that combines Google Drive storage with real-time chat and granular access controls.

[Live Demo](#) • [Documentation](AI_CONTEXT.md) • [Deployment Guide](deployment_guide.md)

</div>

---

## ✨ Features

- 🔐 **Granular Access Control** - Set bags to Private, Public, Invite-Only, or Request Access
- 💬 **Contextual Chat** - Real-time messaging synced to Drive for portability
- 📁 **Google Drive Backend** - Your data stays in your own Drive
- 🔔 **Smart Notifications** - Stay updated on invites, requests, and activity
- 📱 **Responsive Design** - Swipeable mobile interface (Files ↔ Chat)
- 🎨 **Modern UI** - Clean, light-mode interface with smooth animations
- 🔒 **Secure** - Firebase Auth with encrypted token storage

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account
- Firebase project
- Google Drive API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RohanGhalib/DriveBags.git
   cd DriveBags
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` in the root directory:
   ```env
   # Firebase Client (Public)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google OAuth (Server)
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret

   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Firebase Admin (JSON as single-line string)
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

   # Encryption Key (32-byte hex)
   ENCRYPTION_KEY=your_64_char_hex_string
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

---

## 📖 Documentation

- **[AI_CONTEXT.md](AI_CONTEXT.md)** - Complete technical documentation
- **[deployment_guide.md](deployment_guide.md)** - Step-by-step production deployment
- **[final_report.md](final_report.md)** - Testing results and recommendations

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, Tailwind CSS v4 |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **Storage** | Google Drive API |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

---

## 🎯 How It Works

1. **Connect Drive** - Sign in with Google and grant Drive permissions
2. **Create a Bag** - Set up a collaborative folder with custom access controls
3. **Invite & Share** - Add team members via email or shareable link
4. **Chat & Collaborate** - Real-time messaging alongside your files

---

## 🔧 Project Structure

```
DriveBags/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes (auth, bags, chat, etc.)
│   │   ├── dashboard/         # Main dashboard
│   │   ├── bag/[bagId]/       # Individual bag view
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── BagChat.tsx        # Chat interface
│   │   ├── ManageAccessPanel.tsx
│   │   ├── Navbar.tsx
│   │   └── NotificationsPanel.tsx
│   ├── context/               # React context providers
│   │   └── AuthContext.tsx
│   └── lib/                   # Utility functions
│       ├── firebase/          # Firebase config
│       ├── google/            # Google Drive utilities
│       └── crypto.ts          # Encryption helpers
└── public/                    # Static assets
```

---

## 🚢 Deployment

Deploy to Vercel in minutes:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RohanGhalib/DriveBags)

Or follow the [complete deployment guide](deployment_guide.md) for manual setup.

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication flow (sign-in, Drive permissions)
- [ ] Create bag with different access types
- [ ] Upload/download files
- [ ] Send chat messages
- [ ] Invite users and manage access
- [ ] Mobile swipe gestures (Files ↔ Chat)
- [ ] Notification system

### Build Verification
```bash
npm run build
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI inspired by modern collaboration tools
- Icons by [Lucide](https://lucide.dev/)

---

## 📧 Contact

**Rohan Ghalib** - [rohanghalib.com](https://rohanghalib.com)

Project Link: [https://github.com/RohanGhalib/DriveBags](https://github.com/RohanGhalib/DriveBags)

---

<div align="center">

Made with ❤️ and high vibes

⭐ Star this repo if you find it useful!

</div>
