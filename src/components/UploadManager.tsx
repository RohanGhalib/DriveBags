"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";
import clsx from 'clsx';
import { useAuth } from "@/context/AuthContext";

// Types
export interface UploadTask {
    id: string;
    file: File;
    bagId: string;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    speed?: string; // e.g. "1.2 MB/s"
    error?: string;
}

interface UploadContextType {
    tasks: UploadTask[];
    uploadFile: (file: File, bagId: string) => void;
    minimized: boolean;
    toggleMinimize: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUploads = () => {
    const context = useContext(UploadContext);
    if (!context) throw new Error("useUploads must be used within UploadProvider");
    return context;
};

export const UploadProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<UploadTask[]>([]);
    const [minimized, setMinimized] = useState(false);
    const { user } = useAuth();

    const toggleMinimize = () => setMinimized((prev) => !prev);

    const uploadFile = async (file: File, bagId: string) => {
        const taskId = Math.random().toString(36).substring(7);
        const newTask: UploadTask = {
            id: taskId,
            file,
            bagId,
            progress: 0,
            status: 'pending'
        };

        setTasks((prev) => [newTask, ...prev]);

        // Start Upload
        try {
            setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: 'uploading' } : t));

            const token = await user?.getIdToken();
            if (!token) throw new Error("Not authenticated");

            // Use XMLHttpRequest for progress tracking since fetch doesn't support upload progress easily
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `/api/upload/proxy?bagId=${bagId}&filename=${encodeURIComponent(file.name)}&mimeType=${encodeURIComponent(file.type)}`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            // Not setting Content-Type, let browser set it? No, if we send raw body (file), current implementation expects raw.
            // But passing 'file' to send() usually sends as binary. 
            // Important: Current API expects RAW BODY.
            // xhr.setRequestHeader('Content-Type', file.type); // Optional

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = (event.loaded / event.total) * 100;
                    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, progress: percent } : t));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t));
                } else {
                    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: xhr.statusText } : t));
                }
            };

            xhr.onerror = () => {
                setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: 'Network Error' } : t));
            };

            xhr.send(file);

        } catch (error: any) {
            setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: error.message } : t));
        }
    };

    return (
        <UploadContext.Provider value={{ tasks, uploadFile, minimized, toggleMinimize }}>
            {children}
            {/* Global Upload Widget */}
            {tasks.length > 0 && <UploadWidget tasks={tasks} minimized={minimized} toggleMinimize={toggleMinimize} />}
        </UploadContext.Provider>
    );
};

// Simple Widget UI
const UploadWidget = ({ tasks, minimized, toggleMinimize }: { tasks: UploadTask[], minimized: boolean, toggleMinimize: () => void }) => {
    const activeTasks = tasks.filter(t => t.status === 'uploading' || t.status === 'pending');
    const finishedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'error');

    // Clean up finished tasks automatically or show them? Show for a bit.

    return (
        <div className={clsx(
            "fixed bottom-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg overflow-hidden transition-all duration-300 w-80 z-50",
            minimized ? "h-12" : "max-h-96"
        )}>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 flex justify-between items-center cursor-pointer" onClick={toggleMinimize}>
                <span className="font-medium text-sm">Uploads ({activeTasks.length})</span>
                <div className="flex gap-2">
                    {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </div>
            </div>

            {!minimized && (
                <div className="p-4 space-y-3 overflow-y-auto max-h-80">
                    {tasks.map((task) => (
                        <div key={task.id} className="text-xs">
                            <div className="flex justify-between mb-1">
                                <span className="truncate max-w-[150px] font-medium">{task.file.name}</span>
                                <span className={clsx(
                                    task.status === 'error' ? 'text-red-500' :
                                        task.status === 'completed' ? 'text-green-500' : 'text-zinc-500'
                                )}>{task.status === 'uploading' ? `${Math.round(task.progress)}%` : task.status}</span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={clsx("h-full transition-all duration-300",
                                        task.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                                    )}
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
