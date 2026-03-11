"use client";

import { useState, useEffect } from 'react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Search,
    Building2,
    ArrowLeft,
    Briefcase,
    RotateCcw,
    X,
    Settings,
    Plus,
    Pencil,
    Trash2,
    Save,
    Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import SalarySettingsTab from '@/components/timesheet/SalarySettingsTab';

type ActiveTab = 'MY' | 'EMPLOYEES' | 'SETTINGS' | 'SALARY_SETTINGS';
type ViewMode = 'LIST' | 'DETAIL'; // LIST is summary, DETAIL is individual daily view

export default function TimesheetPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('MY');
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [detailData, setDetailData] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [positions, setPositions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const { error: toastError } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    // Settings tab state
    const [shifts, setShifts] = useState<any[]>([]);
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);
    const [shiftForm, setShiftForm] = useState({
        branchId: '', name: '', startTime: '08:00', endTime: '17:30',
        breakMinutes: 0, lateThreshold: 15, lateSeriousThreshold: 30, earlyLeaveThreshold: 15
    });
    const [savingShift, setSavingShift] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getFullImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handleImageError = (key: string) => {
        setImageErrors(prev => ({ ...prev, [key]: true }));
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);

            const roleCode = user.role?.code;
            const canViewOthers = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'MANAGER', 'ADMIN'].includes(roleCode);

            // Default to 'MY' (Công cá nhân) as requested
            setActiveTab('MY');

            if (canViewOthers) {
                if (roleCode === 'MANAGER') {
                    setSelectedBranch(user.employee?.branchId || '');
                }
            } else {
                setSelectedEmployee(user.employee);
            }
        }
        fetchBranches();
        fetchPositions();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_URL}/branches`);
            const data = await res.json();
            setBranches(data);
        } catch (error) { }
    };

    const fetchPositions = async () => {
        try {
            const res = await fetch(`${API_URL}/employees/positions`);
            const data = await res.json();
            setPositions(data);
        } catch (error) { }
    };

    useEffect(() => {
        if (!currentUser) return;

        if (activeTab === 'EMPLOYEES') {
            if (viewMode === 'LIST') {
                fetchSummary();
            } else if (selectedEmployee) {
                fetchDetail();
            }
        } else if (activeTab === 'SETTINGS') {
            fetchShifts();
        } else {
            fetchMyDetail();
        }
    }, [currentUser, activeTab, viewMode, currentDate, selectedBranch, selectedPosition, selectedEmployee]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const params = new URLSearchParams({
                month: month.toString(),
                year: year.toString(),
                ...(selectedBranch ? { branchId: selectedBranch } : {}),
                ...(selectedPosition ? { position: selectedPosition } : {})
            });
            const res = await fetch(`${API_URL}/attendance/summary?${params.toString()}`);
            const data = await res.json();
            setSummaryData(data);
        } catch (error) {
            toastError('Không thể tải bảng tổng hợp');
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async () => {
        if (!selectedEmployee) return;
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const res = await fetch(`${API_URL}/attendance/timesheet?employeeId=${selectedEmployee.id}&month=${month}&year=${year}`);
            const data = await res.json();
            setDetailData(data);
        } catch (error) {
            toastError('Không thể tải bảng công chi tiết');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyDetail = async () => {
        if (!currentUser?.employee?.id) return;
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const res = await fetch(`${API_URL}/attendance/timesheet?employeeId=${currentUser.employee.id}&month=${month}&year=${year}`);
            const data = await res.json();
            setDetailData(data);
        } catch (error) {
            toastError('Không thể tải bảng công của bạn');
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

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedPosition('');
        if (currentUser?.role?.code !== 'MANAGER') {
            setSelectedBranch('');
        }
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getDayName = (date: Date) => {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[date.getDay()];
    };

    const handleSelectEmployee = (emp: any) => {
        setSelectedEmployee(emp);
        setViewMode('DETAIL');
    };

    const handleBackToSummary = () => {
        setViewMode('LIST');
        setDetailData([]);
    };

    const roleCode = currentUser?.role?.code;
    const canViewOthers = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'MANAGER', 'ADMIN'].includes(roleCode);
    const canManageSettings = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MANAGER', 'ADMIN'].includes(roleCode);
    const isManager = roleCode === 'MANAGER';

    // ========== SHIFT CRUD ==========
    const fetchShifts = async () => {
        try {
            const res = await fetch(`${API_URL}/attendance/shifts`);
            const data = await res.json();
            setShifts(data);
        } catch (error) { }
    };

    const resetShiftForm = () => {
        setShiftForm({ branchId: '', name: '', startTime: '08:00', endTime: '17:30', breakMinutes: 0, lateThreshold: 15, lateSeriousThreshold: 30, earlyLeaveThreshold: 15 });
        setEditingShift(null);
        setShowShiftForm(false);
    };

    const openEditShift = (shift: any) => {
        setShiftForm({
            branchId: shift.branchId, name: shift.name, startTime: shift.startTime, endTime: shift.endTime,
            breakMinutes: shift.breakMinutes, lateThreshold: shift.lateThreshold,
            lateSeriousThreshold: shift.lateSeriousThreshold, earlyLeaveThreshold: shift.earlyLeaveThreshold
        });
        setEditingShift(shift);
        setShowShiftForm(true);
    };

    const handleSaveShift = async () => {
        if (!shiftForm.branchId || !shiftForm.name) return;
        setSavingShift(true);
        try {
            const url = editingShift
                ? `${API_URL}/attendance/shifts/${editingShift.id}`
                : `${API_URL}/attendance/shifts`;
            const method = editingShift ? 'PATCH' : 'POST';
            await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shiftForm)
            });
            resetShiftForm();
            fetchShifts();
        } catch (error) {
            toastError('Lỗi khi lưu ca làm việc');
        } finally { setSavingShift(false); }
    };

    const handleDeleteShift = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa ca làm việc này?')) return;
        try {
            const res = await fetch(`${API_URL}/attendance/shifts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                toastError(err.message || 'Không thể xóa');
                return;
            }
            fetchShifts();
        } catch (error) { toastError('Lỗi khi xóa'); }
    };

    const handleToggleShift = async (shift: any) => {
        try {
            await fetch(`${API_URL}/attendance/shifts/${shift.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !shift.isActive })
            });
            fetchShifts();
        } catch (error) { toastError('Lỗi khi cập nhật'); }
    };

    const currentStats = {
        totalWorkDays: detailData.filter(d => d.checkInTime).length,
        lateDays: detailData.filter(d => d.checkInStatus === 'LATE' || d.checkInStatus === 'LATE_SERIOUS').length,
        earlyLeaveDays: detailData.filter(d => d.checkOutStatus === 'EARLY_LEAVE').length,
        totalOvertimeHours: (detailData.reduce((acc, d) => acc + (d.overtimeMinutes || 0), 0) / 60).toFixed(1),
    };

    // Client-side filtering for relative search (accent/case insensitive style)
    const filteredSummaryData = summaryData.filter(row =>
        row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center gap-3">
                    {activeTab === 'EMPLOYEES' && viewMode === 'DETAIL' && (
                        <button
                            onClick={handleBackToSummary}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 cursor-pointer"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        {(activeTab === 'MY' || (activeTab === 'EMPLOYEES' && viewMode === 'DETAIL')) && (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-rose-50 border border-slate-100 shrink-0 flex items-center justify-center">
                                {activeTab === 'MY' ? (
                                    (currentUser?.employee?.avatarUrl && !imageErrors['my-avatar']) ? (
                                        <img
                                            src={getFullImageUrl(currentUser.employee.avatarUrl)!}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError('my-avatar')}
                                        />
                                    ) : (
                                        <div className="text-rose-500 font-black text-lg">{currentUser?.employee?.fullName?.split(' ').pop()?.charAt(0)}</div>
                                    )
                                ) : (
                                    (selectedEmployee?.avatarUrl && !imageErrors[`emp-${selectedEmployee.id}`]) ? (
                                        <img
                                            src={getFullImageUrl(selectedEmployee.avatarUrl)!}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError(`emp-${selectedEmployee.id}`)}
                                        />
                                    ) : (
                                        <div className="text-rose-500 font-black text-lg">{selectedEmployee?.fullName?.split(' ').pop()?.charAt(0)}</div>
                                    )
                                )}
                            </div>
                        )}
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight flex items-center gap-2 leading-none">
                                {!(activeTab === 'MY' || (activeTab === 'EMPLOYEES' && viewMode === 'DETAIL')) && <CalendarDays className="text-rose-600" />}
                                {activeTab === 'MY' ? 'Bảng công cá nhân' : (viewMode === 'LIST' ? 'Tổng hợp công nhân viên' : 'Chi tiết chấm công')}
                            </h1>
                            <p className="text-slate-500 text-[10px] md:text-xs font-medium">
                                {activeTab === 'MY'
                                    ? 'Theo dõi chi tiết giờ công và trạng thái cá nhân'
                                    : (viewMode === 'LIST' ? 'Danh sách tổng hợp chỉ số công của nhân sự' : `Đang xem: ${selectedEmployee?.fullName || '---'}`)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-slate-100 shrink-0 h-[36px]">
                        <button onClick={prevMonth} className="p-1 px-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all cursor-pointer">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 text-center min-w-[100px]">
                            <span className="text-[11px] font-black text-slate-900 font-outfit uppercase tracking-wider">
                                T{currentDate.getMonth() + 1} / {currentDate.getFullYear()}
                            </span>
                        </div>
                        <button onClick={nextMonth} className="p-1 px-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all cursor-pointer">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs - Underline style from Orders Page */}
            {canViewOthers && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex border-b border-slate-200 w-full">
                        <button
                            onClick={() => setActiveTab('MY')}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'MY'
                                    ? "text-rose-600 bg-rose-50 cursor-pointer font-black"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                            )}
                        >
                            <span className="uppercase tracking-wider">Công cá nhân</span>
                            {activeTab === 'MY' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('EMPLOYEES'); setViewMode('LIST'); }}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'EMPLOYEES'
                                    ? "text-rose-600 bg-rose-50 cursor-pointer font-black"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                            )}
                        >
                            <span className="uppercase tracking-wider">Công nhân viên</span>
                            {activeTab === 'EMPLOYEES' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
                            )}
                        </button>
                        {canManageSettings && (
                            <>
                                <button
                                    onClick={() => setActiveTab('SETTINGS')}
                                    className={cn(
                                        "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                        activeTab === 'SETTINGS'
                                            ? "text-rose-600 bg-rose-50 cursor-pointer font-black"
                                            : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    )}
                                >
                                    <Settings size={13} />
                                    <span className="uppercase tracking-wider">Cài đặt Ca</span>
                                    {activeTab === 'SETTINGS' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('SALARY_SETTINGS')}
                                    className={cn(
                                        "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                        activeTab === 'SALARY_SETTINGS'
                                            ? "text-rose-600 bg-rose-50 cursor-pointer font-black"
                                            : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    )}
                                >
                                    <Banknote size={13} />
                                    <span className="uppercase tracking-wider">Cài đặt Lương</span>
                                    {activeTab === 'SALARY_SETTINGS' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Filters - EXACT style from Orders Page */}
            {activeTab === 'EMPLOYEES' && viewMode === 'LIST' && (
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 items-center">
                        {/* Search */}
                        <div className="relative">
                            <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", searchTerm ? "text-rose-500" : "text-slate-400")} size={14} />
                            <input
                                type="text"
                                placeholder="Tìm tên, SĐT..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={cn(
                                    "w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all text-[10.5px] font-medium",
                                    searchTerm ? "border-rose-300 font-bold" : "border-slate-200"
                                )}
                            />
                        </div>

                        {/* Branch */}
                        <div className="relative">
                            <Building2 className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", selectedBranch ? "text-rose-500" : "text-slate-400")} size={14} />
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={isManager}
                                className={cn(
                                    "w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer",
                                    selectedBranch ? "border-rose-300 font-bold" : "border-slate-200",
                                    isManager && "opacity-70 cursor-not-allowed bg-slate-100"
                                )}
                            >
                                <option value="">Chi nhánh: Tất cả</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Position */}
                        <div className="relative">
                            <Briefcase className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", selectedPosition ? "text-rose-500" : "text-slate-400")} size={14} />
                            <select
                                value={selectedPosition}
                                onChange={(e) => setSelectedPosition(e.target.value)}
                                className={cn(
                                    "w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer",
                                    selectedPosition ? "border-rose-300 font-bold" : "border-slate-200"
                                )}
                            >
                                <option value="">Chức vụ: Tất cả</option>
                                {positions.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Filter Button */}
                        <div className="relative">
                            <button
                                onClick={resetFilters}
                                className="w-full h-[28px] flex items-center justify-center gap-1.5 px-3 py-0 rounded-lg text-[10.5px] font-bold transition-all border bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white cursor-pointer"
                                title="Xoá toàn bộ bộ lọc"
                            >
                                ✕ Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'EMPLOYEES' && viewMode === 'LIST' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">STT</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nhân viên</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Ngày công</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Muộn</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Sớm</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">TC (H)</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-2/3 mx-auto"></div></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredSummaryData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                                            Không tìm thấy dữ liệu nhân sự khớp với điều kiện lọc
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSummaryData.map((row, index) => (
                                        <tr key={row.employeeId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-[11px] font-bold text-slate-400">{index + 1}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-rose-50 border border-slate-100 shrink-0 flex items-center justify-center">
                                                        {(row.avatarUrl && !imageErrors[`list-${row.employeeId}`]) ? (
                                                            <img
                                                                src={getFullImageUrl(row.avatarUrl)!}
                                                                alt={row.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={() => handleImageError(`list-${row.employeeId}`)}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-rose-500 font-black text-sm uppercase">
                                                                {row.fullName.split(' ').pop()?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-rose-600 transition-colors">{row.fullName}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{row.position} • {row.branchName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-emerald-600">{row.totalWorkDays}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("text-sm font-black", row.lateDays > 0 ? "text-rose-600" : "text-slate-300")}>{row.lateDays || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("text-sm font-black", row.earlyLeaveDays > 0 ? "text-amber-600" : "text-slate-300")}>{row.earlyLeaveDays || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("text-sm font-black", row.totalOvertimeHours > 0 ? "text-blue-600" : "text-slate-300")}>{row.totalOvertimeHours || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleSelectEmployee({ id: row.employeeId, fullName: row.fullName, avatarUrl: row.avatarUrl })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-700 transition-all active:scale-95 shadow-sm cursor-pointer"
                                                >
                                                    CHI TIẾT
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (activeTab === 'MY' || (activeTab === 'EMPLOYEES' && viewMode === 'DETAIL')) ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <StatCard label="Ngày công" value={currentStats.totalWorkDays} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
                        <StatCard label="Đi muộn" value={currentStats.lateDays} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
                        <StatCard label="Về sớm" value={currentStats.earlyLeaveDays} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                        <StatCard label="Tăng ca" value={currentStats.totalOvertimeHours} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Thứ</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vào</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ra</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Muộn</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Sớm</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">TC</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
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
                                    ) : detailData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                                                Chưa có dữ liệu chấm công cho tháng này
                                            </td>
                                        </tr>
                                    ) : (
                                        detailData.map((row) => {
                                            const date = new Date(row.date);
                                            return (
                                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                                                        <span className="text-[12px] font-black text-slate-700">{date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}</span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{getDayName(date).replace('Thứ ', 'T')}</span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                                                        <span className={cn("text-xs md:text-[13px] font-black", row.checkInTime ? "text-slate-900" : "text-slate-300")}>
                                                            {formatTime(row.checkInTime)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                                                        <span className={cn("text-xs md:text-[13px] font-black", row.checkOutTime ? "text-slate-900" : "text-slate-300")}>
                                                            {formatTime(row.checkOutTime)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
                                                        <span className={cn("text-xs md:text-[13px] font-bold", row.lateMinutes > 0 ? "text-rose-600" : "text-slate-300")}>
                                                            {row.lateMinutes || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
                                                        <span className={cn("text-xs md:text-[13px] font-bold", row.earlyLeaveMinutes > 0 ? "text-amber-600" : "text-slate-300")}>
                                                            {row.earlyLeaveMinutes || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
                                                        <span className={cn("text-xs md:text-[13px] font-bold", row.overtimeMinutes > 0 ? "text-blue-600" : "text-slate-300")}>
                                                            {row.overtimeMinutes || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
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
                </>
            ) : null}

            {/* ========== SETTINGS TAB ========== */}
            {activeTab === 'SETTINGS' && (
                <div className="space-y-4">
                    {/* Header + Add Button */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Settings size={18} className="text-rose-600" />
                                Quản lý ca làm việc
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cấu hình giờ vào/ra, ngưỡng muộn/sớm cho từng chi nhánh</p>
                        </div>
                        <button
                            onClick={() => { resetShiftForm(); setShowShiftForm(true); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 cursor-pointer"
                        >
                            <Plus size={14} /> Thêm ca
                        </button>
                    </div>

                    {/* Add/Edit Form */}
                    {showShiftForm && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800">{editingShift ? 'Sửa ca làm việc' : 'Thêm ca làm việc mới'}</h3>
                                <button onClick={resetShiftForm} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chi nhánh *</label>
                                    <select value={shiftForm.branchId} onChange={e => setShiftForm({...shiftForm, branchId: e.target.value})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100">
                                        <option value="">Chọn chi nhánh</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên ca *</label>
                                    <input value={shiftForm.name} onChange={e => setShiftForm({...shiftForm, name: e.target.value})}
                                        placeholder="VD: Ca hành chính" className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giờ vào</label>
                                    <input type="time" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giờ ra</label>
                                    <input type="time" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nghỉ giữa ca (phút)</label>
                                    <input type="number" value={shiftForm.breakMinutes} onChange={e => setShiftForm({...shiftForm, breakMinutes: parseInt(e.target.value) || 0})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Muộn (phút)</label>
                                    <input type="number" value={shiftForm.lateThreshold} onChange={e => setShiftForm({...shiftForm, lateThreshold: parseInt(e.target.value) || 0})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Muộn nghiêm trọng (phút)</label>
                                    <input type="number" value={shiftForm.lateSeriousThreshold} onChange={e => setShiftForm({...shiftForm, lateSeriousThreshold: parseInt(e.target.value) || 0})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Về sớm (phút)</label>
                                    <input type="number" value={shiftForm.earlyLeaveThreshold} onChange={e => setShiftForm({...shiftForm, earlyLeaveThreshold: parseInt(e.target.value) || 0})}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={resetShiftForm} className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">Hủy</button>
                                <button onClick={handleSaveShift} disabled={savingShift || !shiftForm.branchId || !shiftForm.name}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer">
                                    <Save size={13} /> {savingShift ? 'Đang lưu...' : (editingShift ? 'Cập nhật' : 'Tạo mới')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Shifts Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STT</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Chi nhánh</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên ca</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Giờ vào</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Giờ ra</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Nghỉ</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Muộn</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Muộn NT</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Về sớm</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                                        <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {shifts.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-16 text-center text-slate-400 font-medium italic">
                                                Chưa có ca làm việc nào. Nhấn "Thêm ca" để tạo mới.
                                            </td>
                                        </tr>
                                    ) : shifts.map((shift, i) => (
                                        <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold text-slate-400">{i + 1}</span></td>
                                            <td className="px-4 py-3"><span className="text-[12px] font-bold text-slate-700">{shift.branch?.name}</span></td>
                                            <td className="px-4 py-3"><span className="text-[12px] font-black text-slate-800">{shift.name}</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-[13px] font-black text-emerald-600">{shift.startTime}</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-[13px] font-black text-rose-600">{shift.endTime}</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold text-slate-500">{shift.breakMinutes}p</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold text-amber-600">{shift.lateThreshold}p</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold text-rose-600">{shift.lateSeriousThreshold}p</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold text-blue-600">{shift.earlyLeaveThreshold}p</span></td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleToggleShift(shift)}
                                                    className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border cursor-pointer transition-all",
                                                        shift.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100")}>
                                                    {shift.isActive ? 'Hoạt động' : 'Tắt'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEditShift(shift)}
                                                        className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-all cursor-pointer" title="Sửa">
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button onClick={() => handleDeleteShift(shift.id)}
                                                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer" title="Xóa">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'SALARY_SETTINGS' && canManageSettings && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Banknote size={18} className="text-rose-600" />
                                Quản lý Lương Cơ Bản
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cấu hình mức lương chuẩn cho Chức vụ và Ngoại lệ riêng cho Cá nhân</p>
                        </div>
                    </div>
                    <SalarySettingsTab />
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md">
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0", bg, color)}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
                <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">{label}</p>
                <p className="text-lg md:text-xl font-black text-slate-800 font-outfit mt-1">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        'FULL_DAY': { label: 'Đủ công', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'HALF_DAY': { label: 'Nửa công', class: 'bg-blue-50 text-blue-600 border-blue-100' },
        'LATE_DAY': { label: 'Đi muộn', class: 'bg-rose-50 text-rose-600 border-rose-100' },
        'ABSENT_UNAPPROVED': { label: 'Vắng (KP)', class: 'bg-slate-50 text-slate-500 border-slate-100' },
        'ABSENT_APPROVED': { label: 'Vắng (CP)', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'DEFAULT': { label: status, class: 'bg-slate-50 text-slate-400 border-slate-100' }
    };

    const item = config[status] || config['DEFAULT'];

    return (
        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap", item.class)}>
            {item.label}
        </span>
    );
}
