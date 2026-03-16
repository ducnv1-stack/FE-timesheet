"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, User, Package, MapPin, Phone, CheckCircle, Clock } from 'lucide-react';
import { cn, formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface EmployeeOrdersModalProps {
    employee: any;
    month: number;
    year: number;
    onClose: () => void;
}

export default function EmployeeOrdersModal({ employee, month, year, onClose }: EmployeeOrdersModalProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { error: toastError } = useToast();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (employee) {
            fetchOrders();
        }
    }, [employee, month, year]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Tính toán startDate và endDate cho tháng được chọn
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

            const res = await fetch(`${API_URL}/orders?employeeId=${employee.employeeId}&startDate=${startDate}&endDate=${endDate}&limit=1000&tab=all`);
            if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng');
            const data = await res.json();

            // Lấy data từ response paginate
            const items = data.data || [];

            // Sort by createdAt desc
            items.sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

            setOrders(items);
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Package className="text-primary-light" />
                            Đơn hàng của {employee.fullName}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-4 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={14} /> Tháng {month}/{year}</span>
                            <span className="flex items-center gap-1"><User size={14} /> {employee.position || 'Nhân viên'}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary-subtle rounded-xl transition-colors cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Excel-like Table */}
                <div className="flex-1 overflow-auto bg-slate-50/30 p-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-auto max-h-[calc(90vh-140px)] custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-slate-100 border-b-2 border-slate-300 whitespace-nowrap">
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200">Thời gian</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200">Khách hàng</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200">Địa chỉ</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200">SĐT</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200 text-center">CCCD / Ngày cấp</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200">Tên nhân viên</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200">Tên hàng</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200 text-center">Số lượng</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase border-r border-slate-200 text-right">Tổng tiền</th>
                                        <th className="px-3 py-2.5 font-black text-slate-600 uppercase text-center">Thanh toán</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={10} className="px-4 py-6 bg-slate-50/50"></td>
                                            </tr>
                                        ))
                                    ) : orders.length > 0 ? (
                                        orders.map((order: any, idx) => (
                                            <tr key={order.id} className="hover:bg-primary-subtle/30 transition-colors group">
                                                {/* Thời gian */}
                                                <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100 align-top">
                                                    <div className="font-bold text-slate-700">{formatDate(order.orderDate)}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{formatDateTime(order.orderDate).split(' ')[1]}</div>
                                                </td>
                                                {/* Khách hàng */}
                                                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-800 border-r border-slate-100 align-top">
                                                    {order.customerName || 'Khách lẻ'}
                                                </td>
                                                {/* Địa chỉ */}
                                                <td className="px-3 py-2 min-w-[200px] text-slate-600 border-r border-slate-100 align-top">
                                                    {order.customerAddress || '-'}
                                                </td>
                                                {/* SĐT */}
                                                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-700 border-r border-slate-100 align-top">
                                                    {order.customerPhone || '-'}
                                                </td>
                                                {/* CCCD / Ngày cấp */}
                                                <td className="px-3 py-2 whitespace-nowrap text-center border-r border-slate-100 align-top">
                                                    <div className="font-bold text-slate-700">{order.customerCardNumber || '-'}</div>
                                                    {order.customerCardIssueDate && (
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(order.customerCardIssueDate)}</div>
                                                    )}
                                                </td>
                                                {/* Tên nhân viên */}
                                                <td className="px-3 py-2 whitespace-nowrap font-bold text-blue-700 border-r border-slate-100 align-top">
                                                    {employee.fullName}
                                                </td>
                                                {/* Tên hàng */}
                                                <td className="px-3 py-2 min-w-[200px] border-r border-slate-100 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        {order.items?.map((item: any, i: number) => (
                                                            <div key={i} className="text-slate-700 font-medium truncate">
                                                                • {item.product?.name || 'Sản phẩm ' + item.productId}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                {/* Số lượng */}
                                                <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100 align-top text-center">
                                                    <div className="flex flex-col gap-1">
                                                        {order.items?.map((item: any, i: number) => (
                                                            <div key={i} className="font-bold text-slate-700">
                                                                x{item.quantity}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                {/* Tổng tiền */}
                                                <td className="px-3 py-2 whitespace-nowrap text-right border-r border-slate-100 align-top">
                                                    {(() => {
                                                        const userSplit = order.splits?.find((s: any) => s.employeeId === employee.employeeId);
                                                        const displayAmount = userSplit ? userSplit.splitAmount : order.totalAmount;
                                                        return (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="font-black text-primary">{formatCurrency(displayAmount)}</div>
                                                                {userSplit && (
                                                                    <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1 rounded">
                                                                        (Chia DT: {formatCurrency(order.totalAmount)})
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                {/* Thanh toán */}
                                                <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                                                    {order.isPaymentConfirmed ? (
                                                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                                                            <CheckCircle size={10} /> Đã thu
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                                                            <Clock size={10} /> Chờ thu
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                                                <Package className="mx-auto mb-2 opacity-50" size={32} />
                                                <p className="font-medium">Chưa có đơn hàng nào trong tháng này</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
