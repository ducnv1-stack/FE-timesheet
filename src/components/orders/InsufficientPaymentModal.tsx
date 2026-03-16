"use client";

import React from 'react';
import { AlertTriangle, X, ArrowRight, Wallet, Receipt, Calculator } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface InsufficientPaymentModalProps {
    isOpen: boolean;
    order: any;
    onClose: () => void;
    onViewDetails: () => void;
}

export default function InsufficientPaymentModal({
    isOpen,
    order,
    onClose,
    onViewDetails
}: InsufficientPaymentModalProps) {
    if (!isOpen || !order) return null;

    const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const totalAmount = Number(order.totalAmount);
    const remaining = totalAmount - totalPaid;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative p-8 flex flex-col items-center text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-20 h-20 rounded-2xl bg-primary-subtle flex items-center justify-center mb-6 shadow-sm border border-primary-subtle relative group overflow-hidden">
                        <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
                        <AlertTriangle size={40} className="text-primary-light animate-bounce" />
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Chưa thanh toán đủ!</h3>
                    <p className="text-slate-500 text-sm mt-2 font-medium">
                        Hệ thống không thể xác nhận đơn hàng khi số tiền thực tế chưa khớp với giá trị hóa đơn.
                    </p>
                </div>

                {/* Financial Breakdown Card */}
                <div className="px-8 pb-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-slate-600">
                                <Receipt size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Tổng đơn hàng</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">{formatCurrency(totalAmount)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-emerald-600">
                                <Wallet size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Đã thanh toán</span>
                            </div>
                            <span className="text-sm font-black text-emerald-600">{formatCurrency(totalPaid)}</span>
                        </div>

                        <div className="h-px bg-slate-200"></div>

                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2.5 text-primary">
                                <Calculator size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">Cần thu thêm</span>
                            </div>
                            <span className="text-lg font-black text-primary">
                                {formatCurrency(remaining)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="px-8 pb-8">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                onViewDetails();
                            }}
                            className="group w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:bg-primary hover:shadow-primary/30 transition-all active:scale-[0.98]"
                        >
                            ĐIỀU CHỈNH THANH TOÁN
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-white text-slate-500 hover:text-slate-800 rounded-2xl font-bold text-sm transition-all border border-transparent hover:border-slate-200"
                        >
                            Đóng lại
                        </button>
                    </div>
                </div>

                {/* Bottom accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary-light via-primary to-primary-light"></div>
            </div>
        </div>
    );
}
