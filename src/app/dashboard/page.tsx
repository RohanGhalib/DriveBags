"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { FolderPlus, HardDrive, Share2, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [myBags, setMyBags] = useState<any[]>([]);
    const [joinedBags, setJoinedBags] = useState<any[]>([]);
    const [connecting, setConnecting] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const handleCodeExchange = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('google_drive_code');
            if (code && user) {
                setConnecting(true);
                try {
                    const token = await user.getIdToken();
                    const res = await fetch('/api/auth/drive/exchange', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ code })
                    });
                    if (res.ok) {
                        alert("Google Drive Connected Successfully!");
                        router.replace('/dashboard'); // Clear URL
                        setIsDriveConnected(true);
                    } else {
                        const d = await res.json();
                        alert("Failed to connect Drive: " + d.error);
                    }
                } catch (e) {
                    console.error(e);
                    alert("Error connecting Drive");
                } finally {
                    setConnecting(false);
                }
            }
        };

        if (user) {
            handleCodeExchange();

            const fetchData = async () => {
                setLoadingData(true);
                try {
                    // 1. Check User Profile for Drive Connection
                    const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
                    if (!userDoc.empty) {
                        const userData = userDoc.docs[0].data();
                        if (userData.driveConnectedAt) {
                            setIsDriveConnected(true);
                        }
                    }

                    // 2. My Bags
                    const qMy = query(collection(db, "bags"), where("hostUid", "==", user.uid));
                    const snapMy = await getDocs(qMy);
                    setMyBags(snapMy.docs.map(d => ({ id: d.id, ...d.data() })));

                    // 3. Joined Bags
                    try {
                        const qJoined = query(collection(db, "bags"), where("invitedEmails", "array-contains", user.email));
                        const snapJoined = await getDocs(qJoined);
                        setJoinedBags(snapJoined.docs.map(d => ({ id: d.id, ...d.data() })));
                    } catch (e) {
                        console.log("Index might be missing for joined bags query", e);
                    }
                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                } finally {
                    setLoadingData(false);
                }
            };

            fetchData();
        }
    }, [user]);



    const handleConnectDrive = async () => {
        // Redirect to Auth API
        window.location.href = "/api/auth/drive";
    };

    if (loading || !user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">DriveBags</h1>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-zinc-500">{user.email}</div>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* My Bags */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <HardDrive size={20} /> My Bags
                        </h2>
                        <div className="flex gap-2">
                            {!isDriveConnected && (
                                <button onClick={handleConnectDrive} disabled={connecting} className="text-xs bg-blue-600/10 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-600/20 disabled:opacity-50">
                                    {connecting ? "Connecting..." : "Connect Drive"}
                                </button>
                            )}
                            <button onClick={() => setShowCreateModal(true)} className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black px-3 py-1.5 rounded-md flex items-center gap-1">
                                <FolderPlus size={14} /> New Bag
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loadingData ? (
                            <div className="text-center py-8 text-zinc-400">Loading your bags...</div>
                        ) : myBags.length === 0 ? (
                            <p className="text-zinc-500 text-sm">No bags created yet.</p>
                        ) : (
                            myBags.map(bag => (
                                <Link key={bag.id} href={`/bag/${bag.id}`} className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 transition-colors">
                                    <div className="font-medium">{bag.name}</div>
                                    <div className="text-xs text-zinc-500 mt-1">{bag.accessType} • {new Date(bag.createdAt).toLocaleDateString()}</div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Joined Bags */}
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <Share2 size={20} /> Joined Bags
                    </h2>
                    <div className="space-y-3">
                        {loadingData ? (
                            <div className="text-center py-8 text-zinc-400">Loading joined bags...</div>
                        ) : joinedBags.length === 0 ? (
                            <p className="text-zinc-500 text-sm">No joined bags.</p>
                        ) : (
                            joinedBags.map(bag => (
                                <Link key={bag.id} href={`/bag/${bag.id}`} className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 transition-colors">
                                    <div className="font-medium">{bag.name}</div>
                                    <div className="text-xs text-zinc-500 mt-1">Host ID: {bag.hostUid.slice(0, 6)}...</div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateBagModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
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
                alert("Error: " + d.error);
                setCreating(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error creating bag");
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Create New Bag</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Bag Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                            placeholder="e.g. Project Assets"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Access Type</label>
                        <select
                            value={accessType}
                            onChange={e => setAccessType(e.target.value)}
                            className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        >
                            <option value="private">Private (Invite Only)</option>
                            <option value="public">Public (Anyone can join)</option>
                            <option value="request">Request Access (Admin approves)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={creating} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {creating ? "Creating..." : "Create Bag"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
