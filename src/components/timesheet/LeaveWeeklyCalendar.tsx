"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfirmModal from '@/components/ui/confirm-modal';

interface LeaveWeeklyCalendarProps {
    branchId?: string;
    onAddLeave?: (employeeId: string, date: string, suggestedSession?: string) => void;
    onRefresh?: () => void;
}

export default function LeaveWeeklyCalendar({ branchId, onAddLeave, onRefresh }: LeaveWeeklyCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletingDate, setDeletingDate] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [weeklyLeaves, setWeeklyLeaves] = useState<any[]>([]);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Get Monday of the current week
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const formatDateLocal = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const fetchWeeklySummary = async () => {
        setLoading(true);
        try {
            const startStr = formatDateLocal(startOfWeek);
            const endStr = formatDateLocal(endOfWeek);
            const params = new URLSearchParams({
                startDate: startStr,
                endDate: endStr,
                ...(branchId ? { branchId } : {})
            });
            const res = await fetch(`${API_URL}/leave-requests/weekly?${params.toString()}`);
            const data = await res.json();
            setWeeklyLeaves(data);
        } catch (error) {
            console.error("Failed to fetch weekly summary", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeeklySummary();
    }, [currentDate, branchId]);

    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Grouping logic: Get unique employees who have leave in this week
    const employeesWithLeave = Array.from(new Set(weeklyLeaves.map(l => l.employee.id)))
        .map(id => weeklyLeaves.find(l => l.employee.id === id).employee);

    const handleDeleteLeave = async (id: string, specificDate?: string) => {
        setDeletingId(id);
        setDeletingDate(specificDate || null);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        
        setShowConfirmModal(false);
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/leave-requests/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    isAdmin: true,
                    specificDate: deletingDate 
                })
            });
            if (res.ok) {
                fetchWeeklySummary();
                onRefresh?.();
            }
        } catch (error) {
            console.error("Failed to delete leave request", error);
        } finally {
            setLoading(false);
            setDeletingId(null);
            setDeletingDate(null);
        }
    };

    // Helper to check if an employee has leave on a specific date
    const getLeaveOnDate = (employeeId: string, date: Date) => {
        const targetDateStr = formatDateLocal(date);
        const dayOfWeek = date.getDay(); // 0-6 (Sun-Sat)

        return weeklyLeaves.filter(l => {
            if (l.employeeId !== employeeId) return false;
            
            // Normalize database dates to local strings for comparison
            const leaveStartDateStr = formatDateLocal(new Date(l.startDate));
            const leaveEndDateStr = formatDateLocal(new Date(l.endDate));

            if (l.isRecurring) {
                if (targetDateStr < leaveStartDateStr) return false;
                return l.recurringDays.includes(dayOfWeek);
            } else {
                return targetDateStr >= leaveStartDateStr && targetDateStr <= leaveEndDateStr;
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Header / Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 tracking-tight">Lịch nghỉ tuần</h3>
                        <p className="text-[10px] text-slate-500 font-medium">{startOfWeek.toLocaleDateString('vi-VN')} - {endOfWeek.toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={prevWeek} className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer">
                        <ChevronLeft size={18} className="text-slate-600" />
                    </button>
                    <button onClick={goToToday} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer">
                        Hôm nay
                    </button>
                    <button onClick={nextWeek} className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer">
                        <ChevronRight size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[200px] border-r border-slate-100">Nhân viên</th>
                                {weekDays.map((day, i) => (
                                    <th key={i} className={cn(
                                        "px-2 py-4 text-center border-r border-slate-100 last:border-r-0",
                                        day.toDateString() === new Date().toDateString() ? "bg-indigo-50/30" : ""
                                    )}>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}
                                            </span>
                                            <span className={cn(
                                                "text-sm font-black w-7 h-7 flex items-center justify-center rounded-full",
                                                day.toDateString() === new Date().toDateString() ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-700"
                                            )}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-6 border-r border-slate-100"><div className="h-8 bg-slate-100 rounded-lg w-full"></div></td>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-2 py-6 border-r border-slate-100 last:border-r-0"><div className="h-10 bg-slate-50 rounded-lg w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : employeesWithLeave.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                                <User size={24} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400 italic">Không có lịch nghỉ nào trong tuần này</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                employeesWithLeave.map((emp: any) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-4 py-4 border-r border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[11px] font-bold text-slate-700 truncate">{emp.fullName}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium truncate">{emp.pos?.name || emp.branch?.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDays.map((date, i) => {
                                            const leaves = getLeaveOnDate(emp.id, date);
                                            const targetDateStr = formatDateLocal(date);
                                            return (
                                                <td 
                                                    key={i} 
                                                    onClick={() => {
                                                        if (!leaves.some(l => l.leaveSession === 'ALL_DAY') && leaves.length < 2) {
                                                            const existingSession = leaves[0]?.leaveSession;
                                                            const suggested = existingSession === 'MORNING' ? 'AFTERNOON' : (existingSession === 'AFTERNOON' ? 'MORNING' : undefined);
                                                            onAddLeave?.(emp.id, targetDateStr, suggested);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-1 py-1 border-r border-slate-100 last:border-r-0 relative min-w-[80px] h-full",
                                                        date.toDateString() === new Date().toDateString() ? "bg-indigo-50/10" : "",
                                                        (!leaves.some(l => l.leaveSession === 'ALL_DAY') && leaves.length < 2) && "cursor-pointer hover:bg-blue-50/30 transition-colors"
                                                    )}
                                                >
                                                    <div className="flex flex-col gap-1 h-full min-h-[40px] justify-center">
                                                        {leaves.map((l, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className={cn(
                                                                    "group/bar px-1.5 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter border truncate relative overflow-hidden",
                                                                    l.leaveType === 'Nghỉ phép năm' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                    l.leaveType === 'Nghỉ việc riêng' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                                    "bg-amber-50 text-amber-700 border-amber-100",
                                                                    l.leaveSession === 'MORNING' ? "w-1/2 mr-auto rounded-r-none border-r-0" :
                                                                    l.leaveSession === 'AFTERNOON' ? "w-1/2 ml-auto rounded-l-none border-l-0" : "w-full"
                                                                )}
                                                                title={`${l.leaveType}${l.isRecurring ? ' (Cố định)' : ''}: ${l.reason || ''}`}
                                                            >
                                                                {l.leaveType.split(' ').map((w: string) => w[0]).join('')}
                                                                {l.isRecurring && <span className="ml-0.5">•</span>}

                                                                {/* Delete button shown on hover */}
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteLeave(l.id, targetDateStr);
                                                                    }}
                                                                    className="absolute inset-y-0 right-0 bg-rose-600 text-white px-1 opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <Trash2 size={10} className="cursor-pointer" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Info size={14} className="text-slate-400" />
                <p className="text-[10px] text-slate-500 font-medium">
                    <span className="text-indigo-600 font-bold mr-2">• Nghỉ cố định</span>
                    <span className="mr-2">NP: Nghỉ phép năm</span>
                    <span className="mr-2">VR: Việc riêng</span>
                    <span>O: Nghỉ ốm / Khác</span>
                </p>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                title="Xác nhận xóa đơn nghỉ"
                message={deletingDate 
                    ? `Bạn có chắc chắn muốn xóa ngày ${new Date(deletingDate).toLocaleDateString('vi-VN')} khỏi đơn nghỉ này? Hệ thống sẽ tự động hoàn tác bảng công.`
                    : "Bạn có chắc chắn muốn xóa toàn bộ đơn nghỉ này? Hành động này không thể hoàn tác."
                }
                confirmLabel="Xóa đơn"
                cancelLabel="Hủy"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setDeletingId(null);
                    setDeletingDate(null);
                }}
            />
        </div>
    );
}
