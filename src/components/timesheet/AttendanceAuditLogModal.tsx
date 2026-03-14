"use client";

import { useState, useEffect } from 'react';
import { X, History, User, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceAuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any;
}

export default function AttendanceAuditLogModal({
    isOpen,
    onClose,
    record
}: AttendanceAuditLogModalProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (isOpen && record?.id) {
            fetchLogs();
        }
    }, [isOpen, record]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/attendance/audit-logs?attendanceId=${record.id}`);
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatTime = (dateStr: any) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const actionLabels: Record<string, string> = {
        'MANUAL_ADJUST': 'Hiệu chỉnh thủ công',
        'EXCEPTION_APPROVED_GO_LATE': 'Phê duyệt giải trình muộn',
        'EXCEPTION_APPROVED_LEAVE_EARLY': 'Phê duyệt giải trình về sớm',
        'EXCEPTION_APPROVED_GPS_ERROR': 'Phê duyệt giải trình GPS',
        'EXCEPTION_APPROVED_FORGOT_CHECKIN': 'Phê duyệt quên check-in',
        'EXCEPTION_APPROVED_FORGOT_CHECKOUT': 'Phê duyệt quên check-out',
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 space-y-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <History size={22} className="text-primary" />
                        Lịch sử chỉnh sửa công
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2 shrink-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày công</p>
                    <p className="text-sm font-bold text-slate-700">
                        {new Date(record.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <p className="text-sm font-bold">Đang tải lịch sử...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-medium italic">
                            Chưa có lịch sử chỉnh sửa cho ngày này
                        </div>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={log.id} className="relative pl-8 pb-4">
                                {/* Timeline line */}
                                {idx !== logs.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100"></div>}
                                
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-white border-4 border-primary flex items-center justify-center z-10"></div>
                                
                                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:border-primary/20 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black px-2 py-0.5 bg-primary-light text-primary rounded-md uppercase tracking-tighter">
                                                {actionLabels[log.action] || log.action}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                <Clock size={10} /> {new Date(log.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dữ liệu cũ</p>
                                                <div className="text-[11px] font-bold text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    {log.oldData ? (
                                                        <>
                                                            {log.oldData.checkInTime && <p>Vào: {formatTime(log.oldData.checkInTime)}</p>}
                                                            {log.oldData.checkOutTime && <p>Ra: {formatTime(log.oldData.checkOutTime)}</p>}
                                                            {log.oldData.lateMinutes !== undefined && <p>Muộn: {log.oldData.lateMinutes}p</p>}
                                                            {log.oldData.dailyStatus && <p>TT: {log.oldData.dailyStatus}</p>}
                                                        </>
                                                    ) : 'Bản ghi mới'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dữ liệu mới</p>
                                                <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                    {log.newData ? (
                                                        <>
                                                            {log.newData.checkInTime && <p>Vào: {formatTime(log.newData.checkInTime)}</p>}
                                                            {log.newData.checkOutTime && <p>Ra: {formatTime(log.newData.checkOutTime)}</p>}
                                                            {log.newData.lateMinutes !== undefined && <p>Muộn: {log.newData.lateMinutes}p</p>}
                                                            {log.newData.dailyStatus && <p>TT: {log.newData.dailyStatus}</p>}
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        {log.reason && (
                                            <div className="pt-2 border-t border-slate-50">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lý do / Ghi chú</p>
                                                <p className="text-[11px] font-bold text-slate-600 italic">"{log.reason}"</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-2 text-[10px]">
                                            <User size={12} className="text-slate-400" />
                                            <span className="text-slate-500">Thực hiện bởi: </span>
                                            <span className="font-bold text-slate-700">{log.user?.employee?.fullName || log.user?.username}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="shrink-0 pt-4 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white font-bold text-sm tracking-tight rounded-xl shadow-lg hover:bg-slate-700 transition-all">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
