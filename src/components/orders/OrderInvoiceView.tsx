"use client";

import { Printer, X, Download, Share2, Edit3 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
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

    const totalAmount = Number(order.totalAmount);
    const isInstallment = order.payments?.some((p: any) => p.paymentMethod === 'INSTALLMENT');

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Action Bar */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
                        <Printer size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Xem chi tiết hóa đơn</h3>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">#{order.id.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {(() => {
                        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                        const user = storedUser ? JSON.parse(storedUser) : null;
                        const userRole = user ? (typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role) : '';
                        if (userRole === 'DRIVER') return null;

                        return (
                            <button
                                onClick={() => router.push(`/orders/edit/${order.id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer"
                            >
                                <Edit3 size={16} /> Sửa hóa đơn
                            </button>
                        );
                    })()}
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer"
                    >
                        <Printer size={16} /> In hóa đơn
                    </button>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-rose-600 text-white rounded-lg transition-all cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Invoice Content */}
            <div className="p-8 md:p-12 bg-[#fafafa] min-h-[800px] flex justify-center">
                <div id="invoice-paper" className="w-full max-w-[210mm] bg-white shadow-2xl shadow-slate-200 border border-slate-100 p-10 relative overflow-hidden print:shadow-none print:border-none print:p-0">
                    {/* Brand Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-4">
                            <img src="/logo.png" alt="Ohari Logo" className="h-12 w-auto object-contain" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Công ty TNHH OHARI Việt Nam</p>
                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                                    {order.branch?.address || order.branch?.name || 'Chi nhánh Ohari'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">Hóa đơn</h1>
                            <p className={cn(
                                "font-black text-sm uppercase tracking-widest",
                                isInstallment ? (order.isPaymentConfirmed ? "text-emerald-600" : "text-amber-500") : "text-emerald-600"
                            )}>
                                {isInstallment ? (order.isPaymentConfirmed ? "Đã khớp tiền" : "Chờ thu tiền") : "Đã ghi nhận DS"}
                            </p>
                        </div>
                    </div>

                    {/* Header Decoration */}
                    <div className="w-full h-1 bg-rose-700 mb-8" />
                    <h2 className="text-xl font-black text-center text-slate-900 uppercase tracking-[0.2em] mb-12">Hóa đơn bán hàng</h2>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-12">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Chi nhánh:</span>
                                <span className="text-sm font-bold text-slate-800">{order.branch?.name || '---'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Địa chỉ:</span>
                                <span className="text-sm font-medium text-slate-700">{order.customerAddress || '---'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Ngày tạo đơn:</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Khách hàng:</span>
                                <span className="text-sm font-black text-slate-900 uppercase">{order.customerName || 'KHÁCH LẺ'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Số điện thoại:</span>
                                <span className="text-sm font-bold text-slate-800 tracking-wider">{order.customerPhone || '---'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Số CCCD:</span>
                                <span className="text-sm font-medium text-slate-700">{order.customerCardNumber || '---'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Ngày cấp CCCD:</span>
                                <span className="text-sm font-medium text-slate-700">
                                    {order.customerCardIssueDate ? new Date(order.customerCardIssueDate).toLocaleDateString('vi-VN') : '---'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Nguồn đơn:</span>
                                <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{order.orderSource || 'QUAY LẠI'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Giao hàng:</span>
                                <span className="text-sm font-bold text-rose-600 uppercase tracking-tight">
                                    {order.deliveries?.[0]?.driver?.fullName || 'CHƯA ĐIỀU XE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-12">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Danh sách hàng hóa</h3>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-600 uppercase">STT</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-600 uppercase">Tên hàng hóa</th>
                                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-600 uppercase">Số lượng</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-600 uppercase">Đơn giá</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-600 uppercase">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="group">
                                        <td className="px-4 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-4 text-sm font-bold text-slate-800">{item.product?.name || 'Sản phẩm'}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-center text-slate-700">{item.quantity}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-right text-slate-700">{formatCurrency(Number(item.unitPrice))}</td>
                                        <td className="px-4 py-4 text-sm font-black text-right text-slate-900">{formatCurrency(Number(item.totalPrice))}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-800">
                                    <td colSpan={4} className="px-4 py-4 text-right text-xs font-black uppercase text-slate-600">Tổng cộng thanh toán:</td>
                                    <td className="px-4 py-4 text-right text-lg font-black text-rose-700">{formatCurrency(totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Note */}
                    <div className="mb-12">
                        <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Ghi chú:</span>
                        <div className="text-sm text-slate-800 italic p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[60px]">
                            {order.note || 'Không có ghi chú.'}
                        </div>
                    </div>

                    {/* Payments & Splits Summary (Print Only) */}
                    <div className="mt-8 space-y-8">
                        {order.payments?.length > 0 && (
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Thông tin thanh toán</h3>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                                    {order.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between border-b border-slate-50 py-1">
                                            <span className="text-xs font-medium text-slate-600 italic">
                                                {(() => {
                                                    switch (p.paymentMethod) {
                                                        case 'CASH': return '💰 Tiền mặt';
                                                        case 'TRANSFER_COMPANY': return '🏦 Chuyển khoản (C.Ty)';
                                                        case 'TRANSFER_PERSONAL': return '🏠 Chuyển khoản (C.Nhân)';
                                                        case 'CREDIT': return '💳 Quẹt thẻ';
                                                        case 'INSTALLMENT': return '📈 Trả góp';
                                                        default: return '🏦 Chuyển khoản';
                                                    }
                                                })()}
                                                ({new Date(p.paidAt).toLocaleDateString('vi-VN')})
                                            </span>
                                            <span className="text-xs font-black text-slate-800">{formatCurrency(Number(p.amount))}</span>
                                        </div>
                                    ))}
                                    {/* Accountant confirmation - Only show for installment */}
                                    {isInstallment && order.isPaymentConfirmed && (
                                        <div className="flex justify-between border-b border-emerald-50 py-1 bg-emerald-50/50 px-2 rounded mt-1">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">✓ Kế toán xác nhận:</span>
                                            <span className="text-[10px] font-bold text-emerald-800 italic">
                                                {order.confirmer?.fullName || 'Hệ thống'} - {order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString('vi-VN') : '---'}
                                            </span>
                                        </div>
                                    )}
                                    {!isInstallment && (
                                        <div className="flex justify-between border-b border-slate-50 py-1 bg-slate-50/50 px-2 rounded mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hệ thống ghi nhận:</span>
                                            <span className="text-[10px] font-bold text-slate-500 italic">
                                                Tự động (Ngày tạo {new Date(order.orderDate).toLocaleDateString('vi-VN')})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {order.splits?.length > 0 && (
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Nhân viên chia đơn</h3>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                    {order.splits.map((s: any, i: number) => (
                                        <div key={i} className="flex justify-between border-b border-slate-50 py-1">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800">{s.employee?.fullName || 'N/A'}</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-medium">{s.branch?.name || 'N/A'}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">
                                                {formatCurrency(Number(s.splitAmount))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 flex justify-between items-end border-t border-slate-100">
                        <div className="space-y-4">
                            <div className="italic text-[10px] text-slate-400">
                                * In từ hệ thống Ohari vào lúc: {isMounted ? `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}` : '...'}
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium">Bản quyền thuộc về OHARI Group © 2026</div>
                        </div>
                        <div className="text-center space-y-12">
                            <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Chữ ký người tạo đơn</p>
                            <div className="w-32 h-px bg-slate-200 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
