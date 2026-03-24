"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, Loader2, Info, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employeeId: string;
    isAdminView?: boolean;
    requestId?: string;
    initialData?: {
        startDate?: string;
        endDate?: string;
        isRecurring?: boolean;
        leaveSession?: string;
        leaveType?: string;
        reason?: string;
        recurringDays?: number[];
    };
}

const LEAVE_TYPES = [
    'Nghỉ việc riêng',
    'Nghỉ ốm',
    'Nghỉ thai sản',
    'Nghỉ phép năm',
    'Khác'
];

const WEEK_DAYS = [
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 },
    { label: 'Chủ Nhật', value: 0 },
];

export default function LeaveRequestModal({ isOpen, onClose, onSuccess, employeeId, isAdminView, requestId, initialData }: LeaveRequestModalProps) {
    const [loading, setLoading] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState(employeeId);
    const [formData, setFormData] = useState({
        leaveType: LEAVE_TYPES[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        leaveSession: 'ALL_DAY',
        reason: '',
        recurringDays: [] as number[],
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getFullImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handleImageError = (key: string) => {
        setImageErrors(prev => ({ ...prev, [key]: true }));
    };

    const removeAccents = (str: string) => {
        if (!str) return '';
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    };

    const normalizedQuery = removeAccents(searchQuery.toLowerCase());
    const filteredEmployees = employees.filter(emp => 
        removeAccents(emp.fullName?.toLowerCase() || '').includes(normalizedQuery) || 
        removeAccents(emp.email?.toLowerCase() || '').includes(normalizedQuery)
    );

    const selectedEmployeeObj = employees.find(e => e.id === selectedEmpId);

    useEffect(() => {
        if (isOpen) {
            setSelectedEmpId(employeeId);
            if (initialData) {
                setFormData({
                    leaveType: initialData.leaveType || LEAVE_TYPES[0],
                    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : (initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                    leaveSession: initialData.leaveSession || 'ALL_DAY',
                    reason: initialData.reason || '',
                    recurringDays: initialData.recurringDays || [],
                });
                if (initialData.isRecurring !== undefined) {
                    setIsRecurring(initialData.isRecurring);
                }
            } else {
                // Reset to default when opening fresh
                setFormData({
                    leaveType: LEAVE_TYPES[0],
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    leaveSession: 'ALL_DAY',
                    reason: '',
                    recurringDays: [] as number[],
                });
                setIsRecurring(false);
            }

            if (isAdminView) {
                fetchEmployees();
            }
        }
    }, [isOpen, initialData, employeeId, isAdminView]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_URL}/employees`);
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmpId) {
            alert('Vui lòng chọn nhân viên');
            return;
        }
        setLoading(true);

        try {
            const isEdit = !!requestId;
            const url = isEdit ? `${API_URL}/leave-requests/${requestId}` : `${API_URL}/leave-requests`;
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmpId,
                    ...formData,
                    isRecurring,
                    status: isAdminView ? 'APPROVED' : undefined, // Let backend decide status if not admin
                    isAdmin: isAdminView
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Lỗi khi gửi đơn');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: number) => {
        setFormData(prev => ({
            ...prev,
            recurringDays: prev.recurringDays.includes(day)
                ? prev.recurringDays.filter(d => d !== day)
                : [...prev.recurringDays, day]
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 cursor-pointer" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative cursor-default" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <h3 className="font-semibold">{requestId ? 'Chỉnh sửa đơn nghỉ' : (isAdminView ? 'Đăng ký nghỉ hộ' : 'Đăng ký nghỉ')}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Chọn nhân viên (chỉ Quản lý) */}
                    {isAdminView && (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên <span className="text-red-500">*</span></label>
                            
                            <div 
                                className={cn(
                                    "w-full flex items-center justify-between p-2.5 bg-white border rounded-xl text-sm transition-all cursor-pointer",
                                    isDropdownOpen ? "border-blue-500 ring-2 ring-blue-50" : "border-gray-200 hover:border-gray-300"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDropdownOpen(!isDropdownOpen);
                                    if (!isDropdownOpen) setSearchQuery('');
                                }}
                            >
                                {selectedEmployeeObj ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                                            {selectedEmployeeObj.avatarUrl && !imageErrors[`emp-${selectedEmployeeObj.id}`] ? (
                                                <img 
                                                    src={getFullImageUrl(selectedEmployeeObj.avatarUrl)!} 
                                                    alt={selectedEmployeeObj.fullName}
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(`emp-${selectedEmployeeObj.id}`)}
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-blue-700">
                                                    {selectedEmployeeObj.fullName?.split(' ').pop()?.charAt(0)?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-900">{selectedEmployeeObj.fullName}</span>
                                        <span className="text-gray-500 text-xs hidden sm:inline-block">- {selectedEmployeeObj.branch?.name || 'Văn phòng'}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500">-- Chọn nhân viên --</span>
                                )}
                                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div 
                                    className="absolute z-[110] mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-2 border-b border-gray-50">
                                        <div className="relative flex items-center">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
                                                placeholder="Tìm tên nhân viên..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
                                        {filteredEmployees.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-gray-400" />
                                                Không tìm thấy nhân viên nào
                                            </div>
                                        ) : (
                                            filteredEmployees.map((emp) => {
                                                const isSelected = selectedEmpId === emp.id;
                                                return (
                                                    <div
                                                        key={emp.id}
                                                        onClick={() => {
                                                            setSelectedEmpId(emp.id);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                                                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                                                            {emp.avatarUrl && !imageErrors[`emp-${emp.id}`] ? (
                                                                <img 
                                                                    src={getFullImageUrl(emp.avatarUrl)!} 
                                                                    alt={emp.fullName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={() => handleImageError(`emp-${emp.id}`)}
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-bold text-indigo-700">
                                                                    {emp.fullName?.split(' ').pop()?.charAt(0)?.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <span className={cn("text-sm font-medium", isSelected ? "text-blue-700" : "text-gray-900")}>
                                                                {emp.fullName}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 truncate">
                                                                {emp.branch?.name || 'Văn phòng'} {Math.random() > 0.5 ? '• Dev' : '' /* Dummy position since position might not be joined */}
                                                            </span>
                                                        </div>
                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loại nghỉ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" id="label-leave-type">Loại nghỉ</label>
                        <select
                            className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            value={formData.leaveType}
                            onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                            required
                        >
                            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Switch: Nghỉ cố định */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Nghỉ cố định hàng tuần</p>
                                <p className="text-[10px] text-blue-600">Áp dụng lặp lại cho các tuần tiếp theo</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsRecurring(!isRecurring)}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                                isRecurring ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                isRecurring ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                    </div>

                    {/* Chế độ Nghỉ cố định */}
                    {isRecurring ? (
                        <div className="space-y-3 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn các thứ lặp lại</label>
                            <div className="grid grid-cols-4 gap-2">
                                {WEEK_DAYS.map(day => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            "py-2 px-1 text-xs font-medium rounded-lg border transition-all cursor-pointer",
                                            formData.recurringDays.includes(day.value)
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bắt đầu từ ngày</label>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-gray-200 text-sm cursor-pointer"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: e.target.value })}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Chế độ Nghỉ đột xuất */
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-gray-200 text-sm cursor-pointer"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                <input
                                    type="date"
                                    className="w-full rounded-xl border-gray-200 text-sm cursor-pointer"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Buổi nghỉ (Session) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Buổi nghỉ</label>
                        <div className="flex gap-2">
                            {[
                                { label: 'Cả ngày', value: 'ALL_DAY' },
                                { label: 'Sáng', value: 'MORNING' },
                                { label: 'Chiều', value: 'AFTERNOON' },
                            ].map(session => (
                                <button
                                    key={session.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, leaveSession: session.value })}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-xl border transition-all cursor-pointer",
                                        formData.leaveSession === session.value
                                            ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                    )}
                                >
                                    {session.label}
                                </button>
                            ))}
                        </div>
                        {formData.leaveSession !== 'ALL_DAY' && (
                            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                <Info className="w-3 h-3" />
                                Lưu ý: Nghỉ nửa buổi bạn vẫn phải chấm công ca còn lại.
                            </p>
                        )}
                    </div>

                    {/* Lý do */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lý do nghỉ</label>
                        <textarea
                            className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Nhập lý do chi tiết..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {requestId ? 'Cập nhật đơn' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
