"use client";

import { X, ArrowRight, CornerDownRight, Package, CreditCard, Users, Hash, ArrowUpDown, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface LogDetailModalProps {
    log: any;
    onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
    if (!log) return null;

    const oldData = log.oldData;
    const newData = log.newData;
    const isCreate = log.action === 'create';

    const getChangesSummary = () => {
        if (isCreate) return [{ label: 'Khởi tạo', detail: 'Tạo mới đơn hàng trên hệ thống' }];

        const list: { label: string, detail: string }[] = [];

        const checkField = (field: string, label: string, isCurrency = false) => {
            const oldVal = oldData?.[field];
            const newVal = newData?.[field];
            if (String(oldVal || '') !== String(newVal || '')) {
                list.push({
                    label,
                    detail: `${isCurrency ? formatCurrency(Number(oldVal || 0)) : oldVal || 'Trống'} → ${isCurrency ? formatCurrency(Number(newVal || 0)) : newVal || 'Trống'}`
                });
            }
        };

        checkField('customerName', 'Khách hàng');
        checkField('customerPhone', 'Số điện thoại');
        checkField('customerAddress', 'Địa chỉ');
        checkField('customerCardNumber', 'Số CCCD');
        checkField('totalAmount', 'Tổng tiền đơn', true);
        checkField('note', 'Ghi chú');

        // Branch check
        if (oldData?.branchId !== newData?.branchId) {
            list.push({
                label: 'Chi nhánh',
                detail: `${oldData?.branch?.name || '---'} → ${newData?.branch?.name || '---'}`
            });
        }

        // Delivery check
        const oldDriver = oldData?.deliveries?.[0]?.driverId || oldData?.driverId;
        const newDriver = newData?.deliveries?.[0]?.driverId || newData?.driverId;
        if (oldDriver !== newDriver) {
            list.push({
                label: 'Người giao',
                detail: `${oldData?.deliveries?.[0]?.driver?.fullName || 'Trống'} → ${newData?.deliveries?.[0]?.driver?.fullName || 'Trống'}`
            });
        }

        // Precise Items comparison (ignore IDs/Dates)
        const oldItemsMap = (oldData?.items || []).map((i: any) => `${i.productId}-${i.quantity}-${Number(i.unitPrice)}`).sort().join('|');
        const newItemsMap = (newData?.items || []).map((i: any) => `${i.productId}-${i.quantity}-${Number(i.unitPrice)}`).sort().join('|');
        if (oldItemsMap !== newItemsMap) {
            list.push({ label: 'Sản phẩm', detail: `Thay đổi danh sách sản phẩm, số lượng hoặc đơn giá` });
        }

        // Precise Payments comparison
        const oldTotalPay = (oldData?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const newTotalPay = (newData?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        if (oldTotalPay !== newTotalPay) {
            list.push({ label: 'Thanh toán', detail: `Thay đổi tổng tiền trả: ${formatCurrency(oldTotalPay)} → ${formatCurrency(newTotalPay)}` });
        } else {
            const oldPayMap = (oldData?.payments || []).map((p: any) => `${p.paymentMethod}-${Number(p.amount)}`).sort().join('|');
            const newPayMap = (newData?.payments || []).map((p: any) => `${p.paymentMethod}-${Number(p.amount)}`).sort().join('|');
            if (oldPayMap !== newPayMap) {
                list.push({ label: 'Hình thức trả', detail: `Thay đổi phương thức thanh toán` });
            }
        }

        return list.length > 0 ? list : [{ label: 'Khác', detail: 'Cập nhật thông tin nhân viên hoặc thời gian' }];
    };

    const changes = getChangesSummary();

    const BillPaper = ({ data, title, type }: { data: any, title: string, type: 'old' | 'new' }) => {
        if (!data && type === 'old' && !isCreate) return (
            <div className="flex-1 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center p-12 text-slate-400 italic font-medium">
                Dữ liệu bản cũ không tồn tại
            </div>
        );

        if (isCreate && type === 'old') return (
            <div className="flex-1 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center p-12 text-slate-400 italic font-medium">
                (Đơn hàng mới - Không có lịch sử)
            </div>
        );

        const totalAmount = (data?.items || []).reduce((sum: number, i: any) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);
        const totalPaid = (data?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const remaining = totalAmount - totalPaid;

        return (
            <div className={cn(
                "flex-1 bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl",
                type === 'old'
                    ? "border-slate-300 hover:border-slate-400"
                    : "border-green-500 hover:border-green-600 ring-2 ring-green-100"
            )}>
                {/* Header */}
                <div className={cn(
                    "px-4 py-3 flex items-center justify-between border-b",
                    type === 'old'
                        ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
                        : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                )}>
                    <div className="flex items-center gap-2">
                        {type === 'new' && (
                            <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-black text-slate-900">{title}</h3>
                            <p className="text-[10px] text-slate-500 font-medium">HÓA ĐƠN #{data?.id?.slice(-6)?.toUpperCase() || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={cn(
                    "bg-white p-4 rounded-sm relative min-h-[700px] md:min-h-[900px] transition-all flex flex-col overflow-hidden",
                    type === 'old' ? "opacity-70 saturate-50" : "opacity-100"
                )}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-700"></div>

                    {/* Brand Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">Công ty TNHH OHARI Việt Nam</p>
                                <p className="text-[7px] text-slate-400 max-w-[120px] leading-tight">
                                    {data?.branch?.address || data?.branch?.name || 'Chi nhánh Ohari'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Ohari</h2>
                            <p className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest">Hệ thống ERP</p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 mb-6"></div>

                    <h1 className="text-base md:text-lg font-black text-center text-slate-900 border-b-2 border-slate-800 pb-2 mb-6 uppercase tracking-[0.2em] italic">
                        Hóa đơn bán hàng
                    </h1>

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-1 gap-y-0.5 mb-6 text-[9px]">
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Chi nhánh:</span>
                            <span className="font-black text-slate-900">{data?.branch?.name || '---'}</span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Nhân viên:</span>
                            <span className="font-black text-slate-900 text-rose-600">{data?.employee?.fullName || 'Hệ thống'}</span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Ngày tháng:</span>
                            <span className="font-black text-slate-900">
                                {data?.orderDate ? new Date(data.orderDate).toLocaleDateString('vi-VN') : '---'}
                            </span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Họ tên khách:</span>
                            <span className="font-black text-slate-900 uppercase">{data?.customerName || 'KHÁCH LẺ'}</span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-start border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Địa chỉ:</span>
                            <span className="font-medium text-slate-700 italic leading-tight">{data?.customerAddress || '---'}</span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Số điện thoại:</span>
                            <span className="font-black text-slate-900 tracking-widest">{data?.customerPhone || '---'}</span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Số CCCD:</span>
                            <span className="font-medium text-slate-700">{data?.customerCardNumber || '---'}</span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Ngày cấp:</span>
                            <span className="font-medium text-slate-700">
                                {data?.customerCardIssueDate ? new Date(data.customerCardIssueDate).toLocaleDateString('vi-VN') : '---'}
                            </span>
                        </div>
                        <div className="grid grid-cols-[70px_1fr] items-center border-b border-slate-50 py-0.5">
                            <span className="font-bold text-slate-500 uppercase tracking-tighter">Giao hàng:</span>
                            <span className="font-black text-rose-600">
                                {data?.deliveries?.[0]?.driver?.fullName || '---'}
                            </span>
                        </div>
                    </div>

                    {/* Items Table - Professional Style */}
                    <div className="mb-6 border border-slate-800 rounded-sm overflow-hidden">
                        <table className="w-full text-[9px]">
                            <thead className="bg-slate-50 text-slate-700 font-black uppercase text-center border-b border-slate-800">
                                <tr>
                                    <th className="hidden lg:table-cell px-1 py-1 border-r border-slate-200 w-6">STT</th>
                                    <th className="px-1 py-1 border-r border-slate-200 text-left">Tên hàng</th>
                                    <th className="px-1 py-1 border-r border-slate-200 w-6 md:w-10 text-center">SL</th>
                                    <th className="hidden sm:table-cell px-1 py-1 border-r border-slate-200 text-right">Đơn giá</th>
                                    <th className="px-1 py-1 text-right">T.Tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(data?.items || []).map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td className="hidden lg:table-cell px-1 py-1 border-r border-slate-50 text-center text-slate-400">{i + 1}</td>
                                        <td className="px-1 py-1 border-r border-slate-50 font-bold text-slate-800 break-words">
                                            {item.product?.name || 'Sản phẩm'}
                                        </td>
                                        <td className="px-1 py-1 border-r border-slate-50 text-center font-black">{item.quantity}</td>
                                        <td className="hidden sm:table-cell px-1 py-1 border-r border-slate-50 text-right italic">{formatCurrency(Number(item.unitPrice))}</td>
                                        <td className="px-1 py-1 text-right font-black text-slate-900">{formatCurrency(Number(item.totalPrice))}</td>
                                    </tr>
                                ))}
                                {(!data?.items || data.items.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-300 italic">Chưa chọn sản phẩm</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="ml-auto w-full md:w-[200px] space-y-1 mb-6">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Tổng cộng:</span>
                            <span className="text-xs font-black text-slate-900">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-emerald-600">
                            <span className="text-[9px] font-bold uppercase">Đã thanh toán:</span>
                            <span className="text-xs font-black">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 text-rose-600">
                            <span className="text-[9px] font-bold uppercase">Còn lại:</span>
                            <span className="text-xs font-black">{formatCurrency(remaining)}</span>
                        </div>
                    </div>

                    {/* Note Section */}
                    <div className="mb-6">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Ghi chú đơn hàng:</span>
                        <div className="bg-slate-50/50 rounded-lg p-2 text-[9px] text-slate-600 min-h-[50px] italic border-l-2 border-slate-200">
                            {data?.note || 'Không có ghi chú.'}
                        </div>
                    </div>

                    {/* Payment History Breakdown */}
                    <div className="mt-auto pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={10} className="text-slate-400" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Thông tin thanh toán</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                            {(data?.payments || []).map((p: any, i: number) => (
                                <div key={i} className="flex justify-between items-center bg-slate-50/50 p-1.5 rounded-lg border border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-700 leading-none">
                                            {p.paymentMethod === 'CASH' ? '💰 Tiền mặt' : '🏦 Chuyển khoản'}
                                        </span>
                                        <span className="text-[7px] text-slate-400 mt-0.5">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('vi-VN') : '---'}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-900">{formatCurrency(Number(p.amount))}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Document Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-end">
                        <div className="text-[7px] text-slate-300 font-bold italic">
                            ID: {data?.id?.substring(0, 8).toUpperCase() || '---'}
                        </div>
                        <div className="text-[7px] text-slate-300 font-bold uppercase tracking-[0.4em]">
                            He thong Ohari ERP
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 md:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#f0f2f5] w-full max-w-5xl h-full max-h-[98vh] rounded-2xl md:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 border-4 md:border-[8px] border-white/20">
                {/* Custom Header */}
                <div className="bg-slate-900 px-4 py-4 md:px-6 md:py-5 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[100px] -mr-32 -mt-32" />

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                            <ArrowUpDown size={24} className="text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight leading-none mb-1.5">Đối Chiếu Lịch Sử Thay Đổi</h3>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/10 text-white/90 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wide border border-white/5">Hóa Đơn: #{log.order?.id?.substring(0, 8)}</span>
                                <span className={cn(
                                    "text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wide border",
                                    isCreate ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                )}>
                                    {isCreate ? 'Tạo Mới' : 'Cập Nhật'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-rose-600 text-white rounded-xl transition-all active:scale-90 border border-white/5 shadow-inner cursor-pointer relative z-10">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">

                    {/* Visual Change Summary Card */}
                    <div className="bg-white rounded-2xl p-3 md:p-4 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                            <TrendingUp size={20} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-1">Tóm tắt các điểm khác biệt</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {changes.map((item, i) => (
                                    <div key={i} className="bg-slate-50/80 border border-slate-100 p-2 rounded-lg flex flex-col gap-0.5 shadow-sm">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.label}</span>
                                        <span className="text-[10px] font-bold text-slate-800">{item.detail}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* The Double Bill View */}
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-12 pb-10 overflow-x-hidden">
                        <BillPaper
                            data={oldData}
                            title="1. Bản Cũ (Trước Chỉnh Sửa)"
                            type="old"
                        />

                        <div className="hidden lg:flex items-center justify-center p-4">
                            <div className="w-14 h-14 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-white shadow-2xl relative">
                                <ArrowRight size={28} />
                                <div className="absolute inset-0 rounded-full animate-ping bg-slate-900/20 pointer-events-none" />
                            </div>
                        </div>

                        <BillPaper
                            data={newData}
                            title="2. Bản Mới (Sau Chỉnh Sửa)"
                            type="new"
                        />
                    </div>
                </div>

                {/* Custom Fine-Line Footer */}
                <div className="bg-white border-t border-slate-100 px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="space-y-1 text-center sm:text-left">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-wide flex items-center justify-center sm:justify-start gap-1.5">
                            <CheckCircle2 size={10} /> Hệ thống kiểm soát Ohari
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">Ghi nhận lúc: {new Date(log.changedAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-2.5 bg-slate-900 text-white rounded-lg md:rounded-xl text-xs font-black hover:bg-slate-800 shadow-lg shadow-slate-400 tracking-wider transition-all active:scale-95 uppercase cursor-pointer"
                    >
                        Đã rõ thông tin
                    </button>
                </div>
            </div>
        </div>
    );
}
