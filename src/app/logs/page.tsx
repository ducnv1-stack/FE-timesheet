"use client";

import { useState, useEffect } from 'react';
import { ScrollText, Search, Filter, ChevronLeft, ArrowRight, User as UserIcon, Calendar, Clock, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import LogDetailModal from '@/components/logs/LogDetailModal';

export default function LogsPage() {
    const { error: toastError } = useToast();
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                router.push('/login');
                return;
            }

            const user = JSON.parse(storedUser);
            try {
                const res = await fetch(`${apiUrl}/orders/logs?userId=${user.id}`);
                if (!res.ok) throw new Error('Failed to fetch logs');
                const data = await res.json();
                setLogs(data);
            } catch (error) {
                console.error('Error fetching logs:', error);
                toastError('Không thể tải log hệ thống');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [router, toastError]);

    const filteredLogs = logs.filter(log =>
        log.order?.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changedByUser?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changedByUser?.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'create':
                return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Tạo mới</span>;
            case 'update':
                return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">Cập nhật</span>;
            case 'delete':
                return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase">Xóa</span>;
            default:
                return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase">{action}</span>;
        }
    };

    return (
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <ScrollText className="text-rose-600" size={28} />
                        Log Hệ Thống
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Lịch sử thay đổi và tác động lên dữ liệu đơn hàng</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-700"></div>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <ScrollText size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold">Không tìm thấy bản ghi nào</h3>
                    <p className="text-slate-500 text-sm mt-1">Hệ thống chưa ghi nhận log nào phù hợp với tìm kiếm của bạn.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Thời gian</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Người thực hiện</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Hành động</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Chi tiết đơn</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {new Date(log.changedAt).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                    <Clock size={12} className="text-slate-300" />
                                                    {new Date(log.changedAt).toLocaleTimeString('vi-VN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xs">
                                                    {log.changedByUser?.employee?.fullName?.charAt(0) || <UserIcon size={14} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 leading-none">
                                                        {log.changedByUser?.employee?.fullName || 'N/A'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium mt-1">
                                                        @{log.changedByUser?.username || 'unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                                                        #{log.order?.id.substring(0, 8)}
                                                    </span>
                                                    {log.order?.branch && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                                            {log.order.branch.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                                                    {log.action === 'create' ? 'Tạo mới đơn hàng' : 'Cập nhật nội dung đơn hàng'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLog(log);
                                                }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedLog && (
                <LogDetailModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
}
