"use client";

import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    onConfirm,
    onCancel,
    isDanger = false,
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={!isLoading ? onCancel : undefined}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className={cn(
                    "p-6 flex flex-col items-center text-center bg-gradient-to-r",
                    isDanger ? "from-rose-600 to-rose-700" : "from-blue-600 to-indigo-600"
                )}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/20 text-white backdrop-blur-sm shadow-xl">
                        {isLoading ? (
                            <Loader2 size={36} className="animate-spin text-white" />
                        ) : (
                            <AlertTriangle size={36} className="animate-pulse" />
                        )}
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-slate-600 text-center leading-relaxed">
                        {message}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-slate-50 flex gap-4">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={18} />
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 px-4 py-3 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
                            isDanger 
                                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                        )}
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {isLoading ? 'Đang xử lý...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
