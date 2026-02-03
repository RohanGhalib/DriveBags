"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Check, Info, Mail, Shield, ShieldAlert, Trash2 } from 'lucide-react';
import clsx from 'clsx';

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

type Notification = {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: any;
    metadata?: any;
};

type NotificationsPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange: (count: number) => void;
};

export default function NotificationsPanel({ isOpen, onClose, onUnreadCountChange }: NotificationsPanelProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, isOpen]); // Refetch when opened

    useEffect(() => {
        const unread = notifications.filter(n => !n.read).length;
        onUnreadCountChange(unread);
    }, [notifications]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/user/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const markAsRead = async (ids: string[]) => {
        if (!user || ids.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));

        try {
            const token = await user.getIdToken();
            await fetch('/api/user/notifications', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds: ids })
            });
        } catch (e) { console.error(e); }
    }

    const handleMarkAllRead = () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        markAsRead(unreadIds);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invite_received': return <Mail size={16} className="text-blue-500" />;
            case 'invite_accepted': return <Check size={16} className="text-green-500" />;
            case 'request_received': return <Shield size={16} className="text-amber-500" />;
            case 'request_approved': return <Check size={16} className="text-primary-green" />;
            case 'kicked': return <ShieldAlert size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-zinc-400" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div ref={panelRef} className="absolute top-16 right-4 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-50 bg-zinc-50/50">
                <h3 className="font-bold text-zinc-900">Notifications</h3>
                <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-primary-green hover:text-green-700 disabled:opacity-50"
                    disabled={notifications.every(n => n.read)}
                >
                    Mark all as read
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
                {loading && notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-sm flex flex-col items-center gap-2">
                        <Bell size={24} className="opacity-20" />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-50">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={clsx(
                                    "p-4 flex gap-3 hover:bg-zinc-50 transition-colors",
                                    !notification.read && "bg-green-50/30"
                                )}
                                onClick={() => !notification.read && markAsRead([notification.id])}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    !notification.read ? "bg-white shadow-sm ring-1 ring-zinc-100" : "bg-zinc-100"
                                )}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={clsx("text-sm text-zinc-700", !notification.read && "font-medium text-zinc-900")}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {notification.createdAt ? formatTimeAgo(new Date(notification.createdAt._seconds * 1000)) : 'Just now'}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-primary-green shrink-0 mt-1.5" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
