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
    Banknote,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import SalarySettingsTab from '@/components/timesheet/SalarySettingsTab';
import ConfirmModal from '@/components/ui/confirm-modal';
import AttendanceExceptionRequestModal from '@/components/timesheet/AttendanceExceptionRequestModal';
import AttendanceAuditLogModal from '@/components/timesheet/AttendanceAuditLogModal';
import AttendanceExceptionRequestDetailModal from '@/components/timesheet/AttendanceExceptionRequestDetailModal';
import { History, FileText, Eye } from 'lucide-react';

type ActiveTab = 'MY' | 'EMPLOYEES' | 'SETTINGS' | 'SALARY_SETTINGS' | 'EXCEPTION_REQUESTS' | 'AUDIT_LOGS';
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
    const { error: toastError, success: toastSuccess } = useToast();

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

    // Adjustment state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustingRecord, setAdjustingRecord] = useState<any>(null);
    const [savingAdjust, setSavingAdjust] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        checkInTime: '',
        checkOutTime: '',
        note: ''
    });

    // Exception Request State
    const [showExceptionModal, setShowExceptionModal] = useState(false);
    const [requestingRecord, setRequestingRecord] = useState<any>(null);

    // Audit Log State
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [viewingAuditRecord, setViewingAuditRecord] = useState<any>(null);

    // Audit Logs List State
    const [allAuditLogs, setAllAuditLogs] = useState<any[]>([]);

    // Exception Requests List State
    const [exceptionRequests, setExceptionRequests] = useState<any[]>([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewingRequestDetail, setViewingRequestDetail] = useState<any>(null);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);

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

    const fetchExceptionRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab === 'MY' && currentUser?.employee?.id) {
                params.append('employeeId', currentUser.employee.id);
            } else if (selectedBranch) {
                params.append('branchId', selectedBranch);
            }
            
            const res = await fetch(`${API_URL}/attendance-exception-requests?${params.toString()}`);
            const data = await res.json();
            setExceptionRequests(data);
        } catch (error) {
            toastError('Không thể tải danh sách đơn giải trình');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllAuditLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            params.append('month', month.toString());
            params.append('year', year.toString());
            
            if (activeTab === 'AUDIT_LOGS' && selectedBranch) {
                params.append('branchId', selectedBranch);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const res = await fetch(`${API_URL}/attendance/audit-logs?${params.toString()}`);
            const data = await res.json();
            setAllAuditLogs(data);
        } catch (error) {
            toastError('Không thể tải lịch sử chỉnh sửa');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch(`${API_URL}/attendance-exception-requests/${requestId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    approvedById: currentUser?.id,
                    note: status === 'APPROVED' ? 'Đã phê duyệt' : 'Từ chối'
                })
            });

            if (!res.ok) throw new Error('Cập nhật thất bại');
            
            toastSuccess(status === 'APPROVED' ? 'Đã duyệt đơn giải trình' : 'Đã từ chối đơn giải trình');
            fetchExceptionRequests();
        } catch (error) {
            toastError('Lỗi cập nhật trạng thái đơn');
        }
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
        } else if (activeTab === 'EXCEPTION_REQUESTS') {
            fetchExceptionRequests();
        } else if (activeTab === 'AUDIT_LOGS') {
            fetchAllAuditLogs();
        } else {
            fetchMyDetail();
        }
    }, [currentUser, activeTab, viewMode, currentDate, selectedBranch, selectedPosition, selectedEmployee]);


    const handleAdjust = (record: any) => {
        setAdjustingRecord(record);
        
        const toLocalISO = (dateStr: string | null, fallbackDate: string) => {
            const d = dateStr ? new Date(dateStr) : new Date(fallbackDate);
            // Ép về giờ địa phương VN (+7)
            const dateVN = new Date(d.getTime() + 7 * 3600000);
            return dateVN.toISOString().slice(0, 16);
        };

        setAdjustForm({
            checkInTime: toLocalISO(record.checkInTime, record.date),
            checkOutTime: toLocalISO(record.checkOutTime, record.date),
            note: ''
        });
        setShowAdjustModal(true);
    };

    const calculatePreview = () => {
        if (!adjustingRecord || !adjustingRecord.shift) return null;
        const shift = adjustingRecord.shift;
        const { checkInTime, checkOutTime } = adjustForm;

        let late = 0;
        let early = 0;
        let ot = 0;

        // Ép tính toán dựa trên Target Date của bản ghi để tránh lệch ngày
        const targetDate = new Date(adjustingRecord.date);
        
        const getMinutesFromStartOfDay = (isoStr: string) => {
            const d = new Date(isoStr + ':00+07:00');
            // Tính số phút từ 0h ngày hôm đó (theo giờ VN)
            const dateVN = new Date(d.getTime() + 7 * 3600000);
            return dateVN.getUTCHours() * 60 + dateVN.getUTCMinutes();
        };

        const [sh, sm] = shift.startTime.split(':').map(Number);
        const shiftStartMins = sh * 60 + sm;
        const [eh, em] = shift.endTime.split(':').map(Number);
        const shiftEndMins = eh * 60 + em;

        if (checkInTime) {
            const inMins = getMinutesFromStartOfDay(checkInTime);
            const diff = inMins - shiftStartMins;
            if (diff > shift.lateThreshold) late = diff;
        }

        if (checkOutTime) {
            const outMins = getMinutesFromStartOfDay(checkOutTime);
            const diff = outMins - shiftEndMins;
            if (diff < -shift.earlyLeaveThreshold) early = Math.abs(diff);
            else if (diff >= 30) ot = diff;
        }

        return { late, early, ot };
    };

    const preview = calculatePreview();

    const submitAdjustment = async () => {
        if (!adjustingRecord) return;
        setSavingAdjust(true);
        try {
            const res = await fetch(`${API_URL}/attendance/adjust`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee?.id || currentUser?.employee?.id,
                    date: adjustingRecord.date,
                    checkInTime: adjustForm.checkInTime || null,
                    checkOutTime: adjustForm.checkOutTime || null,
                    note: adjustForm.note,
                    changedById: currentUser.id
                })
            });

            if (!res.ok) throw new Error('Failed to adjust');
            
            // Refresh data
            if (activeTab === 'MY') fetchMyDetail();
            else fetchDetail();
            
            setShowAdjustModal(false);
        } catch (error) {
            toastError('Lỗi khi hiệu chỉnh công');
        } finally {
            setSavingAdjust(false);
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
        const date = new Date(dateStr);
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh' 
        });
    };

    const getDayName = (date: Date) => {
        const days = ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];
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
    const canManageSettings = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'ADMIN'].includes(roleCode);
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
        setShiftToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteShift = async () => {
        if (!shiftToDelete) return;
        try {
            const res = await fetch(`${API_URL}/attendance/shifts/${shiftToDelete}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                toastError(err.message || 'Không thể xóa');
                return;
            }
            fetchShifts();
            setShowDeleteConfirm(false);
            setShiftToDelete(null);
        } catch (error) { 
            toastError('Lỗi khi xóa'); 
        }
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
                                        <div className="text-primary font-black text-lg">{currentUser?.employee?.fullName?.split(' ').pop()?.charAt(0)}</div>
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
                                        <div className="text-primary font-black text-lg">{selectedEmployee?.fullName?.split(' ').pop()?.charAt(0)}</div>
                                    )
                                )}
                            </div>
                        )}
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-outfit tracking-tight flex items-center gap-2 leading-none">
                                {!(activeTab === 'MY' || (activeTab === 'EMPLOYEES' && viewMode === 'DETAIL')) && <CalendarDays className="text-primary" />}
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
                        <button onClick={prevMonth} className="p-1 px-2 hover:bg-primary-light hover:text-primary rounded-lg transition-all cursor-pointer">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 text-center min-w-[100px]">
                            <span className="text-[11px] font-bold text-slate-900 font-outfit tracking-wider">
                                T{currentDate.getMonth() + 1} / {currentDate.getFullYear()}
                            </span>
                        </div>
                        <button onClick={nextMonth} className="p-1 px-2 hover:bg-primary-light hover:text-primary rounded-lg transition-all cursor-pointer">
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
                                    ? "text-primary bg-primary-light cursor-pointer font-black"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                            )}
                        >
                            <span className="tracking-wider">Công cá nhân</span>
                            {activeTab === 'MY' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('EMPLOYEES'); setViewMode('LIST'); }}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'EMPLOYEES'
                                    ? "text-primary bg-primary-light cursor-pointer font-black"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                            )}
                        >
                            <span className="tracking-wider">Công nhân viên</span>
                            {activeTab === 'EMPLOYEES' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('EXCEPTION_REQUESTS')}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'EXCEPTION_REQUESTS'
                                    ? "text-primary bg-primary-light cursor-pointer font-black"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                            )}
                        >
                            <FileText size={13} />
                            <span className="tracking-wider">Đơn giải trình</span>
                            {activeTab === 'EXCEPTION_REQUESTS' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('AUDIT_LOGS')}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'AUDIT_LOGS'
                                    ? "text-primary bg-primary-light cursor-pointer font-black"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                            )}
                        >
                            <History size={13} />
                            <span className="tracking-wider">Lịch sử sửa</span>
                            {activeTab === 'AUDIT_LOGS' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>
                        {canManageSettings && (
                            <>
                                <button
                                    onClick={() => setActiveTab('SETTINGS')}
                                    className={cn(
                                        "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                        activeTab === 'SETTINGS'
                                            ? "text-primary bg-primary-light cursor-pointer font-black"
                                            : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    )}
                                >
                                    <Settings size={13} />
                                    <span className="tracking-wider">Cài đặt ca</span>
                                    {activeTab === 'SETTINGS' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('SALARY_SETTINGS')}
                                    className={cn(
                                        "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                        activeTab === 'SALARY_SETTINGS'
                                            ? "text-primary bg-primary-light cursor-pointer font-black"
                                            : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    )}
                                >
                                    <Banknote size={13} />
                                    <span className="tracking-wider">Cài đặt lương</span>
                                    {activeTab === 'SALARY_SETTINGS' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
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
                            <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", searchTerm ? "text-primary" : "text-slate-400")} size={14} />
                            <input
                                type="text"
                                placeholder="Tìm tên, SĐT..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={cn(
                                    "w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-[10.5px] font-medium",
                                    searchTerm ? "border-primary font-bold" : "border-slate-200"
                                )}
                            />
                        </div>

                        {/* Branch */}
                        <div className="relative">
                            <Building2 className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", selectedBranch ? "text-primary" : "text-slate-400")} size={14} />
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={isManager}
                                className={cn(
                                    "w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer",
                                    selectedBranch ? "border-primary font-bold" : "border-slate-200",
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
                            <Briefcase className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", selectedPosition ? "text-primary" : "text-slate-400")} size={14} />
                            <select
                                value={selectedPosition}
                                onChange={(e) => setSelectedPosition(e.target.value)}
                                className={cn(
                                    "w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer",
                                    selectedPosition ? "border-primary font-bold" : "border-slate-200"
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
                                className="w-full h-[28px] flex items-center justify-center gap-1.5 px-3 py-0 rounded-lg text-[10.5px] font-bold transition-all border bg-primary-light text-primary border-primary/20 hover:bg-primary hover:text-white cursor-pointer"
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
                                    <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none text-center">STT</th>
                                    <th className="px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Nhân viên</th>
                                    <th className="px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center leading-none">Ngày công</th>
                                    <th className="px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center leading-none">Muộn</th>
                                    <th className="px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center leading-none">Sớm</th>
                                    <th className="px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center leading-none">TC (H)</th>
                                    <th className="px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center leading-none">Thao tác</th>
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
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-light border border-slate-100 shrink-0 flex items-center justify-center">
                                                        {(row.avatarUrl && !imageErrors[`list-${row.employeeId}`]) ? (
                                                            <img
                                                                src={getFullImageUrl(row.avatarUrl)!}
                                                                alt={row.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={() => handleImageError(`list-${row.employeeId}`)}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-primary font-black text-sm uppercase">
                                                                {row.fullName.split(' ').pop()?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">{row.fullName}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{row.position} • {row.branchName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-accent">{row.totalWorkDays}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("text-sm font-black", row.lateDays > 0 ? "text-primary" : "text-slate-300")}>{row.lateDays || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("text-sm font-black", row.earlyLeaveDays > 0 ? "text-warning" : "text-slate-300")}>{row.earlyLeaveDays || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("text-sm font-black", row.totalOvertimeHours > 0 ? "text-blue-600" : "text-slate-300")}>{row.totalOvertimeHours || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleSelectEmployee({ id: row.employeeId, fullName: row.fullName, avatarUrl: row.avatarUrl })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold tracking-wider hover:bg-slate-700 transition-all active:scale-95 shadow-sm cursor-pointer"
                                                >
                                                    Chi tiết
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
                        <StatCard label="Ngày công" value={currentStats.totalWorkDays} icon={CheckCircle2} color="text-accent" bg="bg-emerald-50" />
                        <StatCard label="Đi muộn" value={currentStats.lateDays} icon={AlertCircle} color="text-primary" bg="bg-primary-light" />
                        <StatCard label="Về sớm" value={currentStats.earlyLeaveDays} icon={Clock} color="text-warning" bg="bg-amber-50" />
                        <StatCard label="Tăng ca" value={currentStats.totalOvertimeHours} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest">Ngày</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest">Thứ</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest">Vào</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest">Ra</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Muộn</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Sớm</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">TC</th>
                                        <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Trạng thái</th>
                                        {['ADMIN', 'DIRECTOR', 'MANAGER', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'].includes(currentUser?.role?.code) && (
                                            <th className="px-3 md:px-6 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Thao tác</th>
                                        )}
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
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{getDayName(date)}</span>
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
                                                        <span className={cn("text-xs md:text-[13px] font-bold", row.lateMinutes > 0 ? "text-primary" : "text-slate-300")}>
                                                            {row.lateMinutes || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
                                                        <span className={cn("text-xs md:text-[13px] font-bold", row.earlyLeaveMinutes > 0 ? "text-warning" : "text-slate-300")}>
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
                                                    {['ADMIN', 'DIRECTOR', 'MANAGER', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'].includes(currentUser?.role?.code) && (
                                                        <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => { setViewingAuditRecord(row); setShowAuditModal(true); }}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-all cursor-pointer"
                                                                    title="Xem lịch sử chỉnh sửa"
                                                                >
                                                                    <History size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAdjust(row)}
                                                                    className="p-1.5 text-slate-400 hover:text-primary transition-all cursor-pointer"
                                                                    title="Hiệu chỉnh công"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {activeTab === 'MY' && (
                                                        <td className="px-3 md:px-6 py-3 whitespace-nowrap text-center">
                                                            <button
                                                                onClick={() => { setRequestingRecord(row); setShowExceptionModal(true); }}
                                                                className="p-1.5 text-slate-400 hover:text-primary transition-all cursor-pointer"
                                                                title="Gửi đơn giải trình"
                                                            >
                                                                <FileText size={14} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Adjust Modal */}
                    {showAdjustModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => setShowAdjustModal(false)}>
                            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                        <RotateCcw size={20} className="text-primary" />
                                        Hiệu chỉnh ngày công
                                    </h3>
                                    <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"><X size={20} /></button>
                                </div>
                                
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhân viên & Ngày</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedEmployee?.fullName || currentUser?.employee?.fullName}</p>
                                    <p className="text-[11px] font-bold text-slate-500">{new Date(adjustingRecord?.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Giờ vào</label>
                                        <input 
                                            type="datetime-local" 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                            value={adjustForm.checkInTime}
                                            onChange={e => setAdjustForm({ ...adjustForm, checkInTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Giờ ra</label>
                                        <input 
                                            type="datetime-local" 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                            value={adjustForm.checkOutTime}
                                            onChange={e => setAdjustForm({ ...adjustForm, checkOutTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lý do hiệu chỉnh</label>
                                    <textarea 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all h-20 resize-none"
                                        placeholder="VD: Quên chấm công, lỗi GPS..."
                                        value={adjustForm.note}
                                        onChange={e => setAdjustForm({ ...adjustForm, note: e.target.value })}
                                    />
                                </div>

                                {/* Results Preview */}
                                {preview && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-around divide-x divide-slate-200">
                                        <div className="text-center flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Muộn</p>
                                            <p className={cn("text-sm font-black", preview.late > 0 ? "text-primary" : "text-slate-300")}>{preview.late || '-'}</p>
                                        </div>
                                        <div className="text-center flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Về sớm</p>
                                            <p className={cn("text-sm font-black", preview.early > 0 ? "text-amber-600" : "text-slate-300")}>{preview.early || '-'}</p>
                                        </div>
                                        <div className="text-center flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Tăng ca</p>
                                            <p className={cn("text-sm font-black", preview.ot > 0 ? "text-blue-600" : "text-slate-300")}>{preview.ot || '-'}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowAdjustModal(false)} className="flex-1 px-6 py-3 text-slate-500 font-bold text-sm tracking-tight hover:bg-slate-50 rounded-xl transition-all cursor-pointer">Hủy</button>
                                    <button 
                                        onClick={submitAdjustment}
                                        disabled={savingAdjust}
                                        className="flex-[1.5] px-6 py-3 bg-primary text-white font-bold text-sm tracking-tight rounded-xl shadow-lg shadow-primary-light/50 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                    >
                                        {savingAdjust ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Xác nhận thay đổi
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : null}

            {/* ========== SETTINGS TAB ========== */}
            {activeTab === 'SETTINGS' && (
                <div className="space-y-4">
                    {/* Header + Add Button */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <Settings size={18} className="text-primary" />
                                Quản lý ca làm việc
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cấu hình giờ vào/ra, ngưỡng muộn/sớm cho từng chi nhánh</p>
                        </div>
                        <button
                            onClick={() => { resetShiftForm(); setShowShiftForm(true); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary-light/50 cursor-pointer"
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
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
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
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">STT</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest">Chi nhánh</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest">Tên ca</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Giờ vào</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Giờ ra</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Nghỉ</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Muộn</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Muộn NT</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Về sớm</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Trạng thái</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest text-center">Thao tác</th>
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

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa ca làm việc này không? Hành động này không thể hoàn tác."
                confirmLabel="Xóa ca"
                cancelLabel="Hủy"
                isDanger={true}
                onConfirm={confirmDeleteShift}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setShiftToDelete(null);
                }}
            />

            {activeTab === 'EXCEPTION_REQUESTS' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                Danh sách Đơn giải trình
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Theo dõi và phê duyệt các yêu cầu hiệu chỉnh công</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Nhân viên</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Ngày</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Loại</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none px-6">Lý do</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none text-center">Trạng thái</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {Array.from({ length: 6 }).map((_, j) => (
                                                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : exceptionRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium italic">
                                                Chưa có đơn giải trình nào
                                            </td>
                                        </tr>
                                    ) : (
                                        exceptionRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-bold text-slate-800">{req.employee?.fullName}</span>
                                                        <span className="text-[9px] text-slate-400">{req.employee?.branch?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-[11px] font-bold text-slate-600">
                                                        {new Date(req.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {req.type === 'GO_LATE' ? 'Báo muộn' : 
                                                         req.type === 'LEAVE_EARLY' ? 'Về sớm' : 
                                                         req.type === 'GPS_ERROR' ? 'Lỗi GPS' : 
                                                         req.type === 'FORGOT_CHECKIN' ? 'Quên vào' : 'Quên ra'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 px-6 max-w-xs">
                                                    <p className="text-[11px] text-slate-600 truncate" title={req.reason}>{req.reason}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border",
                                                        req.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        req.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        "bg-rose-50 text-rose-600 border-rose-100"
                                                    )}>
                                                        {req.status === 'PENDING' ? 'Chờ duyệt' : 
                                                         req.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={() => { setViewingRequestDetail(req); setShowDetailModal(true); }}
                                                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-all cursor-pointer" title="Xem chi tiết"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {req.status === 'PENDING' && canViewOthers && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                                                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700 transition-all cursor-pointer"
                                                                >Duyệt</button>
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                                                    className="px-2 py-1 bg-rose-600 text-white rounded text-[9px] font-bold hover:bg-rose-700 transition-all cursor-pointer"
                                                                >Từ chối</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'AUDIT_LOGS' && canManageSettings && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <History size={18} className="text-primary" />
                                Lịch sử chỉnh sửa chấm công
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Theo dõi lịch sử chỉnh sửa thủ công và giải trình của nhân viên</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Người sửa</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Hành động</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none">Nhân viên</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none px-6">Dữ liệu thay đổi</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-slate-400 tracking-widest leading-none text-right">Thời gian sửa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {Array.from({ length: 5 }).map((_, j) => (
                                                    <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : allAuditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium italic">
                                                Chưa có dữ liệu chỉnh sửa trong tháng này
                                            </td>
                                        </tr>
                                    ) : (
                                        allAuditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setViewingAuditRecord({id: log.attendanceId, date: log.attendance?.date}); setShowAuditModal(true); }}>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-bold text-slate-800">{log.user?.employee?.fullName || log.user?.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={cn(
                                                        "text-[11px] font-medium px-2.5 py-1 rounded-md",
                                                        log.action === 'MANUAL_ADJUST' ? "bg-blue-50 text-blue-700" :
                                                        log.action === 'EXCEPTION_APPROVED_GO_LATE' ? "bg-amber-50 text-amber-700" :
                                                        log.action === 'EXCEPTION_APPROVED_LEAVE_EARLY' ? "bg-orange-50 text-orange-700" :
                                                        log.action === 'EXCEPTION_APPROVED_GPS_ERROR' ? "bg-rose-50 text-rose-700" :
                                                        log.action === 'EXCEPTION_APPROVED_FORGOT_CHECKIN' ? "bg-indigo-50 text-indigo-700" :
                                                        log.action === 'EXCEPTION_APPROVED_FORGOT_CHECKOUT' ? "bg-violet-50 text-violet-700" :
                                                        "bg-slate-50 text-slate-700"
                                                    )}>
                                                        {log.action === 'MANUAL_ADJUST' ? 'Hiệu chỉnh thủ công' : 
                                                         log.action === 'EXCEPTION_APPROVED_GO_LATE' ? 'Phê duyệt đi muộn' :
                                                         log.action === 'EXCEPTION_APPROVED_LEAVE_EARLY' ? 'Phê duyệt về sớm' :
                                                         log.action === 'EXCEPTION_APPROVED_GPS_ERROR' ? 'Phê duyệt lỗi GPS' :
                                                         log.action === 'EXCEPTION_APPROVED_FORGOT_CHECKIN' ? 'Phê duyệt quên check-in' :
                                                         log.action === 'EXCEPTION_APPROVED_FORGOT_CHECKOUT' ? 'Phê duyệt quên check-out' :
                                                         log.action.replace('EXCEPTION_APPROVED_', 'Phê duyệt ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-700">{log.attendance?.employee?.fullName}</span>
                                                        <span className="text-[9px] text-slate-400">Ngày công: {new Date(log.attendance?.date).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 px-6 max-w-sm">
                                                    <p className="text-[10px] text-slate-600 truncate italic" title={log.reason}>{log.reason || '-'}</p>
                                                    <p className="text-[9px] text-emerald-600 font-medium truncate mt-0.5">
                                                        {log.newData?.checkInTime && `Vào: ${new Date(log.newData.checkInTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} `}
                                                        {log.newData?.checkOutTime && `Ra: ${new Date(log.newData.checkOutTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {new Date(log.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
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
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <Banknote size={18} className="text-rose-600" />
                                Quản lý Lương Cơ Bản
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cấu hình mức lương chuẩn cho Chức vụ và Ngoại lệ riêng cho Cá nhân</p>
                        </div>
                    </div>
                    <SalarySettingsTab />
                </div>
            )}

            {/* Modals */}
            <AttendanceExceptionRequestModal 
                isOpen={showExceptionModal}
                onClose={() => { setShowExceptionModal(false); setRequestingRecord(null); }}
                record={requestingRecord}
                employeeId={currentUser?.employee?.id}
                onSuccess={() => {}}
            />

            <AttendanceAuditLogModal 
                isOpen={showAuditModal}
                onClose={() => { setShowAuditModal(false); setViewingAuditRecord(null); }}
                record={viewingAuditRecord}
            />

            <AttendanceExceptionRequestDetailModal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setViewingRequestDetail(null); }}
                request={viewingRequestDetail}
            />
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
        'INCOMPLETE': { label: 'Thiếu công', class: 'bg-rose-50 text-rose-600 border-rose-100' },
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
