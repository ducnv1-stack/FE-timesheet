"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists as seen in layout.tsx

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    const success = (message: string) => showToast(message, 'success');
    const error = (message: string) => showToast(message, 'error');
    const info = (message: string) => showToast(message, 'info');

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md pointer-events-none px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto transform transition-all duration-500 ease-out animate-in slide-in-from-top-12 fade-in",
                            "flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md bg-white/90",
                            {
                                "border-emerald-500/30 text-emerald-900 shadow-emerald-500/10": toast.type === 'success',
                                "border-primary-light/30 text-primary shadow-primary-light/10": toast.type === 'error',
                                "border-blue-500/30 text-blue-900 shadow-blue-500/10": toast.type === 'info',
                            }
                        )}
                    >
                        <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                            {
                                "bg-emerald-100 text-emerald-600": toast.type === 'success',
                                "bg-primary-subtle text-primary": toast.type === 'error',
                                "bg-blue-100 text-blue-600": toast.type === 'info',
                            }
                        )}>
                            {toast.type === 'success' && <CheckCircle size={20} strokeWidth={2.5} />}
                            {toast.type === 'error' && <AlertCircle size={20} strokeWidth={2.5} />}
                            {toast.type === 'info' && <Info size={20} strokeWidth={2.5} />}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-black leading-tight">
                                {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi hệ thống' : 'Thông báo'}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
