import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UploadProvider } from "@/components/UploadManager";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DriveBags",
    description: "Cloud Storage Overlay",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Note: Toaster (sonner) is a nice toast library, need to install it or use just raw div
    // I will assume standard Shadcn usage or just basic HTML/CSS if not present.
    // Prompt asked for Shadcn/UI but I only installed base deps.
    // I will skip Toaster in code if not installed, but it's good practice.
    // I'll leave it but commented out if I haven't installed it, or better: 
    // simply strictly follow what I installed. I haven't installed sonner.

    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <UploadProvider>
                        <div className="min-h-screen flex flex-col bg-zinc-50 font-sans text-zinc-900">
                            {/* Navbar is client component, will handle its own rendering check if needed, 
                                but usually we want it everywhere except maybe login if we wanted, 
                                but instructions say persistent. */}
                            <Navbar />
                            <main className="flex-1 w-full max-w-7xl mx-auto">
                                {children}
                            </main>
                        </div>
                    </UploadProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
