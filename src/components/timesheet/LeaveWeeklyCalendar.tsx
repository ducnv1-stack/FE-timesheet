"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Info, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfirmModal from '@/components/ui/confirm-modal';

interface LeaveWeeklyCalendarProps {
    branchId?: string;
    employeeId?: string; // If provided, only show for this employee
    currentEmployeeId?: string; // The ID of the logged-in employee (needed for ownership check)
    onAddLeave?: (data: { date: string, session: string }) => void;
    onEditLeave?: (leave: any) => void;
    onRefresh?: () => void;
    refreshTrigger?: number;
}

export default function LeaveWeeklyCalendar({ branchId, employeeId, currentEmployeeId, onAddLeave, onEditLeave, onRefresh, refreshTrigger }: LeaveWeeklyCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletingDate, setDeletingDate] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [weeklyLeaves, setWeeklyLeaves] = useState<any[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [activeTooltip, setActiveTooltip] = useState<{ id: string, x: number, y: number, leave: any, dateStr: string } | null>(null);

    useEffect(() => {
        const handleClose = (e?: Event) => {
            if (e && e.type === 'click' && (e.target as Element)?.closest?.('.leave-popover-container')) return;
            setActiveTooltip(null);
        };
        document.addEventListener('click', handleClose);
        window.addEventListener('scroll', handleClose, true);
        window.addEventListener('resize', handleClose);
        return () => {
            document.removeEventListener('click', handleClose);
            window.removeEventListener('scroll', handleClose, true);
            window.removeEventListener('resize', handleClose);
        };
    }, []);

    const getStyles = (type: string) => {
        switch(type) {
            case 'Nghỉ phép năm': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🌴' };
            case 'Nghỉ ốm': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🤒' };
            case 'Nghỉ thai sản': return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', icon: '👶' };
            case 'Nghỉ việc riêng': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '☕' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '✨' };
        }
    };
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getFullImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

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
                ...(branchId ? { branchId } : {}),
                ...(employeeId ? { employeeId } : {})
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
    }, [currentDate, branchId, employeeId, refreshTrigger]);

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
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-collapse min-w-[600px] md:min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-3 sm:px-4 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] sm:text-xs min-w-[120px] sm:min-w-[160px]">
                                    Nhân viên
                                </th>
                                {weekDays.map((day, i) => {
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    return (
                                        <th key={i} className={cn(
                                            "px-2 py-4 text-center border-r border-slate-100 last:border-r-0 relative min-w-[110px] sm:min-w-[130px]",
                                            isToday ? "bg-indigo-50/30" : isWeekend ? "bg-slate-50/50" : ""
                                        )}>
                                            <div className="flex flex-col items-center gap-0.5 z-10 relative">
                                                <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-tighter", isWeekend ? "text-rose-400" : "text-slate-400")}>
                                                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}
                                                </span>
                                                <span className={cn(
                                                    "text-xs sm:text-sm font-black w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mt-0.5",
                                                    isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : isWeekend ? "text-rose-600" : "text-slate-700"
                                                )}>
                                                    {day.getDate()}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
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
                                employeesWithLeave.map((emp: any, rowIndex: number) => (
                                    <tr key={emp.id} className={cn("hover:bg-slate-50/50 transition-colors", rowIndex % 2 !== 0 ? "bg-slate-50/20" : "")}>
                                        <td className="px-2 sm:px-4 py-3 sm:py-4 border-r border-slate-100">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] sm:text-xs ring-2 ring-white overflow-hidden shrink-0">
                                                    {emp.avatarUrl && !imageErrors[emp.id] ? (
                                                        <img 
                                                            src={getFullImageUrl(emp.avatarUrl)!} 
                                                            alt="" 
                                                            className="w-full h-full object-cover"
                                                            onError={() => setImageErrors(prev => ({ ...prev, [emp.id]: true }))}
                                                        />
                                                    ) : (
                                                        emp.fullName.charAt(0)
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate min-w-[60px]">{emp.fullName}</span>
                                                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate min-w-[60px]">{emp.pos?.name || emp.branch?.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDays.map((date, i) => {
                                            const leaves = getLeaveOnDate(emp.id, date);
                                            const targetDateStr = formatDateLocal(date);
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            const isToday = date.toDateString() === new Date().toDateString();

                                            return (
                                                <td 
                                                    key={i} 
                                                    onClick={() => {
                                                        if (!leaves.some(l => l.leaveSession === 'ALL_DAY') && leaves.length < 2) {
                                                            const existingSession = leaves[0]?.leaveSession;
                                                            const suggested = existingSession === 'MORNING' ? 'AFTERNOON' : (existingSession === 'AFTERNOON' ? 'MORNING' : undefined);
                                                            onAddLeave?.({ date: targetDateStr, session: suggested || 'ALL_DAY' });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-0 py-1 sm:py-1.5 border-r border-slate-100 last:border-r-0 relative min-w-[50px] sm:min-w-[80px] h-[50px] sm:h-[64px] align-top",
                                                        isToday ? "bg-indigo-50/10" : isWeekend ? "bg-slate-50/30" : "",
                                                        (!leaves.some(l => l.leaveSession === 'ALL_DAY') && leaves.length < 2) && "cursor-pointer hover:bg-blue-50/20 transition-colors"
                                                    )}
                                                >
                                                    <div className="flex flex-row flex-wrap content-start gap-x-0 gap-y-0.5 h-full pt-1 px-1">
                                                        {leaves.map((l, idx) => {
                                                            const prevDate = new Date(date);
                                                            prevDate.setDate(prevDate.getDate() - 1);
                                                            const nextDate = new Date(date);
                                                            nextDate.setDate(nextDate.getDate() + 1);

                                                            const hasPrev = getLeaveOnDate(emp.id, prevDate).some(prevL => prevL.id === l.id && prevL.leaveSession === l.leaveSession);
                                                            const hasNext = getLeaveOnDate(emp.id, nextDate).some(nextL => nextL.id === l.id && nextL.leaveSession === l.leaveSession);

                                                            const styles = getStyles(l.leaveType);

                                                            const sessionClass = 
                                                                l.leaveSession === 'MORNING' ? "w-[50%] mr-auto rounded-r-none border-r-0 border-dashed" :
                                                                l.leaveSession === 'AFTERNOON' ? "w-[50%] ml-auto rounded-l-none border-l-0 border-dashed" : "w-full";

                                                            const continuityClass = cn(
                                                                hasPrev ? "rounded-l-none border-l-0 z-10" : "rounded-l-md",
                                                                hasNext ? "rounded-r-none border-r-0 z-10" : "rounded-r-md"
                                                            );

                                                            const isActive = activeTooltip?.id === l.id;

                                                            return (
                                                                <div 
                                                                    key={idx} 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isActive) {
                                                                            setActiveTooltip(null);
                                                                        } else {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setActiveTooltip({
                                                                                id: l.id,
                                                                                x: rect.left + rect.width / 2,
                                                                                y: rect.top, // top boundary
                                                                                leave: l,
                                                                                dateStr: targetDateStr
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "leave-popover-container group relative px-1 sm:px-1.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-semibold border flex items-center h-[20px] sm:h-[26px] overflow-hidden",
                                                                        styles.bg, styles.text, styles.border,
                                                                        l.leaveSession === 'ALL_DAY' ? cn("w-full", continuityClass) : sessionClass,
                                                                        "transition-all duration-200 hover:brightness-95 hover:z-20 cursor-pointer shadow-sm select-none",
                                                                        isActive && "ring-2 ring-indigo-400 brightness-95 shadow-md z-30"
                                                                    )}
                                                                >
                                                                    <span className="shrink-0 mr-1 text-[10px] sm:text-xs leading-none pb-0.5">
                                                                        {styles.icon}
                                                                    </span>
                                                                    <span className="flex-1 tracking-tight truncate">
                                                                        {l.leaveSession === 'MORNING' ? 'Sáng' : l.leaveSession === 'AFTERNOON' ? 'Chiều' : l.leaveType}
                                                                        {l.isRecurring && <span className="ml-0.5 opacity-70 scale-[0.6] sm:scale-75 inline-block origin-left">(CĐ)</span>}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
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

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                    <Info size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline-block">Chú giải:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-medium border-l border-slate-200 pl-2 sm:pl-4">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100"><span className="text-indigo-500 font-bold uppercase scale-75 text-[8px] border border-indigo-200 px-1 rounded bg-white">CĐ</span> Cố định</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 text-xs shadow-sm"><span className="pb-0.5">🌴</span> Phép năm</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100 text-xs shadow-sm"><span className="pb-0.5">🤒</span> Ốm</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-fuchsia-50 text-fuchsia-700 rounded-md border border-fuchsia-200 text-xs shadow-sm"><span className="pb-0.5">👶</span> Thai sản</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100 text-xs shadow-sm"><span className="pb-0.5">☕</span> Việc riêng</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-700 rounded-md border border-slate-200 text-xs shadow-sm"><span className="pb-0.5">✨</span> Khác</span>
                </div>
            </div>

            {/* Global Fixed Tooltip */}
            {activeTooltip && (() => {
                const styles = getStyles(activeTooltip.leave.leaveType);
                const l = activeTooltip.leave;
                return (
                    <div 
                        className="fixed z-[9999] -translate-x-1/2 -translate-y-full pb-2 leave-popover-container pointer-events-auto w-max max-w-[220px] transition-opacity duration-200"
                        style={{ left: activeTooltip.x, top: activeTooltip.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-slate-800 text-white p-3 rounded-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.4)] flex flex-col gap-2 relative">
                            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 border-[6px] border-transparent border-t-slate-800"></div>
                            
                            <div className="font-bold text-xs border-b border-slate-700 pb-1.5 mb-0.5 flex items-center gap-1.5 break-words whitespace-normal leading-tight">
                                <span className="text-base leading-none pb-0.5">{styles.icon}</span> {l.leaveType}
                            </div>
                            <div className="text-[10px] text-slate-300 leading-relaxed font-normal">
                                <span className="font-semibold text-slate-200">Buổi:</span> {l.leaveSession === 'ALL_DAY' ? 'Cả ngày' : l.leaveSession === 'MORNING' ? 'Sáng' : 'Chiều'}<br/>
                                {l.reason && (
                                    <div className="mt-1.5 p-1.5 bg-slate-700/50 rounded flex flex-col gap-1">
                                        <span className="text-slate-200 italic">"{l.reason}"</span>
                                    </div>
                                )}
                            </div>
                            {(!employeeId || l.employeeId === currentEmployeeId) && (
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditLeave?.(l);
                                            setActiveTooltip(null);
                                        }}
                                        className="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-inner cursor-pointer"
                                    >
                                        <Pencil size={12} /> Chỉnh sửa đơn
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteLeave(l.id, activeTooltip.dateStr);
                                            setActiveTooltip(null);
                                        }}
                                        className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-inner cursor-pointer"
                                    >
                                        <Trash2 size={12} /> Xóa đơn này
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

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
