"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUploads } from "@/components/UploadManager";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { File as FileIcon, UploadCloud, Folder, Search, ArrowLeft, UserPlus, X, Settings, ShieldAlert, Check, ChevronRight, LogOut, MoreVertical, ScanFace, Lock, Unlock, Mail, Loader2, User } from "lucide-react";
import Link from "next/link";
import ManageAccessPanel from "@/components/ManageAccessPanel";

export default function BagPage() {
    const { bagId }: { bagId: string } = useParams();
    const router = useRouter();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const { uploadFile } = useUploads();

    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [showAccessPanel, setShowAccessPanel] = useState(false);
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
                    accessType: data.accessType,
                    hostUid: data.hostUid // potentially useful
                });
            } else {
                const errorData = await res.json();
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

    // Drag handlers
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

    if (authLoading) return <div className="flex h-screen items-center justify-center text-primary-green"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-zinc-50">
                <div className="bg-white p-10 rounded-3xl shadow-xl shadow-zinc-200 border border-zinc-100 max-w-md w-full">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary-green/10 flex items-center justify-center text-primary-green">
                            <Lock size={32} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-zinc-900">Login Required</h1>
                    <p className="text-zinc-500 mb-8">You need to align your chakras (and sign in) to access this bag.</p>
                    <button
                        onClick={() => signInWithGoogle()}
                        className="w-full bg-primary-green text-white py-3.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-green-200"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    if (accessError) {
        const canRequest = bagMetadata?.accessType === 'request';
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-zinc-50">
                <div className="bg-white p-10 rounded-3xl shadow-xl shadow-zinc-200 border border-zinc-100 max-w-md w-full">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                            <ShieldAlert size={32} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-zinc-900">Access Denied</h1>
                    <p className="text-zinc-500 mb-8">
                        You do not have permission to view <strong>{bagMetadata?.bagName || 'this bag'}</strong>.
                    </p>

                    {canRequest ? (
                        <div className="w-full">
                            <button
                                onClick={handleRequestAccess}
                                disabled={requesting}
                                className="w-full bg-primary-green text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {requesting ? "Sending Pulse..." : "Request Access"}
                            </button>
                            <p className="text-xs text-zinc-400 mt-4">
                                This bag requires approval from the host.
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-zinc-50 rounded-xl text-sm text-zinc-600 mb-4 border border-zinc-100">
                            {bagMetadata?.accessType === 'invite' ?
                                "This bag is Invite Only. Ask the host to send you an invite." :
                                "This bag is Private. You must be the host to view it."
                            }
                        </div>
                    )}
                    <Link href="/dashboard" className="mt-6 block text-zinc-400 hover:text-zinc-900 text-sm font-medium transition-colors">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-6 md:p-10 text-zinc-900" onDragEnter={handleDrag}>
            {/* Drag Overlay */}
            {dragActive && (
                <div
                    className="fixed inset-0 bg-primary-green/90 backdrop-blur-md z-[100] flex items-center justify-center border-8 border-white m-6 rounded-3xl animate-in fade-in duration-200"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="text-4xl font-bold text-white flex flex-col items-center gap-4">
                        <UploadCloud size={64} />
                        Drop files to upload
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-1">
                        <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">My Bags</Link>
                        <ChevronRight size={14} />
                        <span className="text-zinc-900">Contents</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{bagMetadata?.name || 'Loading...'}</h1>
                        {/* Access Badge */}
                        {bagMetadata?.accessType && (
                            <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-wider border border-zinc-200">
                                {bagMetadata.accessType}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">

                    {/* Host Avatar (Mock) */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-zinc-100 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <User size={14} />
                        </div>
                        <span className="text-xs font-medium text-zinc-600">
                            {isHost ? 'Hosted by You' : 'Host'}
                        </span>
                    </div>

                    <div className="h-8 w-[1px] bg-zinc-200 mx-2 hidden md:block" />

                    <button
                        onClick={() => setShowAccessPanel(true)}
                        className="bg-white text-zinc-700 border border-zinc-200 px-4 py-2.5 rounded-xl font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Settings size={18} /> {isHost ? "Manage Access" : "Participants"}
                    </button>

                    {!isHost && (
                        <button
                            onClick={handleLeave}
                            className="bg-white text-red-600 border border-zinc-200 px-4 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <LogOut size={18} />
                        </button>
                    )}

                    <label className="cursor-pointer bg-primary-green text-white px-5 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-green-200 flex items-center gap-2">
                        <UploadCloud size={20} />
                        <span>Upload File</span>
                        <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                    </label>
                </div>
            </header>

            {/* File Table */}
            {loadingFiles ? (
                <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center shadow-sm">
                    <Loader2 className="w-8 h-8 text-primary-green animate-spin mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">Fetching contents...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                            <tr>
                                <th className="p-5 pl-8 w-16">Type</th>
                                <th className="p-5">Name</th>
                                <th className="p-5 w-48">Size</th>
                                <th className="p-5 w-32 text-right pr-8">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 mx-auto mb-4">
                                            <Folder size={32} />
                                        </div>
                                        <h3 className="text-zinc-900 font-bold mb-1">It's quiet in here</h3>
                                        <p className="text-zinc-500 text-sm">Upload a file to get the party started.</p>
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr key={file.id} className="group hover:bg-zinc-50/80 transition-colors">
                                        <td className="p-5 pl-8">
                                            {file.mimeType.includes('folder') ?
                                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400">
                                                    <Folder size={20} fill="currentColor" className="opacity-80" />
                                                </div> :
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                    <FileIcon size={20} />
                                                </div>
                                            }
                                        </td>
                                        <td className="p-5 font-medium text-zinc-700 group-hover:text-zinc-900">
                                            <a href={file.webViewLink} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary-green transition-colors">
                                                {file.name}
                                            </a>
                                        </td>
                                        <td className="p-5 text-sm text-zinc-400 font-medium font-mono">
                                            {file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : '-'}
                                        </td>
                                        <td className="p-5 text-right pr-8">
                                            <a
                                                href={file.webViewLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-primary-green hover:bg-green-50 transition-all"
                                                title="Open File"
                                            >
                                                <ScanFace size={18} />
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Manage Access Panel */}
            <ManageAccessPanel
                bagId={bagId}
                currentAccessType={bagMetadata?.accessType || 'private'}
                isOpen={showAccessPanel}
                onClose={() => setShowAccessPanel(false)}
                onUpdate={fetchFiles}
                isHost={isHost}
            />
        </div>
    );
}
