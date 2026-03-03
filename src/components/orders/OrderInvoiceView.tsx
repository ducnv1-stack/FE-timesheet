"use client";

import { Printer, X, Edit3, Gift } from 'lucide-react';
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
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Action Bar */}
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between no-print">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
                        <Printer size={16} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-xs">Xem chi tiết hóa đơn</h3>
                        <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">#{order.id.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(() => {
                        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                        const user = storedUser ? JSON.parse(storedUser) : null;
                        const userRole = user ? (typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role) : '';
                        if (userRole === 'DRIVER') return null;
                        return (
                            <button
                                onClick={() => router.push(`/orders/edit/${order.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                            >
                                <Edit3 size={13} /> Sửa hóa đơn
                            </button>
                        );
                    })()}
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                    >
                        <Printer size={13} /> In hóa đơn
                    </button>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-rose-600 text-white rounded-lg transition-all cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Invoice Content */}
            <div className="p-4 md:p-6 bg-[#fafafa] flex justify-center">
                <div id="invoice-paper" className="w-full max-w-[210mm] bg-white border-2 border-slate-800 p-4 md:p-6 shadow-2xl relative overflow-hidden print:shadow-none print:border-none print:p-0">
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

                    {/* Info Grid — same layout as creation form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mb-6 text-xs">
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Chi nhánh:</span>
                            <span className="font-medium text-slate-900">{order.branch?.name || '---'}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nhân viên:</span>
                            <span className="font-medium text-slate-900">{order.creator?.employee?.fullName || order.creator?.fullName || '---'}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Ngày tháng:</span>
                            <span className="font-medium text-slate-900">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Họ tên khách:</span>
                            <span className="font-black text-slate-900 uppercase">{order.customerName || 'KHÁCH LẺ'}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1 md:col-span-2">
                            <span className="font-bold text-slate-600">Địa chỉ:</span>
                            <span className="font-medium text-slate-900">{order.customerAddress || '---'}</span>
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
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nguồn đơn:</span>
                            <span className="font-bold text-slate-800 uppercase tracking-tight">{order.orderSource || '---'}</span>
                        </div>

                        {/* Delivery rows */}
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Lái xe:</span>
                            {driverDelivery ? (
                                <span className="font-bold text-rose-600">
                                    {driverDelivery.category === 'EXTERNAL_DRIVER'
                                        ? '🚚 Lái xe ngoài'
                                        : `🏢 ${driverDelivery.driver?.fullName || '---'}`}
                                    <span className="text-[10px] text-slate-400 font-medium ml-1">({formatCurrency(Number(driverDelivery.deliveryFee || 0))})</span>
                                </span>
                            ) : (
                                <span className="font-medium text-slate-400 italic">Chưa chọn</span>
                            )}
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Người giao:</span>
                            {staffDelivery ? (
                                <span className="font-bold text-blue-600">
                                    {staffDelivery.driver?.fullName || '---'}
                                    <span className="text-[10px] text-slate-400 font-medium ml-1">({getCategoryLabel(staffDelivery.category)} - {formatCurrency(Number(staffDelivery.deliveryFee || 0))})</span>
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

                    {/* Items Table — styled like ItemGrid */}
                    <div className="bg-white border-2 border-slate-800 overflow-hidden shadow-lg mb-6">
                        <div className="bg-rose-50 border-b-2 border-slate-800 p-2 text-center">
                            <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                                Danh sách hàng hóa
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-rose-50 border-b-2 border-slate-800">
                                        <th className="px-2 py-2 border-r-2 border-slate-800 text-center w-[40px]">STT</th>
                                        <th className="px-4 py-2 border-r-2 border-slate-800 text-left min-w-[200px]">Tên hàng hóa</th>
                                        <th className="px-2 py-2 border-r-2 border-slate-800 text-center w-[80px]">Số lượng</th>
                                        <th className="px-4 py-2 border-r-2 border-slate-800 text-right w-[140px]">Đơn giá</th>
                                        <th className="px-4 py-2 text-right w-[140px]">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-800">
                                    {order.items.map((item: any, idx: number) => (
                                        <tr key={idx} className="group">
                                            <td className="px-2 py-2 border-r-2 border-slate-800 text-center font-medium">{idx + 1}</td>
                                            <td className="px-4 py-2 border-r-2 border-slate-800 font-bold text-slate-800">{item.product?.name || 'Sản phẩm'}</td>
                                            <td className="px-2 py-2 border-r-2 border-slate-800 text-center font-bold">{item.quantity}</td>
                                            <td className="px-4 py-2 border-r-2 border-slate-800 text-right font-bold">{formatCurrency(Number(item.unitPrice))}</td>
                                            <td className="px-4 py-2 text-right font-black text-slate-900 bg-slate-50/50">{formatCurrency(Number(item.totalPrice))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Gifts — styled like GiftGrid */}
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
                                                -{formatCurrency(Number(og.gift?.price || og.price || 0) * og.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary — styled like creation form */}
                    <div className="flex flex-col items-end space-y-1 text-xs mb-6">
                        <div className="grid grid-cols-[120px_160px] border-b border-slate-200 py-1">
                            <span className="font-bold text-slate-600">Tổng cộng:</span>
                            <span className="text-right font-black text-sm text-slate-900">{formatCurrency(totalProductAmount)}</span>
                        </div>
                        {giftAmount > 0 && (
                            <div className="grid grid-cols-[120px_160px] border-b border-slate-200 py-1 text-rose-600">
                                <span className="font-bold">Quà tặng:</span>
                                <span className="text-right font-bold">-{formatCurrency(giftAmount)}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-[120px_160px] border-b border-slate-200 py-1 text-emerald-600">
                            <span className="font-bold">Đã thanh toán:</span>
                            <span className="text-right font-bold">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[120px_160px] py-1 text-red-600">
                            <span className="font-bold">Còn lại:</span>
                            <span className="text-right font-bold">{formatCurrency(remainingAmount)}</span>
                        </div>
                    </div>

                    {/* Payments & Splits */}
                    <div className="space-y-6">
                        {order.payments?.length > 0 && (
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Thông tin thanh toán</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    {order.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
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
                                                ({new Date(p.paidAt).toLocaleDateString('vi-VN')})
                                            </span>
                                            <span className="text-sm font-black text-slate-800">{formatCurrency(Number(p.amount))}</span>
                                        </div>
                                    ))}
                                    {/* Accountant confirmation */}
                                    {order.isPaymentConfirmed && (
                                        <div className="flex justify-between border-b border-emerald-50 py-1 bg-emerald-50/50 px-2 rounded mt-1">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">✓ KT xác nhận:</span>
                                            <span className="text-[10px] font-bold text-emerald-800 italic">
                                                {order.confirmer?.fullName || order.confirmer?.employee?.fullName || 'Hệ thống'} - {order.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString('vi-VN') : '---'}
                                            </span>
                                        </div>
                                    )}
                                    {!order.isPaymentConfirmed && (
                                        <div className="flex justify-between border-b border-amber-50 py-1 bg-amber-50/50 px-2 rounded mt-1">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Trạng thái:</span>
                                            <span className="text-[10px] font-bold text-amber-500 italic">
                                                Đang chờ kế toán xác nhận
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {order.splits?.length > 0 && (
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Danh sách nhân viên chia đơn</h3>
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

                    {/* Footer */}
                    <div className="mt-12 pt-8 flex justify-between items-start italic text-[10px] text-slate-400 border-t border-slate-100">
                        <div>
                            * Ngày in: {isMounted ? `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}` : '...'}
                        </div>
                        <div className="text-right">Hệ thống quản lý Ohari</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
