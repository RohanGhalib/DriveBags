"use client";

import { useState, useEffect } from "react";
import { X, Check, Globe, Lock, Mail, Shield, Trash2, User, Copy } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type ManageAccessPanelProps = {
    bagId: string;
    currentAccessType: 'private' | 'public' | 'invite' | 'request';
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Refresh parent data
    isHost: boolean;
};

export default function ManageAccessPanel({ bagId, currentAccessType, isOpen, onClose, onUpdate, isHost }: ManageAccessPanelProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'people' | 'settings'>('people');
    const [accessType, setAccessType] = useState(currentAccessType);
    const [inviteEmail, setInviteEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Sync prop state
    useEffect(() => {
        setAccessType(currentAccessType);
    }, [currentAccessType]);

    // Fetch Requests & Invites & Participants
    useEffect(() => {
        if (isOpen && activeTab === 'people') {
            fetchParticipants();
            if (isHost) {
                fetchRequests();
                fetchInvites();
            }
        }
    }, [isOpen, activeTab, isHost]);

    const fetchParticipants = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/bags/${bagId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out host from invitedEmails if needed, but usually host is separate in bag logic.
                // Assuming invitedEmails are the *other* participants.
                setParticipants(data.invitedEmails || []);
            }
        } catch (e) { console.error(e); }
    }

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchInvites = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/invites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInvites(data.invites || []);
            }
        } catch (e) { console.error(e); }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setSending(true);
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
                fetchInvites(); // Refresh list
            } else {
                const d = await res.json();
                alert("Failed: " + d.error);
            }
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessType }) // Only updating access type here
            });
            if (res.ok) {
                alert("Settings updated!");
                onUpdate();
            } else {
                alert("Failed to update settings");
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
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
                fetchParticipants(); // Update list if approved
            }
        } catch (e) { console.error(e); }
    };

    const copyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        }
    }

    const handleCancelInvite = async (inviteId: string) => {
        if (!confirm("Cancel this invitation?")) return;
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/invite/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId })
            });

            if (res.ok) {
                setInvites(prev => prev.filter(inv => inv.id !== inviteId));
            } else {
                alert("Failed to cancel invite");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleKick = async (email: string) => {
        if (!confirm(`Are you sure you want to remove ${email} from this bag?`)) return;
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/participant`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                setParticipants(prev => prev.filter(p => p !== email));
                onUpdate(); // Refresh parent to potentially update UI
            } else {
                alert("Failed to remove participant");
            }
        } catch (e) { console.error(e); }
    }

    const handleDeleteBag = async () => {
        if (!confirm("Are you ABSOLUTELY SURE? This will permanently delete the bag and all files. This cannot be undone.")) return;

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
                const d = await res.json();
                alert("Failed to delete bag: " + d.error);
                setDeleting(false);
            }
        } catch (e) {
            console.error(e);
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <h2 className="text-xl font-bold text-zinc-900">{isHost ? "Manage Access" : "Participants"}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-zinc-100 px-6">
                    <button
                        onClick={() => setActiveTab('people')}
                        className={clsx("py-3 text-sm font-medium border-b-2 mr-6", activeTab === 'people' ? "border-primary-green text-primary-green" : "border-transparent text-zinc-500")}
                    >
                        People {isHost && "& Invites"}
                    </button>
                    {isHost && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={clsx("py-3 text-sm font-medium border-b-2", activeTab === 'settings' ? "border-primary-green text-primary-green" : "border-transparent text-zinc-500")}
                        >
                            General Settings
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeTab === 'people' ? (
                        <>
                            {/* Copy Link Section */}
                            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-zinc-600">
                                    <Globe size={18} />
                                    <span className="text-sm font-medium">Share link to this bag</span>
                                </div>
                                <button onClick={copyLink} className="text-xs font-semibold text-primary-green hover:text-green-700 flex items-center gap-1">
                                    <Copy size={14} /> Copy Link
                                </button>
                            </div>

                            {/* Invite Section (Host Only) */}
                            {isHost && (
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3">Invite People via Email</h3>
                                    <form onSubmit={handleInvite} className="flex gap-2 mb-4">
                                        <input
                                            type="email"
                                            required
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary-green/20 focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className="bg-primary-green text-white px-4 py-2 rounded-lg font-medium hover:brightness-110 disabled:opacity-50"
                                        >
                                            Invite
                                        </button>
                                    </form>

                                    {/* Sent Invites List */}
                                    {invites.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pending Invites</h4>
                                            {invites.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg text-sm group">
                                                    <div className="flex items-center gap-2 text-zinc-700">
                                                        <Mail size={14} />
                                                        <span>{inv.toEmail}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-orange-500 font-medium">Pending</span>
                                                        <button
                                                            onClick={() => handleCancelInvite(inv.id)}
                                                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Cancel Invite"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pending Requests (Host Only) */}
                            {isHost && requests.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                                        <Shield size={16} className="text-amber-500" />
                                        Pending Access Requests
                                    </h3>
                                    <div className="space-y-2">
                                        {requests.map(req => (
                                            <div key={req.uid} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                <div>
                                                    <div className="font-medium text-amber-900 text-sm">{req.email}</div>
                                                    <div className="text-xs text-amber-600">Requested Access</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleDecision(req.uid, 'deny')} className="p-1.5 bg-white text-red-500 rounded shadow-sm hover:bg-red-50">
                                                        <X size={14} />
                                                    </button>
                                                    <button onClick={() => handleDecision(req.uid, 'approve')} className="p-1.5 bg-white text-green-600 rounded shadow-sm hover:bg-green-50">
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* People List */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 mb-3">Participants</h3>
                                <div className="space-y-4">
                                    {/* Host */}
                                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-xs ring-4 ring-white">
                                            {isHost ? "Me" : "H"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{isHost ? "You (Host)" : "Host"}</div>
                                            <div className="text-xs text-zinc-500">Owner</div>
                                        </div>
                                    </div>

                                    {/* Other Participants */}
                                    {participants.map((email: string) => (
                                        <div key={email} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-lg transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs">
                                                    {email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-zinc-900">{email}</div>
                                                    <div className="text-xs text-zinc-500">Member</div>
                                                </div>
                                            </div>
                                            {isHost && (
                                                <button
                                                    onClick={() => handleKick(email)}
                                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Kick Participant"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {participants.length === 0 && (
                                        <div className="text-center py-6 text-zinc-400 text-xs italic">
                                            No other participants yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* Settings Tab - Host Only */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 mb-3">General Access</h3>
                                <div className="space-y-3">
                                    <AccessRadio
                                        id="private"
                                        title="Private"
                                        desc="Only you and invited members can access."
                                        icon={Lock}
                                        checked={accessType === 'private'}
                                        onChange={() => setAccessType('private')}
                                    />
                                    <AccessRadio
                                        id="invite"
                                        title="Invite Only"
                                        desc="Only people invited can access."
                                        icon={Mail}
                                        checked={accessType === 'invite'}
                                        onChange={() => setAccessType('invite')}
                                    />
                                    <AccessRadio
                                        id="request"
                                        title="Request Access"
                                        desc="People can request access. You approve them."
                                        icon={Shield}
                                        checked={accessType === 'request'}
                                        onChange={() => setAccessType('request')}
                                    />
                                    <AccessRadio
                                        id="public"
                                        title="Public"
                                        desc="Anyone with the link can view."
                                        icon={Globe}
                                        checked={accessType === 'public'}
                                        onChange={() => setAccessType('public')}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={saving || accessType === currentAccessType}
                                className="w-full py-3 bg-primary-green text-white rounded-xl font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving Changes..." : "Update Access Settings"}
                            </button>

                            <hr className="border-zinc-100" />

                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h3>
                                <p className="text-xs text-zinc-500 mb-4">Permanently delete this bag and all its contents. This action cannot be undone.</p>
                                <button
                                    onClick={handleDeleteBag}
                                    disabled={deleting}
                                    className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    {deleting ? "Deleting..." : "Delete Bag"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



function AccessRadio({ id, title, desc, icon: Icon, checked, onChange }: any) {
    return (
        <label
            className={clsx(
                "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                checked ? "border-primary-green bg-green-50 ring-1 ring-primary-green" : "border-zinc-200 hover:bg-zinc-50"
            )}
        >
            <div className={clsx("mt-0.5 p-1.5 rounded-md", checked ? "bg-primary-green text-white" : "bg-zinc-100 text-zinc-500")}>
                <Icon size={16} />
            </div>
            <div className="flex-1">
                <div className={clsx("text-sm font-bold", checked ? "text-primary-green" : "text-zinc-900")}>{title}</div>
                <div className="text-xs text-zinc-500">{desc}</div>
            </div>
            <input type="radio" name="accessType" value={id} checked={checked} onChange={onChange} className="mt-1 accent-primary-green" />
        </label>
    );
}
