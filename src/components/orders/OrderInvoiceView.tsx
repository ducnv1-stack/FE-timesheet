"use client";

import { Printer, X, Edit3, Gift, ArrowUpCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import InvoicePaper from './InvoicePaper';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderInvoiceViewProps {
    order: any;
    onBack?: () => void;
}

export default function OrderInvoiceView({ order, onBack }: OrderInvoiceViewProps) {
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const totalProductAmount = Number(order.totalAmount || 0);
    const giftAmount = Number(order.giftAmount || 0);
    const netRevenue = totalProductAmount - giftAmount;
    const paidAmount = (order.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const remainingAmount = totalProductAmount - paidAmount;

    // Delivery helpers
    const driverDelivery = order.deliveries?.find((d: any) => d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER');
    const staffDelivery = order.deliveries?.find((d: any) => d.role === 'STAFF' || d.category === 'STAFF_DELIVERER' || d.category === 'SELLING_SALE' || d.category === 'OTHER_SALE');
    const totalDeliveryFee = (order.deliveries || []).reduce((s: number, d: any) => s + Number(d.deliveryFee || 0), 0);

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'COMPANY_DRIVER': return 'Lái xe công ty';
            case 'EXTERNAL_DRIVER': return 'Lái xe ngoài';
            case 'STAFF_DELIVERER': return 'NV Giao hàng';
            case 'SELLING_SALE': return 'Sale (người bán)';
            case 'OTHER_SALE': return 'Sale (giao hộ)';
            default: return cat;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered': return { text: '✅ Đã giao', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'assigned': return { text: '🚗 Đang giao', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
            default: return { text: '⏳ Chờ giao', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
        }
    };

    const statusBadge = getStatusBadge(order.status);

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 print:shadow-none print:border-none print:rounded-none print:overflow-visible">
            {/* Action Bar */}
            <div className="bg-slate-900 px-3 md:px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 no-print rounded-t-2xl">
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                            <Printer size={16} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xs">Xem chi tiết hóa đơn</h3>
                            <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">#{order.id.substring(0, 8)}</p>
                        </div>
                    </div>
                    {/* Mode X ra đây trên mobile */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-8 h-8 flex md:hidden items-center justify-center bg-white/10 hover:bg-primary text-white rounded-lg transition-all cursor-pointer shrink-0"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                    {(() => {
                        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                        const user = storedUser ? JSON.parse(storedUser) : null;
                        const userRole = user ? (typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role) : '';
                        if (userRole === 'DRIVER' || userRole === 'DIRECTOR' || userRole === 'DELIVERY_STAFF') return null;

                        const canEditConfirmed = ['ADMIN', 'DIRECTOR', 'MANAGER', 'CHIEF_ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'ACCOUNTANT'].includes(userRole);
                        
                        return (
                            <>
                                {(!order.isUpgrade) && (
                                    <button
                                        onClick={() => router.push(`/orders/upgrade?from=${order.id}`)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-subtle hover:bg-primary-subtle text-primary border border-primary-subtle rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm flex-1 md:flex-none whitespace-nowrap"
                                    >
                                        <ArrowUpCircle size={13} /> Nâng cấp đơn
                                    </button>
                                )}

                                {order.isPaymentConfirmed && !canEditConfirmed ? (
                                    <button
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-300 text-slate-500 rounded-lg text-[11px] font-bold cursor-not-allowed flex-1 md:flex-none whitespace-nowrap"
                                        title="Đơn hàng đã được xác nhận, bạn không có quyền sửa."
                                    >
                                        <Edit3 size={13} /> Sửa hóa đơn
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => router.push(`/orders/edit/${order.id}`)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex-1 md:flex-none whitespace-nowrap"
                                    >
                                        <Edit3 size={13} /> Sửa hóa đơn
                                    </button>
                                )}
                            </>
                        );
                    })()}
                    <button
                        onClick={() => window.print()}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex-1 md:flex-none whitespace-nowrap"
                    >
                        <Printer size={13} /> In hóa đơn
                    </button>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="hidden md:flex w-8 h-8 items-center justify-center bg-white/10 hover:bg-primary text-white rounded-lg transition-all cursor-pointer shrink-0"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Invoice Content */}
            <div className="p-4 md:p-6 bg-[#fafafa] flex justify-center print:p-0 print:bg-white">
                <InvoicePaper order={order} />
            </div>
        </div>
    );
}
