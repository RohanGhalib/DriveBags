'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Search, Bell, User } from 'lucide-react';
import { useState } from 'react';
import NotificationsPanel from './NotificationsPanel';

export default function Navbar() {
    const { user, signInWithGoogle, logout } = useAuth();
    const pathname = usePathname();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Don't render navbar on landing page (it has its own)
    if (pathname === '/') return null;

    return (
        <nav className="h-16 border-b border-zinc-100 bg-white flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-green flex items-center justify-center text-white font-bold text-lg">
                    DB
                </div>
                <span className="text-xl font-bold tracking-tight text-zinc-900">
                    Drive<span className="text-primary-green">Bags</span>
                </span>
            </Link>

            {/* Center Search (Optional/Future) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search bags, files, people..."
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-full transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            <NotificationsPanel
                                isOpen={showNotifications}
                                onClose={() => setShowNotifications(false)}
                                onUnreadCountChange={setUnreadCount}
                            />
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-9 h-9 rounded-full overflow-hidden border border-zinc-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary-green transition-all"
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <div className="px-4 py-3 border-b border-zinc-50">
                                        <p className="text-sm font-medium text-zinc-900 truncate">{user.displayName}</p>
                                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => signInWithGoogle()}
                        className="text-sm font-medium text-zinc-600 hover:text-primary-green transition-colors"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
