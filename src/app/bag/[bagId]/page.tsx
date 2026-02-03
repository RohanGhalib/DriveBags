"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUploads } from "@/components/UploadManager";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { File as FileIcon, UploadCloud, Folder, Search, ArrowLeft, UserPlus, X, Settings, ShieldAlert, Check, ChevronRight, LogOut, MoreVertical, ScanFace, Lock, Unlock, Mail, Loader2, User } from "lucide-react";
import Link from "next/link";
import ManageAccessPanel from "@/components/ManageAccessPanel";

import BagChat from "@/components/BagChat";
import { motion, PanInfo } from "framer-motion";

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

    // Mobile View State ('files' | 'chat')
    const [mobileView, setMobileView] = useState<'files' | 'chat'>('files');

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
                    hostUid: data.hostUid
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

    // Drag (File Drop) Handlers
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
        if (!user) return; // Should be handled by guard below
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

    // Swipe Handler for Mobile
    const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -50) {
            setMobileView('chat'); // Swipe Left -> Show Chat
        } else if (info.offset.x > 50) {
            setMobileView('files'); // Swipe Right -> Show Files
        }
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
        <motion.div
            className="h-screen bg-zinc-50 flex flex-col md:overflow-hidden" // Locked height for Chat flex
            onDragEnter={handleDrag}
            onPanEnd={handleSwipe} // Global swipe detection (mostly for mobile)
            style={{ touchAction: "pan-y" }} // Allow vertical scroll but capture horizontal
        >
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
            <header className="flex-none p-6 md:px-10 md:py-6 bg-white border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
                <div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-1">
                        <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">My Bags</Link>
                        <ChevronRight size={14} />
                        <span className="text-zinc-900">Contents</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight truncate max-w-[200px] md:max-w-md">
                            {bagMetadata?.name || 'Loading...'}
                        </h1>
                        {bagMetadata?.accessType && (
                            <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-wider border border-zinc-200">
                                {bagMetadata.accessType}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-full border border-zinc-100 whitespace-nowrap">
                        <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">
                            <User size={12} />
                        </div>
                        <span className="text-xs font-medium text-zinc-600">
                            {isHost ? 'You' : 'Host'}
                        </span>
                    </div>

                    <div className="h-6 w-[1px] bg-zinc-200 mx-1 hidden md:block" />

                    <button
                        onClick={() => setShowAccessPanel(true)}
                        className="bg-zinc-50 text-zinc-700 border border-zinc-200 p-2 md:px-4 md:py-2 rounded-xl font-bold hover:bg-zinc-100 transition-all flex items-center gap-2 shadow-sm"
                        title="Manage Access"
                    >
                        <Settings size={18} /> <span className="hidden md:inline">{isHost ? "Manage Access" : "Participants"}</span>
                    </button>

                    {!isHost && (
                        <button
                            onClick={handleLeave}
                            className="bg-white text-red-600 border border-zinc-200 p-2 md:px-4 md:py-2 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm"
                            title="Leave Bag"
                        >
                            <LogOut size={18} />
                        </button>
                    )}

                    <label className="cursor-pointer bg-primary-green text-white px-4 py-2 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-green-200 flex items-center gap-2 whitespace-nowrap">
                        <UploadCloud size={20} />
                        <span className="hidden md:inline">Upload</span>
                        <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                    </label>
                </div>
            </header>

            {/* Mobile View Toggle */}
            <div className="md:hidden flex border-b border-zinc-200 bg-white">
                <button
                    onClick={() => setMobileView('files')}
                    className={clsx("flex-1 py-3 text-sm font-bold border-b-2 transition-colors", mobileView === 'files' ? "border-primary-green text-primary-green" : "border-transparent text-zinc-400")}
                >
                    Files
                </button>
                <button
                    onClick={() => setMobileView('chat')}
                    className={clsx("flex-1 py-3 text-sm font-bold border-b-2 transition-colors", mobileView === 'chat' ? "border-primary-green text-primary-green" : "border-transparent text-zinc-400")}
                >
                    Chat
                </button>
            </div>

            {/* Content Area (Split View) */}
            <div className="flex-1 overflow-hidden relative flex">

                {/* Files Pane */}
                <div className={clsx(
                    "w-full h-full md:w-2/3 lg:w-3/4 flex flex-col transition-transform duration-300 absolute md:relative",
                    mobileView === 'files' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    {loadingFiles ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary-green animate-spin" />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
                            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden min-h-[300px]">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50/50 border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                                        <tr>
                                            <th className="p-4 w-12"></th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4 w-24 hidden sm:table-cell">Size</th>
                                            <th className="p-4 w-16 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {files.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-10 text-center">
                                                    <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-300 mx-auto mb-3">
                                                        <Folder size={24} />
                                                    </div>
                                                    <h3 className="text-zinc-900 font-bold text-sm">Empty Bag</h3>
                                                    <p className="text-zinc-400 text-xs mt-1">Upload files to share.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            files.map((file) => (
                                                <tr key={file.id} className="group hover:bg-zinc-50/80 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        {file.mimeType.includes('folder') ?
                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400">
                                                                <Folder size={16} fill="currentColor" className="opacity-80" />
                                                            </div> :
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                                <FileIcon size={16} />
                                                            </div>
                                                        }
                                                    </td>
                                                    <td className="p-4 font-medium text-zinc-700 text-sm group-hover:text-zinc-900 truncate max-w-[150px] sm:max-w-none">
                                                        <a href={file.webViewLink} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary-green transition-colors block truncate">
                                                            {file.name}
                                                        </a>
                                                    </td>
                                                    <td className="p-4 text-xs text-zinc-400 font-medium font-mono hidden sm:table-cell">
                                                        {file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : '-'}
                                                    </td>
                                                    <td className="p-4 text-right pr-6">
                                                        <a
                                                            href={file.webViewLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-primary-green hover:bg-green-50 transition-all"
                                                        >
                                                            <ScanFace size={16} />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Pane */}
                <div className={clsx(
                    "w-full h-full md:w-1/3 lg:w-1/4 bg-white border-l border-zinc-100 flex flex-col transition-transform duration-300 absolute md:relative right-0",
                    mobileView === 'chat' ? "translate-x-0" : "translate-x-full md:translate-x-0"
                )}>
                    <BagChat bagId={bagId} />
                </div>
            </div>

            {/* Manage Access Panel */}
            <ManageAccessPanel
                bagId={bagId}
                currentAccessType={bagMetadata?.accessType || 'private'}
                isOpen={showAccessPanel}
                onClose={() => setShowAccessPanel(false)}
                onUpdate={fetchFiles}
                isHost={isHost}
            />
        </motion.div>
    );
}
