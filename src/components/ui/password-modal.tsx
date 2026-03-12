"use client";

import React, { useState } from 'react';
import { Lock, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (password: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function PasswordModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Xác thực',
    cancelLabel = 'Hủy',
    onConfirm,
    onCancel,
    isLoading = false
}: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Reset password when modal opens or closes
    React.useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setShowPassword(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim()) {
            onConfirm(password);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 font-outfit"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="p-8 flex flex-col items-center text-center bg-primary-light/50">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary text-white flex items-center justify-center mb-6 shadow-xl shadow-primary-light rotate-3 transform transition-transform hover:rotate-0">
                        <Lock size={36} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
                    <p className="text-slate-500 mt-2 font-medium px-4">
                        {message}
                    </p>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Mật khẩu xác nhận</label>
                        <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setPassword('');
                                onCancel();
                            }}
                            disabled={isLoading}
                            className="flex-1 px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 font-black uppercase tracking-tighter rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            <X size={20} />
                            {cancelLabel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !password.trim()}
                            className="flex-1 px-6 py-4 bg-slate-900 text-white font-black uppercase tracking-tighter rounded-2xl shadow-xl shadow-slate-200 hover:bg-primary hover:shadow-primary-light/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                            {confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
