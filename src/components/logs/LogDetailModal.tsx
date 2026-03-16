"use client";
import { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, CheckCircle2, Activity, User, Phone, Banknote, FileText, Globe, MapPin, Box, Gift, Users, Truck, Calendar, ShieldCheck, Mail, Map, CreditCard } from 'lucide-react';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
import InvoicePaper from '../orders/InvoicePaper';

interface LogDetailModalProps {
    log: any;
    onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
    const [windowWidth, setWindowWidth] = useState(0);
    const [contentHeights, setContentHeights] = useState({ old: 0, new: 0 });

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        // Timer để đo lại chiều cao sau khi InvoicePaper render xong
        const timer = setTimeout(() => {
            const oldEl = document.getElementById('scaled-content-old');
            const newEl = document.getElementById('scaled-content-new');
            if (oldEl && newEl) {
                setContentHeights({
                    old: oldEl.scrollHeight,
                    new: newEl.scrollHeight
                });
            }
        }, 500);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, []);

    if (!log) return null;

    const oldData = log.oldData;
    const newData = log.newData;
    const isCreate = log.action === 'create';

    const getChangesSummary = () => {
        const list: any[] = [];

        const isSame = (v1: any, v2: any) => {
            if (v1 === v2) return true;
            if (v1 == null || v2 == null) return v1 === v2;
            return String(v1) === String(v2);
        };

        const checkField = (field: string, label: string, icon: any, color: string, bgColor: string, isCurrency = false, isDate = false) => {
            const oldVal = oldData?.[field];
            const newVal = newData?.[field];
            if (!isSame(oldVal, newVal)) {
                const format = (v: any) => {
                    if (!v) return '---';
                    if (isCurrency) return formatCurrency(Number(v));
                    if (isDate) return formatDate(v);
                    return String(v);
                };
                list.push({
                    label,
                    old: format(oldVal),
                    new: format(newVal),
                    icon,
                    color,
                    bgColor
                });
            }
        };

        // 1. Administrative Info
        if (!isSame(oldData?.creatorId, newData?.creatorId)) {
            list.push({
                label: 'Nhân viên lập',
                old: oldData?.creator?.employee?.fullName || oldData?.creator?.fullName || '---',
                new: newData?.creator?.employee?.fullName || newData?.creator?.fullName || '---',
                icon: <User size={18} />,
                color: 'text-slate-600',
                bgColor: 'bg-slate-100'
            });
        }
        checkField('orderDate', 'Ngày đặt đơn', <Calendar size={18} />, 'text-blue-600', 'bg-blue-50', false, true);
        if (!isSame(oldData?.branchId, newData?.branchId)) {
            list.push({
                label: 'Chi nhánh',
                old: oldData?.branch?.name || '---',
                new: newData?.branch?.name || '---',
                icon: <MapPin size={18} />,
                color: 'text-purple-500',
                bgColor: 'bg-purple-50'
            });
        }
        checkField('orderSource', 'Nguồn đơn', <Globe size={18} />, 'text-sky-500', 'bg-sky-50');

        // 2. Customer Info
        checkField('customerName', 'Khách hàng', <User size={18} />, 'text-blue-500', 'bg-blue-50');
        checkField('customerPhone', 'Số điện thoại', <Phone size={18} />, 'text-indigo-500', 'bg-indigo-50');
        const oldFullAddress = [oldData?.customerAddress, oldData?.ward?.name, oldData?.province?.name].filter(Boolean).join(', ');
        const newFullAddress = [newData?.customerAddress, newData?.ward?.name, newData?.province?.name].filter(Boolean).join(', ');

        if (oldFullAddress !== newFullAddress) {
            list.push({
                label: 'Địa chỉ khách',
                old: oldFullAddress || '---',
                new: newFullAddress || '---',
                icon: <MapPin size={18} />,
                color: 'text-orange-500',
                bgColor: 'bg-orange-50'
            });
        }
        checkField('customerCardNumber', 'Số CCCD', <ShieldCheck size={18} />, 'text-slate-700', 'bg-slate-100');
        checkField('customerCardIssueDate', 'Ngày cấp CCCD', <Calendar size={18} />, 'text-slate-500', 'bg-slate-50', false, true);

        // 3. Status & Confirmation
        checkField('status', 'Trạng thái đơn', <Activity size={18} />, 'text-primary-light', 'bg-primary-subtle');
        if (oldData?.isPaymentConfirmed !== newData?.isPaymentConfirmed) {
            list.push({
                label: 'Xác nhận tiền',
                old: oldData?.isPaymentConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận',
                new: newData?.isPaymentConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận',
                icon: <CheckCircle2 size={18} />,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50'
            });
        }
        if (oldData?.isInvoiceIssued !== newData?.isInvoiceIssued) {
            list.push({
                label: 'Xuất hóa đơn đỏ',
                old: oldData?.isInvoiceIssued ? 'Đã xuất' : 'Chưa xuất',
                new: newData?.isInvoiceIssued ? 'Đã xuất' : 'Chưa xuất',
                icon: <Mail size={18} />,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            });
        }

        // 4. Items & Finance
        const getItemsKey = (items: any[]) => (items || []).map((i: any) => `${i.productId}-${i.quantity}-${i.unitPrice}`).sort().join('|');
        if (getItemsKey(oldData?.items) !== getItemsKey(newData?.items)) {
            list.push({
                label: 'Sản phẩm',
                old: `${(oldData?.items || []).length} mặt hàng`,
                new: `${(newData?.items || []).length} mặt hàng`,
                icon: <Box size={18} />,
                color: 'text-slate-600',
                bgColor: 'bg-slate-100'
            });
        }
        checkField('totalAmount', 'Tổng tiền đơn', <Banknote size={18} />, 'text-emerald-500', 'bg-emerald-50', true);
        checkField('note', 'Ghi chú', <FileText size={18} />, 'text-amber-500', 'bg-amber-50');

        // 4.5 Payments
        const getPaymentsKey = (payments: any[]) => (payments || []).map((p: any) => `${p.amount}-${p.paymentMethod}`).sort().join('|');
        if (getPaymentsKey(oldData?.payments) !== getPaymentsKey(newData?.payments)) {
            const oldPaid = (oldData?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            const newPaid = (newData?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

            list.push({
                label: 'Thanh toán',
                old: formatCurrency(oldPaid),
                new: formatCurrency(newPaid),
                icon: <CreditCard size={18} />,
                color: 'text-indigo-500',
                bgColor: 'bg-indigo-50'
            });
        }

        // 5. Gifts & Splits
        const getGiftsKey = (gifts: any[]) => (gifts || []).map((g: any) => `${g.giftId}-${g.quantity}`).sort().join('|');
        if (getGiftsKey(oldData?.gifts) !== getGiftsKey(newData?.gifts)) {
            list.push({
                label: 'Quà tặng',
                old: (oldData?.gifts || []).map((g: any) => `${g.gift?.name || g.name} (x${g.quantity})`).join(', ') || 'Không có',
                new: (newData?.gifts || []).map((g: any) => `${g.gift?.name || g.name} (x${g.quantity})`).join(', ') || 'Không có',
                icon: <Gift size={18} />,
                color: 'text-primary-light',
                bgColor: 'bg-primary-subtle'
            });
        }

        const getSplitsKey = (splits: any[]) => (splits || []).map((s: any) => `${s.employeeId}-${s.splitPercent}`).sort().join('|');
        if (getSplitsKey(oldData?.splits) !== getSplitsKey(newData?.splits)) {
            list.push({
                label: 'Chia doanh số',
                old: (oldData?.splits || []).map((s: any) => `${s.employee?.fullName} (${s.splitPercent}%)`).join(', ') || '---',
                new: (newData?.splits || []).map((s: any) => `${s.employee?.fullName} (${s.splitPercent}%)`).join(', ') || '---',
                icon: <Users size={18} />,
                color: 'text-orange-500',
                bgColor: 'bg-orange-50'
            });
        }

        // 6. Detailed Delivery (Driver vs Staff)
        const getDeliveryByType = (data: any, isDriver: boolean) => {
            return (data?.deliveries || []).find((d: any) =>
                isDriver ? (d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER')
                    : (d.role === 'STAFF' || d.category === 'STAFF_DELIVERER' || d.category === 'SELLING_SALE' || d.category === 'OTHER_SALE')
            );
        };

        const oldDriver = getDeliveryByType(oldData, true);
        const newDriver = getDeliveryByType(newData, true);
        if (!isSame(oldDriver?.driverId, newDriver?.driverId) || !isSame(oldDriver?.deliveryFee, newDriver?.deliveryFee)) {
            list.push({
                label: 'Lái xe (Driver)',
                old: oldDriver ? `${oldDriver.driver?.fullName || 'Lái xe'} - ${formatCurrency(Number(oldDriver.deliveryFee))}` : 'Chưa gán',
                new: newDriver ? `${newDriver.driver?.fullName || 'Lái xe'} - ${formatCurrency(Number(newDriver.deliveryFee))}` : 'Chưa gán',
                icon: <Truck size={18} />,
                color: 'text-primary',
                bgColor: 'bg-primary-subtle'
            });
        }

        const oldStaff = getDeliveryByType(oldData, false);
        const newStaff = getDeliveryByType(newData, false);
        if (!isSame(oldStaff?.driverId, newStaff?.driverId) || !isSame(oldStaff?.deliveryFee, newStaff?.deliveryFee)) {
            list.push({
                label: 'Người giao (Staff)',
                old: oldStaff ? `${oldStaff.driver?.fullName || 'Nhân viên'} - ${formatCurrency(Number(oldStaff.deliveryFee))}` : 'Chưa gán',
                new: newStaff ? `${newStaff.driver?.fullName || 'Nhân viên'} - ${formatCurrency(Number(newStaff.deliveryFee))}` : 'Chưa gán',
                icon: <Truck size={18} />,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            });
        }

        return list;
    };

    const changes = getChangesSummary();

    const isVertical = useMemo(() => windowWidth > 0 && windowWidth < 1024, [windowWidth]);

    const responsiveScale = useMemo(() => {
        if (windowWidth <= 0) return 0.85;
        const a4WidthPx = 210 * 3.78;

        if (isVertical) {
            const availableWidth = windowWidth * 0.9;
            return Math.min(0.88, availableWidth / a4WidthPx);
        } else {
            // Screen width - estimated gaps/padding (increased to 120 for arrow clearance)
            const totalAvailableWidth = windowWidth * 0.96 - 120;
            const singleAvailableWidth = totalAvailableWidth / 2;
            return Math.min(0.85, singleAvailableWidth / a4WidthPx);
        }
    }, [windowWidth, isVertical]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[98vw] h-[94vh] bg-white/95 rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20 scale-in animate-in fade-in duration-300">

                {/* Header Section - Dark & Professional like Image 2 */}
                <div className="bg-[#1e293b] border-b border-white/5 py-3 px-5 md:px-8 flex justify-between items-center relative overflow-hidden shrink-0">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-xl">
                            <Activity size={22} className="rotate-0" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase leading-tight">Đối Chiếu Lịch Sử Thay Đổi</h2>
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Hóa đơn: #{log.order?.id?.substring(0, 8) || 'N/A'}</span>
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded font-black uppercase border",
                                    isCreate ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                )}>
                                    {isCreate ? 'Tạo mới' : 'Cập nhật'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="relative z-20 w-10 h-10 rounded-xl bg-white/5 hover:bg-primary-light/20 hover:text-primary-light text-white/40 transition-all duration-300 flex items-center justify-center group cursor-pointer border border-white/5"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f1f5f9] p-3 md:p-4 space-y-6 md:space-y-8">

                    {/* Summary Cards */}
                    {changes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                            {changes.map((change, idx) => (
                                <div key={idx} className="group bg-white/80 backdrop-blur-md p-3.5 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl ${change.bgColor} flex items-center justify-center ${change.color} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform duration-500`}>
                                            {change.icon}
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest block">{change.label}</span>
                                            <div className="h-0.5 w-6 bg-emerald-500/30 rounded-full mt-1 group-hover:w-10 transition-all duration-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                                            <span className="text-[10px] md:text-xs text-slate-400 font-bold italic line-through decoration-slate-300/50 break-words">{change.old}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1.5 shrink-0" />
                                            <span className="text-xs md:text-sm font-black text-slate-800 tracking-tight break-words">{change.new}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bills Comparison Layout */}
                    {/* Bills Comparison Layout - ADAPTIVE FLUID SYSTEM */}
                    <div className={cn(
                        "flex min-h-[600px] relative px-1 md:px-4 gap-6 lg:gap-12 pb-12",
                        isVertical ? "flex-col items-center" : "flex-row items-start justify-between"
                    )}>

                        {/* Old Content */}
                        <div className={cn(
                            "flex animate-in slide-in-from-left-4 duration-700",
                            isVertical ? "justify-center w-full" : "justify-start"
                        )}>
                            <div style={{
                                width: `calc(210mm * ${responsiveScale})`,
                                height: contentHeights.old ? `${contentHeights.old * responsiveScale}px` : 'fit-content',
                                overflow: 'hidden'
                            }} className="shrink-0">
                                <div id="scaled-content-old" style={{
                                    transform: `scale(${responsiveScale})`,
                                    transformOrigin: 'top left',
                                    width: '210mm'
                                }} className="flex flex-col shrink-0 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-100 p-4 md:p-6 flex flex-col gap-1 md:gap-1.5 font-sans rounded-t-3xl text-sm md:text-base">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                            <h4 className="text-slate-700 font-black uppercase tracking-tight text-lg md:text-xl">1. Bản Cũ (Trước Chỉnh Sửa)</h4>
                                        </div>
                                        <span className="text-base font-bold text-slate-400 uppercase tracking-[0.2em] pl-4.5">Hóa Đơn #{log.order?.id?.substring(0, 8) || 'N/A'}</span>
                                    </div>
                                    <InvoicePaper
                                        order={oldData}
                                        type="old"
                                        isCreate={isCreate}
                                        className="shadow-none border-none"
                                        forceGrid={true}
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            style={{ transform: `translateX(-50%) translateY(-50%) scale(${responsiveScale})` }}
                            className={cn(
                                "z-50 flex items-center justify-center shrink-0",
                                isVertical ? "hidden" : "absolute left-1/2 top-[400px]"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full bg-slate-900 border-2 border-[#f1f5f9] shadow-xl flex items-center justify-center text-white transition-all duration-500",
                                "rotate-0"
                            )}>
                                <ArrowRight size={24} />
                            </div>
                        </div>

                        {/* Mobile Divider (Only visible when vertical) */}
                        {isVertical && (
                            <div className="w-full py-4 flex items-center justify-center shrink-0">
                                <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-[#f1f5f9] shadow-xl flex items-center justify-center text-white rotate-90">
                                    <ArrowRight size={24} />
                                </div>
                            </div>
                        )}

                        {/* New Content */}
                        <div className={cn(
                            "flex animate-in slide-in-from-right-4 duration-700",
                            isVertical ? "justify-center w-full" : "justify-end"
                        )}>
                            <div style={{
                                width: `calc(210mm * ${responsiveScale})`,
                                height: contentHeights.new ? `${contentHeights.new * responsiveScale}px` : 'fit-content',
                                overflow: 'hidden'
                            }} className="shrink-0">
                                <div id="scaled-content-new" style={{
                                    transform: `scale(${responsiveScale})`,
                                    transformOrigin: 'top left',
                                    width: '210mm'
                                }} className="flex flex-col shrink-0 bg-white rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden">
                                    <div className="bg-emerald-50/50 border-b border-emerald-100 p-4 md:p-6 flex flex-col gap-1 md:gap-1.5 font-sans rounded-t-3xl text-sm md:text-base">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle2 size={14} className="md:size-16" />
                                                </div>
                                                <h4 className="text-emerald-800 font-black uppercase tracking-tight text-lg md:text-xl">2. Bản Mới (Sau Chỉnh Sửa)</h4>
                                            </div>
                                            <span className={cn(
                                                "text-white text-[9px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 rounded-full font-black uppercase tracking-widest shadow-lg",
                                                isCreate ? "bg-indigo-600 shadow-indigo-600/20" : "bg-emerald-600 shadow-emerald-600/20"
                                            )}>
                                                {isCreate ? 'Tạo mới' : 'Cập nhật'}
                                            </span>
                                        </div>
                                        <span className="text-base font-bold text-emerald-600/60 uppercase tracking-[0.2em] pl-10">Hóa Đơn #{log.order?.id?.substring(0, 8) || 'N/A'}</span>
                                    </div>
                                    <InvoicePaper
                                        order={newData}
                                        type="new"
                                        className="shadow-none border-none"
                                        forceGrid={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="py-1.5 px-6 bg-slate-900 border-t border-white/5 flex justify-between items-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] relative z-10 italic">
                        Superb AI - Quản Lý Hóa Đơn & Lịch Sử Thay Đổi Hệ Thống
                    </p>
                    <button
                        onClick={onClose}
                        className="relative z-10 bg-white text-slate-900 px-4 py-1.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl cursor-pointer"
                    >
                        Đã rõ thông tin
                    </button>
                </div>
            </div>
        </div>
    );
}
