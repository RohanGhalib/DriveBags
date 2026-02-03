"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUploads } from "@/components/UploadManager";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { File as FileIcon, UploadCloud, Folder, Search, ArrowLeft, UserPlus, X, Settings, ShieldAlert, Check, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

export default function BagPage() {
    const { bagId }: { bagId: string } = useParams();
    const router = useRouter();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const { uploadFile } = useUploads();

    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [accessError, setAccessError] = useState(false);
    const [bagMetadata, setBagMetadata] = useState<any>(null);
    const [requesting, setRequesting] = useState(false);
    const [isHost, setIsHost] = useState(false);

    const fetchFiles = async () => {
        if (!user) return;
        setAccessError(false);
        setLoadingFiles(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files || []);
                setIsHost(data.isHost);
                setBagMetadata({
                    name: data.bagName,
                    accessType: data.accessType
                });
            } else {
                const errorData = await res.json();
                console.error("Failed to fetch files:", res.status, errorData);
                if (res.status === 403) {
                    setBagMetadata(errorData);
                    setAccessError(true);
                } else {
                    alert(`Failed to load files: ${errorData.error || res.statusText}`);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Network error loading files");
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoadingFiles(false);
            return;
        }
        fetchFiles();
    }, [bagId, user, authLoading]);

    // ... (Drag handlers same as before) ...
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            Array.from(e.dataTransfer.files).forEach(file => {
                uploadFile(file, bagId);
            });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                uploadFile(file, bagId);
            });
        }
    };

    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this bag? You may need to be re-invited to join again.")) return;
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert("Failed to leave bag");
            }
        } catch (e) { console.error(e); }
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
                    <div className="flex justify-center mb-4">
                        <Folder className="w-16 h-16 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Login Required</h1>
                    <p className="text-zinc-500 mb-6">You need to be signed in to access this bag.</p>
                    <button
                        onClick={() => signInWithGoogle()}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    // ... (Access Error UI)
    if (accessError) {
        const canRequest = bagMetadata?.accessType === 'request';

        const handleRequestAccess = async () => {
            if (!user) return;
            setRequesting(true);
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/bags/${bagId}/request`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    alert("Request sent successfully!");
                } else {
                    alert("Failed to send request");
                }
            } catch (e) { console.error(e); }
            finally { setRequesting(false); }
        };

        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
                    <div className="flex justify-center mb-4">
                        <ShieldAlert className="w-16 h-16 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-zinc-500 mb-6">
                        You do not have permission to view <strong>{bagMetadata?.bagName || 'this bag'}</strong>.
                    </p>

                    {canRequest ? (
                        <div className="w-full">
                            <button
                                onClick={handleRequestAccess}
                                disabled={requesting}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3 disabled:opacity-50"
                            >
                                {requesting ? "Sending Request..." : "Request Access"}
                            </button>
                            <p className="text-xs text-zinc-400 mt-2">
                                This bag requires approval from the host.
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-sm text-zinc-500 mb-4">
                            {bagMetadata?.accessType === 'invite' ?
                                "This bag is Invite Only. Please ask the host to send you an invite." :
                                "This bag is Private. You must be the host to view it."
                            }
                        </div>
                    )}

                    <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 text-zinc-900 dark:text-zinc-100"
            onDragEnter={handleDrag}
        >
            {dragActive && (
                <div
                    className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-xl"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="text-2xl font-bold text-blue-600">Drop files to upload</div>
                </div>
            )}

            <header className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold">Bag Contents</h1>
                <div className="ml-auto flex items-center gap-3">
                    {isHost && (
                        <button onClick={() => setShowSettingsModal(true)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                            <Settings size={20} />
                        </button>
                    )}
                    {!isHost && (
                        <button onClick={handleLeave} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Leave Bag">
                            <LogOut size={20} />
                        </button>
                    )}
                    <button onClick={() => setShowShareModal(true)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md flex items-center gap-2">
                        <UserPlus size={18} /> <span className="text-sm font-medium">Share</span>
                    </button>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <UploadCloud size={18} />
                        <span>Upload</span>
                        <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                    </label>
                </div>
            </header>

            {loadingFiles ? (
                <div className="text-center py-10 text-zinc-500">Loading files...</div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="p-4 font-medium text-sm w-8">Type</th>
                                <th className="p-4 font-medium text-sm">Name</th>
                                <th className="p-4 font-medium text-sm">Size</th>
                                <th className="p-4 font-medium text-sm text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                                        Folder is empty. Drag & drop files to upload.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr key={file.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="p-4">
                                            {file.mimeType.includes('folder') ?
                                                <Folder size={18} className="text-yellow-500" /> :
                                                <FileIcon size={18} className="text-blue-500" />
                                            }
                                        </td>
                                        <td className="p-4 font-medium">
                                            <a href={file.webViewLink} target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-600">
                                                {file.name}
                                            </a>
                                        </td>
                                        <td className="p-4 text-sm text-zinc-500">
                                            {file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <a
                                                href={file.webViewLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs border border-zinc-300 dark:border-zinc-700 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                Open
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {showShareModal && (
                <ShareModal bagId={bagId} onClose={() => setShowShareModal(false)} />
            )}
            {showSettingsModal && (
                <SettingsModal bagId={bagId} metadata={bagMetadata} onClose={() => setShowSettingsModal(false)} />
            )}
        </div>
    );
}

function SettingsModal({ bagId, metadata, onClose }: { bagId: string, metadata: any, onClose: () => void }) {
    const { user } = useAuth();
    const router = useRouter(); // Use main router from next/navigation
    const [activeTab, setActiveTab] = useState<'general' | 'requests' | 'invite'>('general');
    const [name, setName] = useState(metadata?.name || "");
    const [accessType, setAccessType] = useState(metadata?.accessType || "private");
    const [saving, setSaving] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState("");
    const [sendingInvite, setSendingInvite] = useState(false);

    // Delete State
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchRequests();
        }
    }, [activeTab]);

    const fetchRequests = async () => {
        if (!user) return;
        setLoadingRequests(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        // Alert user about mode change
        if (accessType !== metadata?.accessType && ['private', 'invite', 'request'].includes(accessType) && metadata?.accessType === 'public') {
            if (!confirm("Switching to Restricted Mode will require non-host users to be re-invited or request access. Continue?")) {
                setSaving(false);
                return;
            }
        }

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, accessType })
            });
            if (res.ok) {
                alert("Settings saved!");
                onClose();
                window.location.reload();
            } else {
                alert("Failed to save settings");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingInvite(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/invite`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail })
            });
            if (res.ok) {
                alert("Invite sent!");
                setInviteEmail("");
            } else {
                const d = await res.json();
                alert("Failed: " + d.error);
            }
        } catch (e) { console.error(e); }
        finally { setSendingInvite(false); }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this bag? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert("Failed to delete bag");
                setDeleting(false);
            }
        } catch (e) {
            console.error(e);
            setDeleting(false);
        }
    };

    const handleDecision = async (requestId: string, decision: 'approve' | 'deny') => {
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/requests/decision`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, decision })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.uid !== requestId));
            } else {
                alert("Failed to process request");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-lg border border-zinc-200 dark:border-zinc-800 shadow-xl h-[550px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Bag Settings</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={clsx("pb-2 text-sm font-medium whitespace-nowrap", activeTab === 'general' ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500")}
                    > General </button>
                    {accessType === 'request' && (
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={clsx("pb-2 text-sm font-medium relative whitespace-nowrap", activeTab === 'requests' ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500")}
                        >
                            Access Requests
                            {requests.length > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{requests.length}</span>}
                        </button>
                    )}
                    {accessType === 'invite' && (
                        <button
                            onClick={() => setActiveTab('invite')}
                            className={clsx("pb-2 text-sm font-medium whitespace-nowrap", activeTab === 'invite' ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500")}
                        > Send Invites </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
                            <form onSubmit={handleSaveGeneral} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bag Name</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Access Type</label>
                                    <select
                                        value={accessType}
                                        onChange={e => setAccessType(e.target.value)}
                                        className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                                    >
                                        <option value="private">Private (Host Only)</option>
                                        <option value="invite">Invite Only</option>
                                        <option value="request">Request Access</option>
                                        <option value="public">Public (Everyone)</option>
                                    </select>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Note: Switching to a restricted mode will require guests to rejoin.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h4>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full border border-red-200 bg-red-50 dark:bg-red-900/10 text-red-600 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50"
                                >
                                    {deleting ? "Deleting..." : "Delete Bag"}
                                </button>
                            </div>
                        </div>
                    ) : activeTab === 'requests' ? (
                        <div className="space-y-4">
                            {loadingRequests ? (
                                <div className="text-center text-zinc-500 py-8">Loading requests...</div>
                            ) : requests.length === 0 ? (
                                <div className="text-center text-zinc-500 py-8">No pending requests</div>
                            ) : (
                                requests.map(req => (
                                    <div key={req.uid} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                        <div>
                                            <div className="font-medium text-sm">{req.email}</div>
                                            <div className="text-xs text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDecision(req.uid, 'deny')} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                <X size={16} />
                                            </button>
                                            <button onClick={() => handleDecision(req.uid, 'approve')} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Invite Tab
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">User Email</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="friend@example.com"
                                    required
                                    className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
                                />
                                <p className="text-xs text-zinc-500 mt-2">
                                    The user will receive an invite on their dashboard.
                                </p>
                            </div>
                            <button type="submit" disabled={sendingInvite} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                                {sendingInvite ? "Sending..." : "Send Invite"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function ShareModal({ bagId, onClose }: { bagId: string, onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const link = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Share Bag</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium">Access Rules:</p>
                        <ul className="list-disc ml-4 mt-1 opacity-90">
                            <li><strong>Hosts</strong> can always access.</li>
                            <li><strong>Guests</strong> need to be invited or the bag must be Public.</li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Bag Link</label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={link}
                                className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500"
                            />
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 min-w-[80px]"
                            >
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={onClose} className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
