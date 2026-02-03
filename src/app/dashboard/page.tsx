"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Folder, Plus, User, Shield, Globe, Mail, Lock, Search, Filter, X, Check, Clock, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

type Bag = {
    id: string;
    name: string;
    hostUid: string;
    accessType: 'private' | 'public' | 'invite' | 'request';
    invitedEmails: string[];
    createdAt: string;
    hostData?: any;
};

function DashboardContent() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [bags, setBags] = useState<Bag[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [filter, setFilter] = useState<'all' | 'mine' | 'shared'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Invites & Requests
    const [invites, setInvites] = useState<any[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]);

    const searchParams = useSearchParams();
    const driveCode = searchParams.get('google_drive_code');

    // Auth Check
    useEffect(() => {
        if (!loading && !user) router.push("/");
    }, [user, loading, router]);

    // Handle Drive Code Exchange
    useEffect(() => {
        if (!driveCode || !user) return;

        const exchangeCode = async () => {
            try {
                // Clear the param from URL to avoid loop/re-execution
                router.replace('/dashboard');

                const token = await user.getIdToken();
                const res = await fetch('/api/auth/drive/exchange', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: driveCode })
                });

                if (res.ok) {
                    alert('Google Drive connected successfully!');
                    window.location.reload(); // Reload to refresh state/allow invalidation
                } else {
                    const d = await res.json();
                    alert('Failed to connect Drive: ' + d.error);
                }
            } catch (e) {
                console.error(e);
                alert('An error occurred connecting Drive.');
            }
        };
        exchangeCode();
    }, [driveCode, user, router]);

    // Data Fetching
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Fetch My Bags
                const qMy = query(collection(db, "bags"), where("hostUid", "==", user.uid));
                const snapMy = await getDocs(qMy);
                const myBags = snapMy.docs.map(d => ({ id: d.id, ...d.data() } as Bag));

                // Fetch Shared Bags (where invited)
                const qShared = query(collection(db, "bags"), where("invitedEmails", "array-contains", user.email));
                const snapShared = await getDocs(qShared);
                const sharedBags = snapShared.docs.map(d => ({ id: d.id, ...d.data() } as Bag));

                // Combine and Deduplicate
                const all = [...myBags];
                sharedBags.forEach(b => {
                    if (!all.find(existing => existing.id === b.id)) {
                        all.push(b);
                    }
                });

                // Sort by new
                all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                setBags(all);

                // Fetch Invites & Requests
                const token = await user.getIdToken();

                // Invites
                const invRes = await fetch('/api/user/invitations', { headers: { 'Authorization': `Bearer ${token}` } });
                if (invRes.ok) {
                    const d = await invRes.json();
                    setInvites(d.invites || []);
                }

                // Requests
                const reqRes = await fetch('/api/user/requests', { headers: { 'Authorization': `Bearer ${token}` } });
                if (reqRes.ok) {
                    const d = await reqRes.json();
                    setMyRequests(d.requests || []);
                }

            } catch (e) {
                console.error("Error fetching data:", e);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [user]);

    // Derived State - Restored Logic
    const filteredBags = bags.filter(bag => {
        if (filter === 'mine') return bag.hostUid === user?.uid;
        if (filter === 'shared') return bag.hostUid !== user?.uid;
        return true;
    });

    const totalBags = bags.length;
    const sharedCount = bags.filter(b => b.hostUid !== user?.uid).length;

    if (loading || !user) return <div className="h-screen flex items-center justify-center text-primary-green"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-10 pb-20">
            {/* Bento Grid Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Welcome Tile */}
                <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-green/30 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Your Stash 🎒</h1>
                        <p className="text-slate-400 text-lg max-w-md">
                            Your digital backpack. Locked in & ready for the squad.
                        </p>
                    </div>
                </div>

                {/* Stats / Action Tile */}
                <div className="grid grid-rows-2 gap-6">
                    <div className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-3xl font-extrabold text-slate-900">{totalBags}</div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Bags</div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary-green text-white rounded-3xl p-6 flex items-center justify-between group hover:brightness-110 transition-all shadow-lg shadow-green-200"
                    >
                        <span className="font-bold text-lg">Secure a Bag</span>
                        <div className="bg-white/20 p-2 rounded-full group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Notifications Area (Invites & Requests) */}
            {(invites.length > 0 || myRequests.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {invites.length > 0 && <PendingInvites invites={invites} />}
                    {myRequests.length > 0 && <PendingRequests requests={myRequests} />}
                </div>
            )}

            {/* Main Content Area */}
            <div>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-8">
                    <div className="flex items-center gap-8">
                        <FilterTab label="All Vibes" active={filter === 'all'} onClick={() => setFilter('all')} />
                        <FilterTab label="My Stash" active={filter === 'mine'} onClick={() => setFilter('mine')} />
                        <FilterTab label="Shared w/ Squad" active={filter === 'shared'} onClick={() => setFilter('shared')} />
                    </div>
                </div>

                {/* Grid */}
                {loadingData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-zinc-100 rounded-3xl" />)}
                    </div>
                ) : filteredBags.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white mb-6 text-zinc-300 shadow-sm">
                            <Folder size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">No bags? That's kinda mid. 😐</h3>
                        <p className="text-zinc-500 max-w-xs mx-auto mb-8">
                            Start a new stash and get the invite link out to the squad.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                            Start styling
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBags.map(bag => (
                            <BagCard key={bag.id} bag={bag} currentUid={user.uid} />
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && <CreateBagModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
}

function PendingInvites({ invites }: { invites: any[] }) {
    const { user } = useAuth();
    // ... handleRespond logic remains same ...
    const handleRespond = async (inviteId: string, accept: boolean) => {
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/invitations/respond', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId, decision: accept ? 'accept' : 'reject' })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error}`);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-blue-900 font-bold mb-6 flex items-center gap-2 text-lg">
                <Mail size={20} /> Squad Invites 💌
            </h3>
            <div className="space-y-4">
                {invites.map(inv => (
                    <div key={inv.id} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="font-bold text-zinc-900 text-lg">{inv.bagName}</div>
                            <div className="text-sm text-zinc-500 font-medium">Wants you in the loop</div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleRespond(inv.id, false)} className="p-3 text-zinc-400 hover:bg-zinc-50 rounded-xl transition-colors"><X size={20} /></button>
                            <button onClick={() => handleRespond(inv.id, true)} className="px-5 py-2.5 bg-primary-green text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-green-200/50">Let me in</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PendingRequests({ requests }: { requests: any[] }) {
    return (
        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-amber-900 font-bold mb-6 flex items-center gap-2 text-lg">
                <Clock size={20} /> Pending Glow Ups ⏳
            </h3>
            <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-50/50 flex items-center justify-between">
                        <div>
                            <div className="font-bold text-zinc-900 text-lg">{req.bagName || 'Unknown Bag'}</div>
                            <div className="text-xs text-amber-600 font-bold uppercase tracking-wide bg-amber-50 px-2 py-1 rounded-md inline-block mt-1">{req.status}</div>
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 text-zinc-400 rounded-xl">
                            <Clock size={20} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function FilterTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "pb-1 text-lg font-bold transition-all relative",
                active ? "text-slate-900" : "text-zinc-400 hover:text-zinc-600"
            )}
        >
            {label}
            {active && <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-green rounded-full" />}
        </button>
    );
}

function BagCard({ bag, currentUid }: { bag: Bag, currentUid: string }) {
    const isHost = bag.hostUid === currentUid;

    // Access Badge Helper - Gen Z Update
    const getAccessBadge = () => {
        switch (bag.accessType) {
            case 'private': return { label: 'Locked 🔒', bg: 'bg-zinc-100', text: 'text-zinc-600' };
            case 'invite': return { label: 'VIP Only 🎟️', bg: 'bg-purple-50', text: 'text-purple-600' };
            case 'public': return { label: 'For the Streets 🌍', bg: 'bg-green-50', text: 'text-green-600' };
            case 'request': return { label: 'Knock Knock 🚪', bg: 'bg-amber-50', text: 'text-amber-600' };
            default: return { label: 'Unknown', bg: 'bg-zinc-100', text: 'text-zinc-600' };
        }
    };
    const badge = getAccessBadge();

    return (
        <Link
            href={`/bag/${bag.id}`}
            className="group block bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 hover:border-zinc-200 transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-primary-green group-hover:text-white transition-colors duration-300">
                    <Folder size={24} strokeWidth={2.5} />
                </div>
                {/* Access Badge */}
                <div className={clsx("px-3 py-1.5 rounded-full text-xs font-bold tracking-wide", badge.bg, badge.text)}>
                    {badge.label}
                </div>
            </div>

            <h3 className="text-xl font-extrabold text-zinc-900 group-hover:text-primary-green transition-colors truncate mb-2">
                {bag.name}
            </h3>

            <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                        {isHost ? 'ME' : 'Host'}
                    </div>
                    <span className="text-xs font-medium text-zinc-500">
                        {isHost ? 'Owner' : 'External'}
                    </span>
                </div>

                {/* Visual Stack */}
                <div className="flex -space-x-3">
                    {bag.invitedEmails?.length > 0 && (
                        <>
                            <div className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                {bag.invitedEmails[0][0].toUpperCase()}
                            </div>
                            {bag.invitedEmails.length > 1 && (
                                <div className="w-8 h-8 rounded-full bg-zinc-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                    +{bag.invitedEmails.length - 1}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}


function CreateBagModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [accessType, setAccessType] = useState("private");
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (existing logic) ...
        e.preventDefault();
        if (!user || !name) return;
        setCreating(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/bags/create", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ name, accessType })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                const d = await res.json();
                if (d.error === 'Drive not connected') {
                    const proceed = confirm("Drive permission is required to create a bag. Connect now?");
                    if (proceed) window.location.href = '/api/auth/drive';
                } else {
                    alert("Error: " + d.error);
                }
                setCreating(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error creating bag");
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-extrabold text-zinc-900">Secure the Bag 💰</h3>
                        <p className="text-zinc-400 text-sm mt-1">Start a new collection.</p>
                    </div>
                    <button onClick={onClose} className="bg-zinc-100 p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 mb-2">What's the vibe? (Name)</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-5 py-4 rounded-xl bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-primary-green focus:outline-none transition-all font-medium text-lg placeholder:text-zinc-300"
                            placeholder="e.g. Summer 2026 Dump 📸"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-zinc-900 mb-3">Who's invited?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <AccessOption
                                label="Locked 🔒"
                                desc="Only you fam"
                                active={accessType === 'private'}
                                onClick={() => setAccessType('private')}
                            />
                            <AccessOption
                                label="VIP Only 🎟️"
                                desc="Invite the squad"
                                active={accessType === 'invite'}
                                onClick={() => setAccessType('invite')}
                            />
                            <AccessOption
                                label="Knock Knock 🚪"
                                desc="They ask nicely"
                                active={accessType === 'request'}
                                onClick={() => setAccessType('request')}
                            />
                            <AccessOption
                                label="For the Streets 🌍"
                                desc="Everyone's invited"
                                active={accessType === 'public'}
                                onClick={() => setAccessType('public')}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-zinc-500 font-bold hover:bg-zinc-50 transition-colors">
                            Nah, cancel
                        </button>
                        <button type="submit" disabled={creating} className="px-8 py-3 rounded-xl bg-primary-green text-white font-bold hover:brightness-110 hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5">
                            {creating ? "Securing..." : "Create It ✨"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AccessOption({ label, desc, active, onClick }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "p-4 rounded-xl text-left transition-all border-2",
                active
                    ? "border-primary-green bg-green-50/30"
                    : "border-transparent bg-zinc-50 hover:bg-zinc-100"
            )}
        >
            <div className={clsx("font-bold text-sm mb-0.5", active ? "text-primary-green" : "text-zinc-900")}>{label}</div>
            <div className="text-xs text-zinc-500 font-medium">{desc}</div>
        </button>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
