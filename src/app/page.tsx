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
            {/* --- NAVBAR --- */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
            <section className="pt-20 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-green-50 text-primary-green px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-green-100 shadow-sm shadow-green-100">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-green"></span>
                        </span>
                        v1.0.0 — It's giving production ready ✨
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                        Turn Drive Folders into <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-primary-green via-emerald-500 to-teal-500 text-transparent bg-clip-text">Squad Goals</span>
                    </h1>

                    <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        The aesthetic file drop we all needed. Collaborative "Bags" backed by Google Drive,
                        real-time chatter, and strictly good vibes only.
                        <span className="block mt-2 font-bold text-slate-900">Open Source & Free. No Cap. 🧢</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full sm:w-auto px-8 py-4 bg-primary-green text-white rounded-2xl font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-2 transform hover:-translate-y-1"
                        >
                            <HardDrive size={20} />
                            Secure the Bag
                        </button>
                        <a
                            href="https://github.com/RohanGhalib/DriveBags"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold text-lg hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                        >
                            <Github size={20} />
                            Star on GitHub
                        </a>
                    </div>
                </div>
            </section>

            {/* --- APP PREVIEW / MOCKUP --- */}
            <section className="px-6 mb-24">
                <div className="max-w-6xl mx-auto bg-slate-900 rounded-[2.5rem] p-2 sm:p-4 shadow-2xl shadow-indigo-500/10 overflow-hidden ring-1 ring-slate-900/5">
                    {/* Browser Chrome */}
                    <div className="flex items-center gap-2 mb-4 px-3 opacity-50">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    {/* Abstract UI Representation */}
                    <div className="bg-slate-50 rounded-3xl aspect-[16/9] w-full flex overflow-hidden border border-slate-200/50 relative">
                        {/* Content blurred/abstracted for generic mockup feel */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-4xl opacity-10 select-none pointer-events-none">
                            MOCKUP
                        </div>

                        {/* Sidebar */}
                        <div className="w-64 bg-white border-r border-slate-100 p-6 hidden md:block">
                            <div className="h-8 w-32 bg-slate-100 rounded-lg mb-8" />
                            <div className="space-y-3">
                                <div className="h-10 w-full bg-green-50 rounded-xl text-primary-green flex items-center px-4 font-bold text-sm">Your Stash</div>
                                <div className="h-10 w-full rounded-xl flex items-center px-4 font-bold text-slate-400 text-sm">Squad Shared</div>
                                <div className="h-10 w-full rounded-xl flex items-center px-4 font-bold text-slate-400 text-sm">Pending Glow Ups</div>
                            </div>
                        </div>
                        {/* Main Content */}
                        <div className="flex-1 p-8 flex gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
                                    <div className="h-10 w-32 bg-primary-green rounded-xl shadow-lg shadow-green-200"></div>
                                </div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 w-full bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center px-5 gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl"></div>
                                        <div className="h-4 w-40 bg-slate-100 rounded-md"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Chat Panel */}
                            <div className="w-80 bg-white border border-slate-100 rounded-2xl flex flex-col shadow-xl shadow-slate-200/50">
                                <div className="p-5 border-b border-slate-50 font-bold text-slate-800">Bag Chat 💬</div>
                                <div className="flex-1 p-4 space-y-4">
                                    <div className="self-start bg-slate-100 p-3 rounded-2xl rounded-tl-none text-xs font-medium text-slate-600 w-3/4 shadow-sm">Fit check? 📸</div>
                                    <div className="self-end bg-primary-green text-white p-3 rounded-2xl rounded-tr-none text-xs font-bold w-3/4 ml-auto shadow-md shadow-green-100">Sheeeeeesh 🔥</div>
                                    <div className="self-start bg-slate-100 p-3 rounded-2xl rounded-tl-none text-xs font-medium text-slate-600 w-3/4 shadow-sm">Bet. Uploading now.</div>
                                </div>
                                <div className="p-3 border-t border-slate-50">
                                    <div className="h-10 bg-slate-50 rounded-xl border border-slate-100"></div>
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
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Why DriveBags hits different</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                            We combine reliable Google Drive storage with the social features needed to actually collaborate.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Gatekeep Permissions</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                Keep it <span className="text-indigo-600">Locked 🔒</span> (Private), make it <span className="text-indigo-600">VIP Only 🎟️</span> (Invite), or let everyone in with <span className="text-indigo-600">For the Streets 🌍</span> (Public).
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6">
                                <MessageCircle size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Group Chat Energy</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                Stop emailing like it's 2010. Chat right alongside your files. Messages sync to a hidden file in your Drive.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <Lock size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Your Data. For Real.</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                We don't host your files. Everything lives in your own Google Drive. We just provide the aesthetic wrapper.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section id="how-it-works" className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-extrabold text-center mb-16">The Vibe Check (How it works)</h2>

                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row gap-8 items-center bg-white border border-zinc-100 p-8 rounded-3xl hover:shadow-lg transition-shadow">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg shadow-slate-200">1</div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-bold mb-2">Link Up Your Drive</h3>
                                <p className="text-slate-500 font-medium">Sign in securely with Google. We just need permission to create a folder for your Bags.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center bg-white border border-zinc-100 p-8 rounded-3xl hover:shadow-lg transition-shadow">
                            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-900 text-slate-900 flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg shadow-slate-100">2</div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-bold mb-2">Curate & Invite the Squad</h3>
                                <p className="text-slate-500 font-medium">Create a new Bag. Set it to VIP Only for privacy or Public to share with everyone.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center bg-white border border-zinc-100 p-8 rounded-3xl hover:shadow-lg transition-shadow">
                            <div className="w-16 h-16 rounded-2xl bg-primary-green text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg shadow-green-200">3</div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-bold mb-2">Spill the Tea ☕</h3>
                                <p className="text-slate-500 font-medium">Drag, drop, and chat. Real-time updates keep everyone in the loop.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TECH STACK (Developer Focused) --- */}
            <section id="tech-stack" className="py-12 px-6">
                <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-[2.5rem] p-12 md:p-24">
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
