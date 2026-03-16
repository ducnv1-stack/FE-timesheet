"use client";

import { useEffect, useState } from 'react';

import { X, Clock, User, PlusCircle, Edit3, ChevronRight } from 'lucide-react';
import { formatCurrency, cn, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import LogDetailModal from '../logs/LogDetailModal';

interface OrderAuditLogModalProps {
    orderId: string;
    onClose: () => void;
}

const statusMap: Record<string, string> = {
    pending: 'Chờ xử lý',
    assigned: 'Đang giao',
    delivered: 'Đã giao',
    canceled: 'Đã hủy',
    rejected: 'Đã hoàn/Sửa',
};

const getChangesSummary = (oldData: any, newData: any) => {
    const list: any[] = [];
    const isSame = (v1: any, v2: any) => {
        if (v1 === v2) return true;
        if (v1 == null || v2 == null) return v1 === v2;
        return String(v1) === String(v2);
    };
    const checkField = (field: string, label: string, isCurrency = false, isDate = false) => {
        const oldVal = oldData?.[field];
        const newVal = newData?.[field];
        if (!isSame(oldVal, newVal)) {
            const format = (v: any) => {
                if (!v) return '---';
                if (isCurrency) return formatCurrency(Number(v));
                if (isDate) return formatDate(v);
                return String(v);
            };
            list.push({ label, old: format(oldVal), new: format(newVal) });
        }
    };

    if (!isSame(oldData?.creatorId, newData?.creatorId)) {
        list.push({ label: 'Nhân viên lập', old: oldData?.creator?.employee?.fullName || oldData?.creator?.fullName || '---', new: newData?.creator?.employee?.fullName || newData?.creator?.fullName || '---' });
    }
    checkField('orderDate', 'Ngày đặt đơn', false, true);
    if (!isSame(oldData?.branchId, newData?.branchId)) {
        list.push({ label: 'Chi nhánh', old: oldData?.branch?.name || '---', new: newData?.branch?.name || '---' });
    }
    checkField('orderSource', 'Nguồn đơn');
    checkField('customerName', 'Khách hàng');
    checkField('customerPhone', 'Số điện thoại');

    const oldFullAddress = [oldData?.customerAddress, oldData?.ward?.name, oldData?.province?.name].filter(Boolean).join(', ');
    const newFullAddress = [newData?.customerAddress, newData?.ward?.name, newData?.province?.name].filter(Boolean).join(', ');
    if (oldFullAddress !== newFullAddress) {
        list.push({ label: 'Địa chỉ khách', old: oldFullAddress || '---', new: newFullAddress || '---' });
    }
    checkField('customerCardNumber', 'Số CCCD');
    checkField('customerCardIssueDate', 'Ngày cấp CCCD', false, true);
    checkField('status', 'Trạng thái đơn');

    if (oldData?.isPaymentConfirmed !== newData?.isPaymentConfirmed) {
        list.push({ label: 'Xác nhận tiền', old: oldData?.isPaymentConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận', new: newData?.isPaymentConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận' });
    }
    if (oldData?.isInvoiceIssued !== newData?.isInvoiceIssued) {
        list.push({ label: 'Xuất hóa đơn đỏ', old: oldData?.isInvoiceIssued ? 'Đã xuất' : 'Chưa xuất', new: newData?.isInvoiceIssued ? 'Đã xuất' : 'Chưa xuất' });
    }

    const getItemsKey = (items: any[]) => (items || []).map((i: any) => `${i.productId}-${i.quantity}-${i.unitPrice}`).sort().join('|');
    if (getItemsKey(oldData?.items) !== getItemsKey(newData?.items)) {
        list.push({ label: 'Sản phẩm', old: `${(oldData?.items || []).length} mặt hàng`, new: `${(newData?.items || []).length} mặt hàng` });
    }
    checkField('totalAmount', 'Tổng tiền đơn', true);
    checkField('note', 'Ghi chú');

    const getPaymentsKey = (payments: any[]) => (payments || []).map((p: any) => `${p.amount}-${p.paymentMethod}`).sort().join('|');
    if (getPaymentsKey(oldData?.payments) !== getPaymentsKey(newData?.payments)) {
        const oldPaid = (oldData?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        const newPaid = (newData?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        list.push({ label: 'Thanh toán', old: formatCurrency(oldPaid), new: formatCurrency(newPaid) });
    }

    const getGiftsKey = (gifts: any[]) => (gifts || []).map((g: any) => `${g.giftId}-${g.quantity}`).sort().join('|');
    if (getGiftsKey(oldData?.gifts) !== getGiftsKey(newData?.gifts)) {
        list.push({ label: 'Quà tặng', old: (oldData?.gifts || []).map((g: any) => `${g.gift?.name || g.name} (x${g.quantity})`).join(', ') || 'Không có', new: (newData?.gifts || []).map((g: any) => `${g.gift?.name || g.name} (x${g.quantity})`).join(', ') || 'Không có' });
    }

    const getSplitsKey = (splits: any[]) => (splits || []).map((s: any) => `${s.employeeId}-${s.splitPercent}`).sort().join('|');
    if (getSplitsKey(oldData?.splits) !== getSplitsKey(newData?.splits)) {
        list.push({ label: 'Chia doanh số', old: (oldData?.splits || []).map((s: any) => `${s.employee?.fullName} (${s.splitPercent}%)`).join(', ') || '---', new: (newData?.splits || []).map((s: any) => `${s.employee?.fullName} (${s.splitPercent}%)`).join(', ') || '---' });
    }

    const getImagesKey = (images: string[]) => (images || []).sort().join('|');
    if (getImagesKey(oldData?.images) !== getImagesKey(newData?.images)) {
        list.push({ label: 'Ảnh đính kèm', old: `${(oldData?.images || []).length} ảnh`, new: `${(newData?.images || []).length} ảnh` });
    }

    return list;
};

export default function OrderAuditLogModal({ orderId, onClose }: OrderAuditLogModalProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const { error: toastError } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                const res = await fetch(`${apiUrl}/orders/${orderId}/audit-logs?userId=${userObj.id}`);
                if (!res.ok) throw new Error('Không thể tải lịch sử');
                const data = await res.json();

                // Fetch user info for each log since BE might return raw UUID
                // Optional: we can just display the UUID or if BE already joins user, it's better.
                // In our current BE, we only saved changedBy UUID. We should fetch users map if needed, 
                // but let's just display it normally first.
                setLogs(data);
            } catch (err: any) {
                toastError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchLogs();
        }
    }, [orderId]);

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Lịch sử chỉnh sửa</h2>
                            <p className="text-xs font-bold text-slate-500">Mã đơn: #{orderId.split('-')[0]}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-medium">
                            Không có lịch sử chỉnh sửa nào cho đơn hàng này.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {logs.map((log) => (
                                <div key={log.id} className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 last:border-l-transparent pb-6 last:pb-0">
                                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500 shadow-sm" />
                                    <div
                                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1",
                                                    log.action === 'create' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                                )}>
                                                    {log.action === 'create' ? <PlusCircle size={10} /> : <Edit3 size={10} />}
                                                    {log.action === 'create' ? 'Tạo mới' : 'Cập nhật'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                    {formatDateTime(log.changedAt)}
                                                    {log.changedByUser && (
                                                        <span className="text-[11px] font-normal text-slate-400">
                                                            bởi <span className="font-bold text-slate-600">{log.changedByUser.employee?.fullName || log.changedByUser.username}</span>
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase group-hover:text-blue-700 transition-colors">
                                                XEM CHI TIẾT <ChevronRight size={12} />
                                            </div>
                                        </div>

                                        {/* Hiển thị tóm tắt dữ liệu */}
                                        {log.action === 'create' ? (
                                            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                                                <div className="font-medium">
                                                    <span className="text-slate-400">Khách hàng:</span> <span className="font-bold text-slate-700">{log.newData?.customerName} ({log.newData?.customerPhone})</span>
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-slate-400">Tổng tiền:</span> <span className="font-bold text-primary">{formatCurrency(log.newData?.totalAmount)}</span>
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-slate-400">Trạng thái:</span> <span className="font-bold text-slate-700 uppercase">{statusMap[log.newData?.status] || log.newData?.status}</span>
                                                </div>
                                                <div className="font-medium whitespace-pre-wrap">
                                                    <span className="text-slate-400">Sản phẩm:</span> {log.newData?.items?.map((i: any) => `${i.product?.name || 'SP'} x${i.quantity}`).join(', ')}
                                                </div>
                                            </div>
                                        ) : (
                                            (() => {
                                                const changes = getChangesSummary(log.oldData, log.newData);
                                                if (changes.length === 0) {
                                                    return (
                                                        <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                                                            Không có thay đổi dữ liệu quan trọng
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                                                        {changes.map((c, i) => (
                                                            <div key={i} className="flex flex-col gap-0.5">
                                                                <span className="text-slate-500 font-bold">{c.label}:</span>
                                                                <div className="flex items-center gap-2 text-[11px] font-medium pl-2 border-l-2 border-slate-200">
                                                                    {c.label === 'Trạng thái đơn' ? (
                                                                        <>
                                                                            <span className="line-through text-slate-400 uppercase">{statusMap[c.old] || c.old}</span>
                                                                            <span className="text-slate-300">→</span>
                                                                            <span className="text-emerald-600 uppercase">{statusMap[c.new] || c.new}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className="line-through text-slate-400">{c.old}</span>
                                                                            <span className="text-slate-300">→</span>
                                                                            <span className="text-emerald-600">{c.new}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedLog && (
                <div onClick={(e) => e.stopPropagation()}>
                    <LogDetailModal
                        log={{ ...selectedLog, order: { id: orderId } }}
                        onClose={() => setSelectedLog(null)}
                    />
                </div>
            )}
        </div>
    );
}
