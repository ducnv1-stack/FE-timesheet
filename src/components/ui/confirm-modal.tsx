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
                <div className="p-6 flex flex-col items-center text-center bg-primary-light">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110",
                        isDanger ? "bg-primary-light text-primary border border-primary/20" : "bg-primary-light/80 text-primary/80"
                    )}>
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{title}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-600 text-center leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 bg-slate-50 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <X size={18} />
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer bg-primary hover:bg-primary/90 shadow-primary-light/50"
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
