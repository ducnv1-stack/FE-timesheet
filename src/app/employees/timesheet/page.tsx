"use client";

import { useState, useEffect } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertCircle,
    CheckCircle2,
    Timer,
    Coffee,
    TrendingUp,
    CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function TimesheetPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const { error: toastError } = useToast();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.employee?.id) {
            fetchTimesheet();
        }
    }, [currentUser, currentDate]);

    const fetchTimesheet = async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/timesheet?employeeId=${currentUser.employee.id}&month=${month}&year=${year}`);
            const timesheetData = await res.json();
            setData(timesheetData);
        } catch (error) {
            console.error('Error fetching timesheet:', error);
            toastError('Không thể tải bảng công');
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getDayName = (date: Date) => {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[date.getDay()];
    };

    // Tính toán tổng kết tháng
    const stats = {
        totalWorkDays: data.filter(d => d.checkInTime).length,
        lateDays: data.filter(d => d.checkInStatus === 'LATE' || d.checkInStatus === 'LATE_SERIOUS').length,
        earlyLeaveDays: data.filter(d => d.checkOutStatus === 'EARLY_LEAVE').length,
        totalOvertimeHours: (data.reduce((acc, d) => acc + (d.overtimeMinutes || 0), 0) / 60).toFixed(1),
    };

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight flex items-center gap-2">
                        <CalendarDays className="text-rose-600" />
                        Bảng công tháng
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Theo dõi chi tiết giờ công và trạng thái đi làm</p>
                </div>

                <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
                    <button onClick={prevMonth} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-4 py-1 text-center min-w-[140px]">
                        <span className="text-sm font-bold text-slate-900 font-outfit uppercase">
                            Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
                        </span>
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard label="Ngày công" value={stats.totalWorkDays} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Đi muộn" value={stats.lateDays} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
                <StatCard label="Về sớm" value={stats.earlyLeaveDays} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Tăng ca" value={stats.totalOvertimeHours} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
            </div>

            {/* Timesheet Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Ngày</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Thứ</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Vào</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Ra</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">Muộn</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">Sớm</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">TC</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-medium">
                                        Chưa có dữ liệu chấm công cho tháng này
                                    </td>
                                </tr>
                            ) : (
                                data.map((row) => {
                                    const date = new Date(row.date);
                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <span className="text-[11px] md:text-sm font-bold text-slate-700">{date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}</span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">{getDayName(date).replace('Thứ ', 'T')}</span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <span className={cn("text-xs md:text-sm font-black", row.checkInTime ? "text-slate-900" : "text-slate-300")}>
                                                    {formatTime(row.checkInTime)}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <span className={cn("text-xs md:text-sm font-black", row.checkOutTime ? "text-slate-900" : "text-slate-300")}>
                                                    {formatTime(row.checkOutTime)}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                                <span className={cn("text-xs md:text-sm font-bold", row.lateMinutes > 0 ? "text-rose-600" : "text-slate-300")}>
                                                    {row.lateMinutes || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                                <span className={cn("text-xs md:text-sm font-bold", row.earlyLeaveMinutes > 0 ? "text-amber-600" : "text-slate-300")}>
                                                    {row.earlyLeaveMinutes || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                                <span className={cn("text-xs md:text-sm font-bold", row.overtimeMinutes > 0 ? "text-blue-600" : "text-slate-300")}>
                                                    {row.overtimeMinutes || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                                <StatusBadge status={row.dailyStatus} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 border border-slate-100 shadow-sm flex flex-col gap-2 md:gap-3">
            <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center", bg, color)}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">{label}</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 font-outfit">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        'FULL_DAY': { label: 'Đủ công', class: 'bg-emerald-100 text-emerald-700' },
        'HALF_DAY': { label: 'Nửa công', class: 'bg-blue-100 text-blue-700' },
        'LATE_DAY': { label: 'Đi muộn', class: 'bg-rose-100 text-rose-700' },
        'ABSENT_UNAPPROVED': { label: 'Vắng (KP)', class: 'bg-slate-100 text-slate-700' },
        'ABSENT_APPROVED': { label: 'Vắng (CP)', class: 'bg-amber-100 text-amber-700' },
        'DEFAULT': { label: status, class: 'bg-slate-100 text-slate-400' }
    };

    const item = config[status] || config['DEFAULT'];

    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight", item.class)}>
            {item.label}
        </span>
    );
}
