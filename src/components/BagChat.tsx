
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Send, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type Message = {
    id: string;
    text: string;
    uid: string;
    email: string;
    createdAt: string;
};

export default function BagChat({ bagId }: { bagId: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState("");

    // Fetch Messages
    const fetchMessages = async () => {
        try {
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setError("");
            } else {
                // Don't show error on every poll if it just fails once
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // 3s polling
        return () => clearInterval(interval);
    }, [bagId, user]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const tempId = Date.now().toString();
        const tempMsg = {
            id: tempId,
            text: input,
            uid: user?.uid || "",
            email: user?.email || "",
            createdAt: new Date().toISOString()
        };

        // Optimistic UI
        setMessages(prev => [...prev, tempMsg]);
        setInput("");
        setSending(true);

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/bags/${bagId}/chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: tempMsg.text })
            });

            if (!res.ok) {
                setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert
                setError("Failed to send message");
            } else {
                // Background sync trigger (could be here or ensuring backend handles it)
                // Let's trigger sync occasionally or assume backend queues it? 
                // Plan said: "POST: Send message (Write to Firestore + Queue Sync to Drive)"
                // So backend handles it (mostly). 

                // We can trigger a hard sync if we want to be safe, but let's leave it to backend eventually.
                fetchMessages(); // Refresh to get real ID/Timestamp
            }
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setError("Error sending");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 backdrop-blur">
                <div className="flex items-center gap-2 text-zinc-700 font-bold">
                    <div className="p-2 bg-primary-green/10 text-primary-green rounded-lg">
                        <MessageSquare size={18} />
                    </div>
                    Bag Chat
                </div>
                {loading && <Loader2 size={14} className="animate-spin text-zinc-400" />}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 && !loading && (
                    <div className="text-center text-zinc-400 text-sm py-10">
                        No messages yet.<br />Start the conversation!
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                        const isMe = msg.uid === user?.uid;
                        const isConsecutive = i > 0 && messages[i - 1].uid === msg.uid;

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}
                            >
                                {!isConsecutive && !isMe && (
                                    <span className="text-[10px] text-zinc-400 mb-1 ml-1">{msg.email.split('@')[0]}</span>
                                )}
                                <div
                                    className={clsx(
                                        "px-4 py-2 max-w-[85%] text-sm rounded-2xl shadow-sm",
                                        isMe
                                            ? "bg-primary-green text-white rounded-br-none"
                                            : "bg-white border border-zinc-100 text-zinc-800 rounded-bl-none"
                                    )}
                                >
                                    {msg.text}
                                </div>
                                <span className="text-[9px] text-zinc-300 mt-1 mx-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-xs justify-center bg-red-50 p-2 rounded-lg">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-zinc-100 flex gap-2">
                <input
                    className="flex-1 bg-zinc-50 border border-zinc-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <button
                    disabled={!input.trim() || sending}
                    className="bg-primary-green text-white p-3 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:scale-95 transition-all shadow-md shadow-green-100"
                >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </form>
        </div>
    );
}
