"use client";

import { Gift, CreditCard, CheckCircle2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface InvoicePaperProps {
    order: any;
    className?: string;
    type?: 'old' | 'new';
    isCreate?: boolean;
    scale?: number;
}

export default function InvoicePaper({ order, className, type, isCreate, scale }: InvoicePaperProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!order) {
        if (type === 'old' && !isCreate) {
            return (
                <div className="flex-1 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center p-12 text-slate-400 italic font-medium">
                    Dữ liệu bản cũ không tồn tại
                </div>
            );
        }
        if (isCreate && type === 'old') {
            return (
                <div className="flex-1 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center p-12 text-slate-400 italic font-medium">
                    (Đơn hàng mới - Không có lịch sử)
                </div>
            );
        }
        return null;
    }

    const totalProductAmount = Number(order.totalAmount || 0);
    const giftAmount = Number(order.giftAmount || 0);
    const paidAmount = (order.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const remainingAmount = totalProductAmount - paidAmount;

    // Delivery helpers
    const driverDelivery = order.deliveries?.find((d: any) => d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER');
    const staffDelivery = order.deliveries?.find((d: any) => d.role === 'STAFF' || d.category === 'STAFF_DELIVERER' || d.category === 'SELLING_SALE' || d.category === 'OTHER_SALE');

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
        <div
            id="invoice-paper"
            className={cn(
                "w-full max-w-[210mm] bg-white border-2 p-4 md:p-6 shadow-2xl relative overflow-hidden print:shadow-none print:border-none print:p-0 transition-all",
                type === 'old' ? "border-slate-300 opacity-70 saturate-50" : "border-emerald-500 opacity-100",
                !type && "border-slate-800",
                className
            )}
            style={scale ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : {}}
        >
            {/* Top decoration line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-700 print:hidden"></div>
            <div className="hidden print:block w-full h-3 bg-rose-700 mb-8"></div>

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
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">Ohari</h1>
                    <p className={cn(
                        "font-black text-sm uppercase tracking-widest",
                        order.isPaymentConfirmed ? "text-emerald-600" : "text-amber-500"
                    )}>
                        {order.isPaymentConfirmed ? "Đã xác nhận" : "Chờ xác nhận"}
                    </p>
                </div>
            </div>

            <div className="w-full h-0.5 bg-slate-100 mb-6"></div>

            <h1 className="text-lg md:text-xl font-black text-center text-slate-900 border-b-2 border-slate-800 pb-2.5 mb-5 md:mb-6 uppercase tracking-[0.2em]">
                Hóa đơn bán hàng
            </h1>

            {/* Info Grid - Fixed 2 columns to match Image 2 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Chi nhánh:</span>
                    <span className="font-medium text-slate-900">{order.branch?.name || '---'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Nhân viên:</span>
                    <span className="font-medium text-slate-900">{order.creator?.employee?.fullName || order.creator?.fullName || order.employee?.fullName || '---'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Ngày tháng:</span>
                    <span className="font-medium text-slate-900">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '---'}
                    </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Họ tên khách:</span>
                    <span className="font-medium text-slate-900">{order.customerName || 'Khách lẻ'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1 md:col-span-2">
                    <span className="font-bold text-slate-600">Địa chỉ:</span>
                    <span className="font-medium text-slate-900">
                        {[
                            order.customerAddress,
                            order.ward?.name,
                            order.province?.name
                        ].filter(Boolean).join(', ') || '---'}
                    </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Số điện thoại:</span>
                    <span className="font-medium text-slate-900 tracking-wider">{order.customerPhone || '---'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Số CCCD:</span>
                    <span className="font-medium text-slate-700">{order.customerCardNumber || '---'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Ngày cấp:</span>
                    <span className="font-medium text-slate-700">
                        {order.customerCardIssueDate ? new Date(order.customerCardIssueDate).toLocaleDateString('vi-VN') : '---'}
                    </span>
                </div>


                {/* Delivery rows */}
                <div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-100 py-1.5">
                    <span className="font-bold text-slate-600">Lái xe:</span>
                    {driverDelivery ? (
                        <span className="font-black text-rose-600">
                            {driverDelivery.category === 'EXTERNAL_DRIVER'
                                ? '🚚 Lái xe ngoài'
                                : `🏢 ${driverDelivery.driver?.fullName || '---'}`}
                            <span className="text-xs text-slate-400 font-medium ml-1">({formatCurrency(Number(driverDelivery.deliveryFee || 0))})</span>
                        </span>
                    ) : (
                        <span className="font-medium text-slate-400 italic">Chưa chọn</span>
                    )}
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center border-b border-slate-100 py-1.5">
                    <span className="font-bold text-slate-600">Người giao:</span>
                    {staffDelivery ? (
                        <span className="font-black text-blue-600">
                            {staffDelivery.driver?.fullName || '---'}
                            <span className="text-xs text-slate-400 font-medium ml-1">({getCategoryLabel(staffDelivery.category)} - {formatCurrency(Number(staffDelivery.deliveryFee || 0))})</span>
                        </span>
                    ) : (
                        <span className="font-medium text-slate-400 italic">Chưa chọn</span>
                    )}
                </div>

                {/* Status rows */}
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Trạng thái:</span>
                    <span className={cn("text-[10px] font-black uppercase px-1.5 py-0.5 rounded border w-fit", statusBadge.cls)}>
                        {statusBadge.text}
                    </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                    <span className="font-bold text-slate-600">Xuất hóa đơn:</span>
                    {order.isInvoiceIssued ? (
                        <span className="text-[10px] font-black text-blue-600 uppercase px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 w-fit">✅ Đã xuất</span>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic uppercase px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 w-fit">Chưa xuất</span>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white border-2 border-slate-800 overflow-hidden shadow-lg mb-6">
                <div className="bg-rose-50 border-b-2 border-slate-800 p-2 text-center">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                        Danh sách hàng hóa
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-rose-50 border-b-2 border-slate-800">
                                <th className="px-2 py-3 border-r-2 border-slate-800 text-center w-[40px]">STT</th>
                                <th className="px-4 py-3 border-r-2 border-slate-800 text-left min-w-[200px]">Tên hàng hóa</th>
                                <th className="px-2 py-3 border-r-2 border-slate-800 text-center w-[80px]">Số lượng</th>
                                <th className="px-4 py-3 border-r-2 border-slate-800 text-right w-[140px]">Đơn giá</th>
                                <th className="px-4 py-3 text-right w-[140px]">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800">
                            {(order.items || []).map((item: any, idx: number) => (
                                <tr key={idx} className="group">
                                    <td className="px-2 py-2 border-r-2 border-slate-800 text-center font-medium">{idx + 1}</td>
                                    <td className="px-4 py-2 border-r-2 border-slate-800 font-bold text-slate-800">{item.product?.name || 'Sản phẩm'}</td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800 text-center font-bold">{item.quantity}</td>
                                    <td className="px-4 py-2 border-r-2 border-slate-800 text-right font-bold">{formatCurrency(Number(item.unitPrice))}</td>
                                    <td className="px-4 py-2 text-right font-black text-slate-900 bg-slate-50/50">{formatCurrency(Number(item.totalPrice))}</td>
                                </tr>
                            ))}
                            {(!order.items || order.items.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-300 italic">Chưa chọn sản phẩm</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Gifts */}
            {order.gifts && order.gifts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-rose-50">
                        <Gift size={14} className="text-rose-600" />
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">
                            Quà tặng kèm
                        </h3>
                    </div>
                    <div className="p-2 space-y-2">
                        {order.gifts.map((og: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 bg-rose-50/30 rounded-lg border border-rose-100 shadow-sm">
                                <div className="flex-1">
                                    <span className="text-[11px] font-bold text-slate-700">{og.gift?.name || og.name || 'Quà tặng'}</span>
                                </div>
                                <div className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 shrink-0">
                                    <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Số lượng</span>
                                    <span className="text-[11px] font-bold text-slate-700">{og.quantity}</span>
                                </div>
                                <div className="text-right min-w-[70px] shrink-0">
                                    <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Trị giá</span>
                                    <span className="text-[11px] font-black text-rose-600">
                                        {formatCurrency(Number(og.gift?.price || og.price || 0) * og.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="flex flex-col items-end space-y-1 text-sm mb-6">
                <div className="grid grid-cols-[140px_180px] border-b border-slate-200 py-2">
                    <span className="font-bold text-slate-600">Tổng cộng:</span>
                    <span className="text-right font-black text-base text-slate-900">{formatCurrency(totalProductAmount)}</span>
                </div>
                {giftAmount > 0 && (
                    <div className="grid grid-cols-[140px_180px] border-b border-slate-200 py-2 text-rose-600">
                        <span className="font-bold">Quà tặng:</span>
                        <span className="text-right font-black">{formatCurrency(giftAmount)}</span>
                    </div>
                )}
                <div className="grid grid-cols-[140px_180px] border-b border-slate-200 py-2 text-emerald-600">
                    <span className="font-bold">Đã thanh toán:</span>
                    <span className="text-right font-black">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="grid grid-cols-[140px_180px] py-2 text-red-600">
                    <span className="font-bold text-base">Còn lại:</span>
                    <span className="text-right font-black text-base">{formatCurrency(remainingAmount)}</span>
                </div>
            </div>

            {/* Payments & Splits */}
            <div className="space-y-6">
                {order.payments?.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                            <CreditCard size={14} /> Thông tin thanh toán
                        </h3>

                        <div className="grid grid-cols-2 items-center gap-x-12 gap-y-6">
                            <div className="space-y-3 flex-1">
                                {order.payments.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between border-b border-slate-100 py-2 items-center leading-none">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-600">
                                                {(() => {
                                                    switch (p.paymentMethod) {
                                                        case 'CASH': return '💰 Tiền mặt';
                                                        case 'TRANSFER_COMPANY': return '🏦 CK (C.Ty)';
                                                        case 'TRANSFER_PERSONAL': return '🏠 CK (C.Nhân)';
                                                        case 'CREDIT': return '💳 Quẹt thẻ';
                                                        case 'CARD': return '💳 Quẹt thẻ';
                                                        case 'INSTALLMENT': return '📈 Trả góp';
                                                        default: return '🏦 Chuyển khoản';
                                                    }
                                                })()}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                ({p.paidAt ? new Date(p.paidAt).toLocaleDateString('vi-VN') : '---'})
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{formatCurrency(Number(p.amount))}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center">
                                {order.isPaymentConfirmed ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 shadow-sm">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase">✓ KT xác nhận:</span>
                                        <span className="text-[9px] font-bold text-emerald-800 italic">
                                            {order.confirmer?.fullName || order.confirmer?.employee?.fullName || 'Hệ thống'} - {order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString('vi-VN') : '---'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-amber-50 px-2 py-1 rounded border border-amber-100 shadow-sm">
                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">TRẠNG THÁI:</span>
                                        <span className="text-[9px] font-bold text-amber-500 italic">
                                            Đang chờ kế toán xác nhận
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {order.splits?.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest text-center md:text-left flex items-center gap-2">
                            Danh sách nhân viên chia đơn
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            {order.splits.map((s: any, i: number) => (
                                <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{s.employee?.fullName || 'N/A'}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">{s.branch?.name || 'N/A'}</span>
                                    </div>
                                    <span className="text-sm font-medium italic text-slate-600">
                                        Doanh số: {formatCurrency(Number(s.splitAmount))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Note Section */}
            {order.note && (
                <div className="mt-6 mb-6">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Ghi chú đơn hàng:</span>
                    <div className="bg-slate-50/50 rounded-lg p-2 text-[9px] text-slate-600 min-h-[50px] italic border-l-2 border-slate-200">
                        {order.note}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 flex justify-between items-start italic text-[10px] text-slate-400 border-t border-slate-100">
                <div>
                    * Ngày in: {isMounted ? `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}` : '...'}
                </div>
                <div className="text-right">Hệ thống quản lý Ohari</div>
            </div>
        </div>
    );
}
