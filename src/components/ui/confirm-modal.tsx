"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    onConfirm,
    onCancel,
    isDanger = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="p-6 flex flex-col items-center text-center bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/20 text-white backdrop-blur-sm shadow-xl">
                        <AlertTriangle size={36} className="animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-600 text-center leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 bg-slate-50 flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                        <X size={18} />
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
