"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    FolderOpen,
    MessageCircle,
    ShieldCheck,
    Lock,
    Github,
    ArrowRight,
    HardDrive,
    Code2
} from 'lucide-react';

export default function LandingPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-primary-green font-semibold">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto pr-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 pl-6">
                        <div className="w-8 h-8 bg-primary-green rounded-lg flex items-center justify-center text-white">
                            <FolderOpen size={18} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-xl tracking-tight">DriveBags</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-primary-green transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-primary-green transition-colors">How it Works</a>
                        <a href="#tech-stack" className="hover:text-primary-green transition-colors">Tech Stack</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/RohanGhalib/DriveBags"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden md:flex items-center gap-2 text-slate-500 hover:text-black transition-colors"
                        >
                            <Github size={20} />
                        </a>
                        <button
                            onClick={signInWithGoogle}
                            className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
                        >
                            Launch App
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-green-50 text-primary-green px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-green-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-green"></span>
                        </span>
                        v1.0.0 is Production Ready
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                        Turn Drive Folders into <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-primary-green to-emerald-600 text-transparent bg-clip-text">Collaborative Bags</span>
                    </h1>

                    <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        A high-vibe file sharing platform. Create "Bags" backed by Google Drive,
                        chat in real-time with your team, and manage granular access controls.
                        <span className="block mt-2 font-medium text-slate-900">Open Source & Free.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full sm:w-auto px-8 py-4 bg-primary-green text-white rounded-xl font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-2"
                        >
                            <HardDrive size={20} />
                            Connect Drive
                        </button>
                        <a
                            href="https://github.com/RohanGhalib/DriveBags"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Github size={20} />
                            Star on GitHub
                        </a>
                    </div>
                </div>
            </section>

            {/* --- APP PREVIEW / MOCKUP --- */}
            <section className="px-6 mb-24">
                <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl p-2 sm:p-4 shadow-2xl shadow-slate-300 overflow-hidden ring-1 ring-slate-900/5">
                    {/* Browser Chrome */}
                    <div className="flex items-center gap-2 mb-4 px-2 opacity-50">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    {/* Abstract UI Representation */}
                    <div className="bg-slate-50 rounded-lg aspect-[16/9] w-full flex overflow-hidden border border-slate-200">
                        {/* Sidebar */}
                        <div className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block">
                            <div className="h-4 w-24 bg-slate-200 rounded mb-8"></div>
                            <div className="space-y-4">
                                <div className="h-8 w-full bg-green-50 rounded text-primary-green flex items-center px-3 text-sm font-medium">My Bags</div>
                                <div className="h-8 w-full rounded flex items-center px-3 text-sm text-slate-400">Shared with Me</div>
                                <div className="h-8 w-full rounded flex items-center px-3 text-sm text-slate-400">Pending Invites</div>
                            </div>
                        </div>
                        {/* Main Content */}
                        <div className="flex-1 p-8 flex gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="h-8 w-48 bg-slate-200 rounded"></div>
                                    <div className="h-8 w-24 bg-primary-green rounded"></div>
                                </div>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 w-full bg-white border border-slate-100 rounded-lg shadow-sm flex items-center px-4 gap-4">
                                        <div className="w-8 h-8 bg-green-100 rounded"></div>
                                        <div className="h-3 w-32 bg-slate-100 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Chat Panel */}
                            <div className="w-80 bg-white border border-slate-200 rounded-xl flex flex-col shadow-lg">
                                <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Bag Chat</div>
                                <div className="flex-1 p-4 space-y-3">
                                    <div className="self-start bg-slate-100 p-2 rounded-lg rounded-tl-none text-xs text-slate-600 w-3/4">Hey, did you upload the assets?</div>
                                    <div className="self-end bg-primary-green text-white p-2 rounded-lg rounded-tr-none text-xs w-3/4 ml-auto">Just dropped them in!</div>
                                </div>
                                <div className="p-3 border-t border-slate-100">
                                    <div className="h-8 bg-slate-50 rounded border border-slate-200"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section id="features" className="py-24 bg-slate-50 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why use DriveBags?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">
                            We combine the storage reliability of Google Drive with the social features of a modern collaboration tool.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Granular Access</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Set your Bag to <span className="font-semibold text-slate-700">Public</span>, <span className="font-semibold text-slate-700">Private</span>, <span className="font-semibold text-slate-700">Invite Only</span>, or <span className="font-semibold text-slate-700">Request Access</span>. You decide who sees what.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-6">
                                <MessageCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Contextual Chat</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Stop emailing back and forth. Chat right alongside your files. Messages are synced to a hidden JSON file in your Drive for portability.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Data Ownership</h3>
                            <p className="text-slate-500 leading-relaxed">
                                We don't host your files. Everything lives in your own Google Drive. We just provide the beautiful interface to manage it.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section id="how-it-works" className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Collaboration in 3 Steps</h2>

                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">1</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Connect your Drive</h3>
                                <p className="text-slate-500">Sign in securely with Google. We ask for permission to create and manage specific folders (Bags) for you.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">2</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Create a Bag & Invite Friends</h3>
                                <p className="text-slate-500">Create a new folder. Choose "Invite Only" for privacy or "Public" to share with the world. Send invites via email.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">3</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Chat & Sync</h3>
                                <p className="text-slate-500">Drag and drop files. Chat with your group. Notifications keep you updated on new uploads or messages.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TECH STACK (Developer Focused) --- */}
            <section id="tech-stack" className="py-24 bg-slate-900 text-white px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                <Code2 className="text-primary-green" />
                                Built for Modern Web
                            </h2>
                            <p className="text-slate-400 max-w-lg">
                                DriveBags is open source and built with the bleeding edge of the React ecosystem.
                                Check out the code, fork it, and make it your own.
                            </p>
                        </div>
                        <a href="https://github.com/RohanGhalib/DriveBags" className="text-primary-green hover:text-green-400 font-medium flex items-center gap-2">
                            Explore the Repo <ArrowRight size={18} />
                        </a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: "Next.js 16", desc: "App Router" },
                            { name: "Tailwind v4", desc: "Styling" },
                            { name: "Firebase", desc: "Auth & DB" },
                            { name: "Google Drive API", desc: "Storage" },
                            { name: "Framer Motion", desc: "Animations" },
                            { name: "Lucide", desc: "Iconography" },
                            { name: "React 19", desc: "Core" },
                            { name: "Serverless", desc: "Architecture" },
                        ].map((tech) => (
                            <div key={tech.name} className="bg-white/5 border border-white/10 p-4 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="font-bold text-lg">{tech.name}</div>
                                <div className="text-slate-400 text-sm">{tech.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 bg-white border-t border-slate-100 px-6 text-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
                        <FolderOpen size={24} className="text-primary-green" />
                        DriveBags
                    </div>

                    <p className="text-slate-500 text-sm">
                        Made with ❤️ and high vibes by <a href="https://rohanghalib.com" className="text-primary-green font-semibold hover:underline">Rohan Ghalib</a>
                    </p>

                    <div className="flex gap-6 mt-2">
                        <a href="https://github.com/RohanGhalib/DriveBags" className="text-slate-400 hover:text-slate-900 transition-colors">
                            <Github size={20} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
