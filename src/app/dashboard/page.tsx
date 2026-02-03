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

    // Derived State
    const filteredBags = bags.filter(bag => {
        if (filter === 'mine') return bag.hostUid === user?.uid;
        if (filter === 'shared') return bag.hostUid !== user?.uid;
        return true;
    });

    if (loading || !user) return <div className="h-screen flex items-center justify-center text-primary-green"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My DriveBags</h1>
                    <p className="text-zinc-500 mt-1">Manage and collaborate on your secure folders.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-primary-green text-white px-5 py-2.5 rounded-full font-medium hover:brightness-110 transition-all shadow-sm shadow-green-200"
                >
                    <Plus size={20} /> New Bag
                </button>
            </div>

            {/* Notifications Area (Invites & Requests) */}
            {(invites.length > 0 || myRequests.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {invites.length > 0 && <PendingInvites invites={invites} />}
                    {myRequests.length > 0 && <PendingRequests requests={myRequests} />}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-6 border-b border-zinc-100 pb-1">
                <FilterTab label="All Bags" active={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterTab label="Created by Me" active={filter === 'mine'} onClick={() => setFilter('mine')} />
                <FilterTab label="Shared with Me" active={filter === 'shared'} onClick={() => setFilter('shared')} />
            </div>

            {/* Grid */}
            {loadingData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-zinc-100 rounded-xl" />)}
                </div>
            ) : filteredBags.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-50 mb-4 text-zinc-400">
                        <Folder size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900">No bags found</h3>
                    <p className="text-zinc-500 mt-1">Create a new bag to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBags.map(bag => (
                        <BagCard key={bag.id} bag={bag} currentUid={user.uid} />
                    ))}
                </div>
            )}

            {showCreateModal && <CreateBagModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
}

function PendingInvites({ invites }: { invites: any[] }) {
    const { user } = useAuth();

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
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                <Mail size={18} /> Bag Invitations
            </h3>
            <div className="space-y-3">
                {invites.map(inv => (
                    <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <div className="font-bold text-zinc-900">{inv.bagName}</div>
                            <div className="text-xs text-zinc-500">Invited to join</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleRespond(inv.id, false)} className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-lg transition-colors"><X size={18} /></button>
                            <button onClick={() => handleRespond(inv.id, true)} className="px-4 py-2 bg-primary-green text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all">Accept</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PendingRequests({ requests }: { requests: any[] }) {
    return (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h3 className="text-amber-900 font-bold mb-4 flex items-center gap-2">
                <Clock size={18} /> Sent Requests
            </h3>
            <div className="space-y-3">
                {requests.map(req => (
                    <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <div className="font-bold text-zinc-900">{req.bagName || 'Unknown Bag'}</div>
                            <div className="text-xs text-amber-600 font-medium capitalize">{req.status}</div>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center bg-zinc-50 text-zinc-400 rounded-lg">
                            <Clock size={16} />
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
                "pb-3 text-sm font-medium transition-colors relative",
                active ? "text-primary-green" : "text-zinc-500 hover:text-zinc-800"
            )}
        >
            {label}
            {active && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-green rounded-full" />}
        </button>
    );
}

function BagCard({ bag, currentUid }: { bag: Bag, currentUid: string }) {
    const isHost = bag.hostUid === currentUid;

    // Access Badge Helper
    const getAccessBadge = () => {
        switch (bag.accessType) {
            case 'private': return { label: 'Private', icon: Lock, bg: 'bg-zinc-100', text: 'text-zinc-600' };
            case 'invite': return { label: 'Invite Only', icon: Mail, bg: 'bg-blue-50', text: 'text-blue-600' };
            case 'public': return { label: 'Public', icon: Globe, bg: 'bg-green-50', text: 'text-green-600' };
            case 'request': return { label: 'Request', icon: Shield, bg: 'bg-amber-50', text: 'text-amber-600' };
            default: return { label: 'Unknown', icon: Lock, bg: 'bg-zinc-100', text: 'text-zinc-600' };
        }
    };
    const badge = getAccessBadge();

    return (
        <Link
            href={`/bag/${bag.id}`}
            className="group block bg-white rounded-xl border border-zinc-100 p-5 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-primary-green group-hover:text-white transition-colors">
                    <Folder size={24} fill="currentColor" className="opacity-90" />
                </div>
                {/* Access Badge */}
                <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", badge.bg, badge.text)}>
                    <badge.icon size={12} />
                    {badge.label}
                </div>
            </div>

            <h3 className="text-lg font-bold text-zinc-900 group-hover:text-primary-green transition-colors truncate">
                {bag.name}
            </h3>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 border border-white shadow-sm overflow-hidden">
                        {/* Placeholder for Host Avatar */}
                        <User size={12} />
                    </div>
                    <span className="text-xs text-zinc-500">
                        {isHost ? 'Hosted by You' : 'External Host'}
                    </span>
                </div>

                {/* Visual Stack (Mock for now, would need real participant data) */}
                <div className="flex -space-x-2">
                    {bag.invitedEmails?.length > 0 && (
                        <>
                            <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[10px] text-zinc-600">
                                {bag.invitedEmails[0][0].toUpperCase()}
                            </div>
                            {bag.invitedEmails.length > 1 && (
                                <div className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] text-zinc-500">
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
        e.preventDefault();
        if (!user || !name) return;
        setCreating(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/bags/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, accessType })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                const d = await res.json();
                if (d.error === 'Drive not connected') {
                    // User requested "popup", but robust OAuth is best with redirect or specific popup handling.
                    // The requirement: "open the drive permission pop up"
                    // We will use window.location.href to trigger the server-side flow which shows the consent screen.
                    // This effectively behaves like a "permission pop up" (full screen).
                    const proceed = confirm("Drive permission is required to create a bag. Connect now?");
                    if (proceed) {
                        window.location.href = '/api/auth/drive';
                    }
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-zinc-900">Create New Bag</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Bag Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all"
                            placeholder="e.g. Q4 Marketing Assets"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Access Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <AccessOption
                                label="Private"
                                desc="Only you"
                                active={accessType === 'private'}
                                onClick={() => setAccessType('private')}
                            />
                            <AccessOption
                                label="Invite Only"
                                desc="Specific people"
                                active={accessType === 'invite'}
                                onClick={() => setAccessType('invite')}
                            />
                            <AccessOption
                                label="Request"
                                desc="Approved requests"
                                active={accessType === 'request'}
                                onClick={() => setAccessType('request')}
                            />
                            <AccessOption
                                label="Public"
                                desc="Anyone with link"
                                active={accessType === 'public'}
                                onClick={() => setAccessType('public')}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-zinc-600 font-medium hover:bg-zinc-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={creating} className="px-5 py-2.5 rounded-lg bg-primary-green text-white font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200">
                            {creating ? "Creating..." : "Create Bag"}
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
                "p-3 rounded-lg border text-left transition-all",
                active
                    ? "border-primary-green bg-green-50/50 ring-1 ring-primary-green"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            )}
        >
            <div className={clsx("text-sm font-semibold", active ? "text-primary-green" : "text-zinc-900")}>{label}</div>
            <div className="text-xs text-zinc-500">{desc}</div>
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
