'use client';

import { useState, useEffect } from 'react';
import { 
    Settings, Plus, Edit2, Trash2, Save, X, Search, Loader2, 
    Clock, MapPin, Calendar, Info, Check, AlertCircle, ChevronRight, Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';
import { cn } from '@/lib/utils';

interface AttendancePolicyDay {
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOff: boolean;
    allowOT: boolean;
    otMultiplier: number;
    requireGPS: boolean;
    workCount: number;
    isFlexible: boolean;
    note: string | null;
}

interface AttendancePolicy {
    id: string;
    name: string;
    note: string | null;
    latitude: number | null;
    longitude: number | null;
    radius: number | null;
    requireGPS: boolean;
    configData?: any;
    days: AttendancePolicyDay[];
    _count?: {
        positions: number;
        employees: number;
    };
}

const DAYS_OF_WEEK = [
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 },
    { label: 'Chủ nhật', value: 0 },
];

export default function AttendancePoliciesTab() {
    const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { success, error: toastError } = useToast();
    
    // View state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(null);
    const [saving, setSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState<Partial<AttendancePolicy>>({
        name: '',
        note: '',
        latitude: null,
        longitude: null,
        radius: 200,
        requireGPS: true,
        configData: {
            theme: 'FIXED_TIME',
            attendance_calculation: {
                late_rules: { grace_minutes: 15 },
                early_leave_rules: { grace_minutes: 15 }
            },
            overtime_rules: {
                is_allowed: true,
                min_minutes_to_trigger: 30,
                coefficient: 1.5
            }
        },
        days: DAYS_OF_WEEK.map(d => ({
            dayOfWeek: d.value,
            startTime: '08:00',
            endTime: '17:30',
            isOff: d.value === 0, // Sunday off by default
            allowOT: true,
            otMultiplier: 1.5,
            requireGPS: true,
            workCount: 1,
            isFlexible: false,
            note: null
        }))
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/attendance-policies`);
            const data = await res.json();
            setPolicies(data);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toastError('Không thể tải danh sách chính sách');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (policy?: AttendancePolicy) => {
        if (policy) {
            setEditingPolicy(policy);
            setFormData({
                name: policy.name,
                note: policy.note || '',
                latitude: policy.latitude,
                longitude: policy.longitude,
                radius: policy.radius || 200,
                requireGPS: policy.requireGPS ?? true,
                configData: policy.configData || {
                    theme: 'FIXED_TIME',
                    attendance_calculation: {
                        late_rules: { grace_minutes: 15 },
                        early_leave_rules: { grace_minutes: 15 }
                    },
                    overtime_rules: {
                        is_allowed: true,
                        min_minutes_to_trigger: 30,
                        coefficient: 1.5
                    }
                },
                days: policy.days.sort((a, b) => {
                    const order = [1, 2, 3, 4, 5, 6, 0];
                    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
                }).map(d => {
                    const dailyRule = policy.configData?.daily_rules?.[d.dayOfWeek.toString()];
                    return {
                        ...d,
                        // If there is a rule for this day, check if it explicitly has break_start.
                        hasBreak: dailyRule ? !!dailyRule.break_start : true,
                        breakStartTime: dailyRule?.break_start || '12:00',
                        breakEndTime: dailyRule?.break_end || '13:30'
                    } as any;
                })
            });
        } else {
            setEditingPolicy(null);
            setFormData({
                name: '',
                note: '',
                latitude: null,
                longitude: null,
                radius: 200,
                requireGPS: true,
                configData: {
                    theme: 'FIXED_TIME',
                    attendance_calculation: {
                        late_rules: { grace_minutes: 15 },
                        early_leave_rules: { grace_minutes: 15 }
                    },
                    overtime_rules: {
                        is_allowed: true,
                        min_minutes_to_trigger: 30,
                        coefficient: 1.5
                    }
                },
                days: DAYS_OF_WEEK.map(d => ({
                    dayOfWeek: d.value,
                    startTime: '08:00',
                    endTime: '17:30',
                    isOff: d.value === 0,
                    allowOT: true,
                    otMultiplier: 1.5,
                    requireGPS: true,
                    workCount: 1,
                    isFlexible: false,
                    note: null,
                    hasBreak: true,
                    breakStartTime: '12:00',
                    breakEndTime: '13:30'
                }))
            });
        }
        setIsFormOpen(true);
    };

    const handleToggleDayOff = (index: number) => {
        const newDays = [...(formData.days || [])];
        newDays[index] = { ...newDays[index], isOff: !newDays[index].isOff };
        setFormData({ ...formData, days: newDays });
    };

    const handleDayChange = (index: number, field: string, value: any) => {
        const newDays = [...(formData.days || [])];
        newDays[index] = { ...newDays[index], [field]: value };
        setFormData({ ...formData, days: newDays });
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            toastError('Vui lòng nhập tên chính sách');
            return;
        }

        setSaving(true);
        try {
            const url = editingPolicy 
                ? `${API_URL}/attendance-policies/${editingPolicy.id}` 
                : `${API_URL}/attendance-policies`;
            const method = editingPolicy ? 'PATCH' : 'POST';

            // Sync daily rules forward into configData for simplified storage
            // Pack daily rules into configData
            const dailyRules: any = {};
            formData.days?.forEach(d => {
                dailyRules[d.dayOfWeek.toString()] = {
                    is_working_day: !d.isOff,
                    start_time: d.startTime,
                    end_time: d.endTime,
                    break_start: (d as any).hasBreak ? ((d as any).breakStartTime || '12:00') : null,
                    break_end: (d as any).hasBreak ? ((d as any).breakEndTime || '13:30') : null,
                    is_off_day_ot: d.allowOT
                };
            });

            const updatedConfig = {
                ...(formData.configData || {}),
                theme: formData.configData?.theme || 'FIXED_TIME',
                daily_rules: dailyRules,
                location_constraints: {
                    require_gps: formData.requireGPS ?? true
                },
                attendance_calculation: formData.configData?.attendance_calculation || {
                    base_value: 1,
                    late_rules: { grace_minutes: 15 },
                    early_leave_rules: { grace_minutes: 15 }
                },
                overtime_rules: formData.configData?.overtime_rules || {
                    is_allowed: true,
                    min_minutes_to_trigger: 30,
                    coefficient: 1.5,
                    all_off_day_is_ot: true
                }
            };

            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude.toString()) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude.toString()) : null,
                radius: formData.radius ? parseInt(formData.radius.toString()) : null,
                requireGPS: formData.requireGPS,
                configData: updatedConfig,
                days: formData.days?.map(d => {
                // Chỉ gửi các trường cần thiết, tránh gửi kèm metadata không mong muốn
                return {
                    id: d.id,
                    dayOfWeek: d.dayOfWeek,
                    startTime: d.startTime,
                    endTime: d.endTime,
                    isOff: d.isOff,
                    allowOT: d.allowOT,
                    otMultiplier: d.otMultiplier && d.otMultiplier.toString().trim() !== '' 
                        ? (parseFloat(d.otMultiplier.toString()) || 1.5) 
                        : 1.5,
                    requireGPS: d.requireGPS,
                    workCount: parseFloat(d.workCount?.toString() || '1.0') || 1,
                    isFlexible: d.isFlexible,
                    note: d.note
                };
            })
        };
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Lỗi khi lưu chính sách');
            }

            success(editingPolicy ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
            setIsFormOpen(false);
            fetchPolicies();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            const res = await fetch(`${API_URL}/attendance-policies/${deleteConfirm.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Không thể xóa chính sách');
            success('Đã xóa chính sách');
            fetchPolicies();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const getCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                success("Đã lấy tọa độ hiện tại!");
            }, (err) => {
                toastError("Không thể lấy vị trí: " + err.message);
            });
        } else {
            toastError("Trình duyệt không hỗ trợ định vị");
        }
    };

    const filteredPolicies = policies.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chính sách..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-light transition-all text-sm"
                    />
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent to-teal-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-accent-light/20 hover:shadow-accent-light/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Tạo chính sách mới
                </button>
            </div>

            {/* List View */}
            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-accent-light animate-spin" />
                    <p className="text-slate-400 font-semibold animate-pulse">Đang tải chính sách...</p>
                </div>
            ) : filteredPolicies.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Settings className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">Chưa có chính sách chấm công nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {filteredPolicies.map(policy => (
                        <div key={policy.id} className="group bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 hover:shadow-2xl hover:border-emerald-100 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-accent transition-colors tracking-tight truncate">{policy.name}</h3>
                                        {policy.configData?.theme && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                policy.configData.theme === 'FIXED_TIME' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                policy.configData.theme === 'FLEXIBLE' ? "bg-amber-50 text-warning border border-amber-100" :
                                                "bg-primary-subtle text-primary border border-primary-subtle"
                                            )}>
                                                {policy.configData.theme === 'FIXED_TIME' ? 'Hành chính' :
                                                 policy.configData.theme === 'FLEXIBLE' ? 'Linh hoạt' : 'Theo dõi thô'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs md:text-sm text-slate-400 font-medium line-clamp-2 md:line-clamp-1">{policy.note || 'Không có mô tả'}</p>
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => handleOpenForm(policy)} className="p-2 hover:bg-emerald-50 text-accent rounded-xl transition-all cursor-pointer" title="Sửa"><Edit2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /></button>
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: policy.id })} className="p-2 hover:bg-primary-subtle text-primary rounded-xl transition-all cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /></button>
                                </div>
                            </div>

                            {/* Summary Info */}
                            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                                <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 md:gap-3">
                                    <div className="p-2 bg-emerald-100 text-accent rounded-lg shrink-0">
                                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 tracking-wider">Địa điểm</span>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-700 truncate block">{policy.latitude ? 'Đã bật GPS' : 'Dùng mặc định'}</span>
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 md:gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 tracking-wider">Đang gán</span>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-700 truncate block">
                                            {policy._count && policy._count.employees > 0 
                                                ? `${policy._count.positions + policy._count.employees} đối tượng`
                                                : `${policy._count?.positions || 0} chức vụ`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Preview */}
                            <div className="flex justify-between items-center gap-1">
                                {DAYS_OF_WEEK.map(d => {
                                    const dayData = policy.days.find(pDay => pDay.dayOfWeek === d.value);
                                    const label = d.label.includes('Chủ nhật') ? 'CN' : d.label.split(' ')[1];
                                    return (
                                        <div key={d.value} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[8px] md:text-[10px] font-bold text-slate-400">{label}</span>
                                            <div className={cn(
                                                "w-full h-1 md:h-1.5 rounded-full",
                                                dayData?.isOff ? "bg-slate-200" : "bg-accent-light shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            )} />
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => handleOpenForm(policy)}
                                className="w-full mt-6 py-3 bg-slate-50 text-slate-400 group-hover:bg-accent group-hover:text-white rounded-xl font-bold text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Xem chi tiết & thiết lập
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Side Sheet / Full Modal for Add/Edit */}
            {isFormOpen && (
                <div 
                    onClick={() => setIsFormOpen(false)}
                    className="fixed inset-0 z-[160] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-50 w-full max-w-4xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 relative"
                    >
                        {/* Drawer Header */}
                        <div className="shrink-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 py-4 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 md:p-3 bg-emerald-50 text-accent rounded-xl md:rounded-2xl shrink-0">
                                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate">
                                        {editingPolicy ? 'Chỉnh sửa chính sách' : 'Tạo chính sách mới'}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-wider truncate">Cấu hình thời gian & địa điểm chuyên sâu</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 border-2 border-slate-100 text-slate-500 font-bold text-[10px] md:text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 sm:flex-none px-4 md:px-8 py-2 md:py-2.5 bg-slate-900 text-white font-bold text-[10px] md:text-xs rounded-xl hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                    Lưu chính sách
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 md:space-y-8">
                            {/* General Section */}
                            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <Info size={16} className="text-accent-light" />
                                    Thông tin chung
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Tên chính sách</label>
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-light outline-none transition-all font-bold text-sm"
                                            placeholder="VD: Nhóm Sale Hà Nội, VP Miền Trung..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Mô tả ngắn</label>
                                        <input 
                                            type="text" 
                                            value={formData.note || ''}
                                            onChange={e => setFormData({...formData, note: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-light outline-none transition-all text-sm"
                                            placeholder="Ghi chú về nhóm áp dụng..."
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Loại hình làm việc (Engine Mode)</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'FIXED_TIME', label: 'Hành chính (Cố định)', desc: 'Tính muộn/sớm/OT' },
                                                { id: 'FLEXIBLE', label: 'Linh hoạt', desc: 'Có muộn/sớm, không OT, nhận 1 công' },
                                                { id: 'RAW_TRACKING', label: 'Theo dõi thô', desc: 'Không muộn/sớm/OT, nhận 1 công' }
                                            ].map(mode => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => {
                                                        const isFixed = mode.id === 'FIXED_TIME';
                                                        const isFlexible = mode.id === 'FLEXIBLE';
                                                        const isRaw = mode.id === 'RAW_TRACKING';
                                                        
                                                        setFormData({
                                                           ...formData, 
                                                           configData: { 
                                                               ...formData.configData, 
                                                               theme: mode.id as any,
                                                               attendance_calculation: {
                                                                   ...formData.configData?.attendance_calculation,
                                                                   ignore_late: formData.configData?.attendance_calculation?.ignore_late ?? isRaw,
                                                                   ignore_early: formData.configData?.attendance_calculation?.ignore_early ?? isRaw,
                                                                   always_full_day: formData.configData?.attendance_calculation?.always_full_day ?? !isFixed
                                                               },
                                                               overtime_rules: {
                                                                   ...formData.configData?.overtime_rules,
                                                                   is_allowed: isFixed
                                                               }
                                                           },
                                                           days: (formData.days || []).map(d => ({
                                                                ...d,
                                                                allowOT: isFixed
                                                           }))
                                                        });
                                                    }}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 text-left transition-all",
                                                        formData.configData?.theme === mode.id 
                                                            ? "border-accent-light bg-emerald-50 shadow-md" 
                                                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "block text-xs font-semibold mb-1",
                                                        formData.configData?.theme === mode.id ? "text-emerald-700" : "text-slate-700"
                                                    )}>{mode.label}</span>
                                                    <span className="block text-[10px] text-slate-400">{mode.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* GPS Configuration */}
                            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                        <MapPin size={16} className="text-primary-light" />
                                        Cấu hình GPS (Ghi đè chi nhánh)
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative">
                                                <input 
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.requireGPS}
                                                    onChange={(e) => setFormData({
                                                        ...formData, 
                                                        requireGPS: e.target.checked,
                                                        days: (formData.days || []).map(d => ({ ...d, requireGPS: e.target.checked }))
                                                    })}
                                                />
                                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-light"></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-accent">Bắt buộc GPS</span>
                                        </label>
                                        <button 
                                            onClick={getCurrentLocation}
                                            className="text-[10px] font-bold text-accent border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-50 transition-all cursor-pointer"
                                        >
                                            Lấy tọa độ hiện tại
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Vĩ độ (Latitude)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.latitude || ''}
                                            onChange={e => setFormData({...formData, latitude: e.target.value ? parseFloat(e.target.value) : null})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-light transition-all font-mono text-xs"
                                            placeholder="21.0285..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Kinh độ (Longitude)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.longitude || ''}
                                            onChange={e => setFormData({...formData, longitude: e.target.value ? parseFloat(e.target.value) : null})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-light transition-all font-mono text-xs"
                                            placeholder="105.8542..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Bán kính (Meters)</label>
                                        <input 
                                            type="number"
                                            value={formData.radius || ''}
                                            onChange={e => setFormData({...formData, radius: e.target.value ? parseInt(e.target.value) : null})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-light transition-all font-bold text-sm"
                                            placeholder="200"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                        <strong>Lưu ý:</strong> Nếu để trống các giá trị GPS ở đây, hệ thống sẽ sử dụng tọa độ mặc định của chi nhánh mà nhân viên đang công tác. Nếu bạn muốn cấu hình điểm chấm công riêng cho nhóm này (ví dụ: công trình, kho riêng), hãy điền tọa độ vào đây.
                            </p>
                                </div>
                            </section>

                            {/* Advanced Calculation Rules */}
                            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={16} className="text-warning-light" />
                                    Quy tắc tính toán (Engine Rules)
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                    <div className="space-y-6">
                                        {/* Late / Early Rules */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                                <div className="p-1 px-2 bg-primary-subtle text-primary rounded-lg text-[10px] font-bold italic">Vào trễ - Về sớm</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Ân hạn trễ (Phút)</label>
                                                    <input 
                                                        type="number"
                                                        value={formData.configData?.attendance_calculation?.late_rules?.grace_minutes ?? 15}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            configData: {
                                                                ...formData.configData,
                                                                attendance_calculation: {
                                                                    ...formData.configData?.attendance_calculation,
                                                                    late_rules: { ...formData.configData?.attendance_calculation?.late_rules, grace_minutes: parseInt(e.target.value) || 0 }
                                                                }
                                                            }
                                                        })}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-sm shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Ân hạn sớm (Phút)</label>
                                                    <input 
                                                        type="number"
                                                        value={formData.configData?.attendance_calculation?.early_leave_rules?.grace_minutes ?? 15}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            configData: {
                                                                ...formData.configData,
                                                                attendance_calculation: {
                                                                    ...formData.configData?.attendance_calculation,
                                                                    early_leave_rules: { ...formData.configData?.attendance_calculation?.early_leave_rules, grace_minutes: parseInt(e.target.value) || 0 }
                                                                }
                                                            }
                                                        })}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-sm shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Global Working Hours Config */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between pb-2">
                                                <div className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold italic">Giờ làm việc mặc định</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Bắt đầu làm</label>
                                                    <input 
                                                        type="time"
                                                        value={formData.configData?.schedule?.start_time || '08:00'}
                                                        onChange={e => {
                                                            const newTime = e.target.value;
                                                            setFormData({
                                                                ...formData,
                                                                configData: {
                                                                    ...formData.configData,
                                                                    schedule: { ...formData.configData?.schedule, start_time: newTime } as any
                                                                },
                                                                days: (formData.days || []).map(d => ({ ...d, startTime: newTime }))
                                                            });
                                                        }}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xs shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Kết thúc làm</label>
                                                    <input 
                                                        type="time"
                                                        value={formData.configData?.schedule?.end_time || '17:30'}
                                                        onChange={e => {
                                                            const newTime = e.target.value;
                                                            setFormData({
                                                                ...formData,
                                                                configData: {
                                                                    ...formData.configData,
                                                                    schedule: { ...formData.configData?.schedule, end_time: newTime } as any
                                                                },
                                                                days: (formData.days || []).map(d => ({ ...d, endTime: newTime }))
                                                            });
                                                        }}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xs shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lunch Break Config */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between pb-2">
                                                <div className="p-1 px-2 bg-amber-50 text-warning rounded-lg text-[10px] font-bold italic">Nghỉ trưa mặc định</div>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-warning focus:ring-warning-light cursor-pointer"
                                                        checked={(formData.days || []).every(d => (d as any).hasBreak ?? true)}
                                                        onChange={e => {
                                                            const newDays = (formData.days || []).map(d => ({ ...d, hasBreak: e.target.checked }));
                                                            setFormData({ ...formData, days: newDays });
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-warning">Bật tất cả</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Bắt đầu nghỉ</label>
                                                    <input 
                                                        type="time"
                                                        value={formData.configData?.schedule?.break_start || '12:00'}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            configData: {
                                                                ...formData.configData,
                                                                schedule: { ...formData.configData?.schedule, break_start: e.target.value, is_working_day: true, start_time: '08:00', end_time: '17:30', total_standard_hours: 8 }
                                                            }
                                                        })}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-xs shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 tracking-wider">Kết thúc nghỉ</label>
                                                    <input 
                                                        type="time"
                                                        value={formData.configData?.schedule?.break_end || '13:30'}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            configData: {
                                                                ...formData.configData,
                                                                schedule: { ...formData.configData?.schedule, break_end: e.target.value, is_working_day: true, start_time: '08:00', end_time: '17:30', total_standard_hours: 8 }
                                                            }
                                                        })}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-xs shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Engine Advanced Rules - Compact */}
                                    <div className="space-y-4 md:pl-8 md:border-l border-slate-100">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                            <div className="p-1 px-2 bg-emerald-50 text-accent rounded-lg text-[10px] font-bold italic">Thông số Engine</div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { label: 'Không tính muộn', key: 'ignore_late' },
                                                { label: 'Không tính sớm', key: 'ignore_early' },
                                                { label: 'Luôn tính 1 công', key: 'always_full_day' }
                                            ].map(rule => (
                                                <label key={rule.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group">
                                                    <span className="text-xs font-bold text-slate-700 tracking-tighter">{rule.label}</span>
                                                    <input 
                                                        type="checkbox"
                                                        checked={(formData.configData?.attendance_calculation as any)?.[rule.key] || false}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            configData: {
                                                                ...formData.configData,
                                                                attendance_calculation: {
                                                                    ...formData.configData?.attendance_calculation,
                                                                    [rule.key]: e.target.checked
                                                                }
                                                            }
                                                        })}
                                                        className="w-5 h-5 rounded-lg border-slate-300 text-accent focus:ring-accent-light"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold italic">Tăng ca (Overtime)</div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <div className="space-y-1">
                                            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tự động tính OT</span>
                                            <span className="block text-[10px] text-slate-400 italic">Ghi nhận OT khi làm lố giờ tiêu chuẩn</span>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            className="w-6 h-6 rounded-xl border-slate-300 text-accent focus:ring-accent-light cursor-pointer"
                                            checked={formData.configData?.overtime_rules?.is_allowed ?? true}
                                            onChange={e => setFormData({
                                                ...formData,
                                                configData: {
                                                    ...formData.configData,
                                                    overtime_rules: {
                                                        ...formData.configData?.overtime_rules,
                                                        is_allowed: e.target.checked
                                                    }
                                                },
                                                days: (formData.days || []).map(d => ({ ...d, allowOT: e.target.checked }))
                                            })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Kích hoạt sau (Phút)</label>
                                            <input 
                                                type="number"
                                                value={formData.configData?.overtime_rules?.min_minutes_to_trigger ?? 30}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    configData: {
                                                        ...formData.configData,
                                                        overtime_rules: {
                                                            ...formData.configData?.overtime_rules,
                                                            min_minutes_to_trigger: parseInt(e.target.value) || 0
                                                        }
                                                    }
                                                })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-sm shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Hệ số nhân OT</label>
                                            <input 
                                                type="number" step="0.1"
                                                value={formData.configData?.overtime_rules?.coefficient ?? 1.5}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setFormData({
                                                        ...formData,
                                                        configData: {
                                                            ...formData.configData,
                                                            overtime_rules: {
                                                                ...formData.configData?.overtime_rules,
                                                                coefficient: val
                                                            }
                                                        },
                                                        days: (formData.days || []).map(d => ({ ...d, otMultiplier: val }))
                                                    });
                                                }}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-slate-400 tracking-tight ml-1">Giới hạn tăng ca (Giờ/Ngày)</label>
                                        <input 
                                            type="number" step="0.5"
                                            placeholder="Để trống nếu không giới hạn"
                                            value={formData.configData?.overtime_rules?.capped_hours ?? ''}
                                            onChange={e => setFormData({
                                                ...formData,
                                                configData: {
                                                    ...formData.configData,
                                                    overtime_rules: {
                                                        ...formData.configData?.overtime_rules,
                                                        capped_hours: e.target.value ? parseFloat(e.target.value) : null
                                                    }
                                                }
                                            })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-accent-light transition-all font-bold text-sm shadow-sm"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <div className="space-y-0.5">
                                            <span className="block text-xs font-semibold text-emerald-700">Thứ 7 & CN chỉ tính OT</span>
                                            <span className="block text-[10px] text-accent/70">Mọi giờ làm cuối tuần đều là tăng ca</span>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-emerald-300 text-accent focus:ring-accent-light cursor-pointer"
                                            checked={formData.configData?.overtime_rules?.all_weekend_is_ot ?? false}
                                            onChange={e => setFormData({
                                                ...formData,
                                                configData: {
                                                    ...formData.configData,
                                                    overtime_rules: {
                                                        ...formData.configData?.overtime_rules,
                                                        all_weekend_is_ot: e.target.checked
                                                    }
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Weekly Schedule */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2 pl-4">
                                    <Calendar size={16} className="text-blue-500" />
                                    Cấu hình linh hoạt theo ngày
                                </h3>
                                <div className="grid grid-cols-1 gap-5">
                                    {(formData.days || []).map((day, idx) => (
                                        <div key={day.dayOfWeek} className={cn(
                                            "bg-white rounded-[2rem] p-6 border-2 transition-all duration-300",
                                            day.isOff ? "border-slate-100 opacity-70" : "border-white shadow-lg hover:shadow-2xl"
                                        )}>
                                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                                {/* Day Switcher Component */}
                                                <div className="flex items-center gap-3 w-full lg:w-44 shrink-0">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-inner",
                                                        day.isOff ? "bg-slate-100 text-slate-300" : "bg-gradient-to-br from-emerald-400 to-accent text-white shadow-emerald-200"
                                                    )}>
                                                        {DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label.split(' ')[1]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-slate-800 text-[11px] italic tracking-tight truncate">
                                                            {DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label}
                                                        </h4>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDayChange(idx, 'isOff', !day.isOff)}
                                                            className={cn(
                                                                "mt-0.5 px-2 py-0.5 rounded-full text-[8px] font-semibold tracking-tight transition-all",
                                                                day.isOff ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-accent"
                                                            )}
                                                        >
                                                            {day.isOff ? "Nghỉ" : "Làm"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {!day.isOff ? (
                                                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-6 gap-3 w-full">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-semibold text-slate-400 tracking-tight flex items-center gap-1">
                                                                <Clock size={10} className="text-accent-light" /> Vào
                                                            </label>
                                                            <input 
                                                                type="time" 
                                                                value={day.startTime}
                                                                onChange={e => handleDayChange(idx, 'startTime', e.target.value)}
                                                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-accent-light outline-none font-bold text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-semibold text-slate-400 tracking-tight flex items-center gap-1">
                                                                <Clock size={10} className="text-primary-light" /> Ra
                                                            </label>
                                                            <input 
                                                                type="time" 
                                                                value={day.endTime}
                                                                onChange={e => handleDayChange(idx, 'endTime', e.target.value)}
                                                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-accent-light outline-none font-bold text-xs"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 space-y-1">
                                                            <div className="flex items-center justify-start gap-2">
                                                                    <label className="text-[9px] font-semibold text-slate-400 tracking-tight flex items-center gap-1 cursor-pointer">
                                                                        <Zap size={10} className="text-warning-light" /> Nghỉ trưa
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={(day as any).hasBreak ?? true}
                                                                        onChange={e => handleDayChange(idx, 'hasBreak', e.target.checked)}
                                                                        className="w-3 h-3 rounded ml-1 cursor-pointer"
                                                                    />
                                                                </label>
                                                            </div>
                                                            {((day as any).hasBreak ?? true) && (
                                                                <div className="flex items-center gap-2">
                                                                    <input 
                                                                        type="time" 
                                                                        value={(day as any).breakStartTime || '12:00'}
                                                                        onChange={e => handleDayChange(idx, 'breakStartTime', e.target.value)}
                                                                        className="flex-1 min-w-[85px] px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold outline-none"
                                                                    />
                                                                    <span className="text-slate-300 text-[10px] shrink-0">-</span>
                                                                    <input 
                                                                        type="time" 
                                                                        value={(day as any).breakEndTime || '13:30'}
                                                                        onChange={e => handleDayChange(idx, 'breakEndTime', e.target.value)}
                                                                        className="flex-1 min-w-[85px] px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold outline-none"
                                                                    />
                                                                </div>
                                                            )}
                                                            {!((day as any).hasBreak ?? true) && (
                                                                <div className="py-1.5 text-[8px] text-slate-300 italic font-bold">Không nghỉ</div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-semibold text-slate-400 tracking-tight flex items-center gap-1">
                                                                OT
                                                            </label>
                                                            <input 
                                                                type="number" step="0.1"
                                                                value={day.otMultiplier}
                                                                onChange={e => handleDayChange(idx, 'otMultiplier', e.target.value)}
                                                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-accent-light outline-none font-bold text-xs"
                                                            />
                                                        </div>
                                                        <div className="flex items-center lg:items-end justify-start gap-3 flex-wrap h-full lg:col-span-1">
                                                            <label className="flex items-center gap-1.5 cursor-pointer group">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={day.requireGPS}
                                                                    onChange={e => handleDayChange(idx, 'requireGPS', e.target.checked)}
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-accent focus:ring-accent-light cursor-pointer"
                                                                />
                                                                <span className="text-[9px] font-semibold text-slate-500 tracking-tight group-hover:text-accent">GPS</span>
                                                            </label>
                                                            <label className="flex items-center gap-1.5 cursor-pointer group">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={day.allowOT}
                                                                    onChange={e => handleDayChange(idx, 'allowOT', e.target.checked)}
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                                <span className="text-[9px] font-semibold text-slate-500 tracking-tight group-hover:text-blue-600">OT</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center">
                                                        <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-[0.1em]">
                                                            Ngày nghỉ - Tự động tính OT nếu có dữ liệu
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Xóa chính sách?"
                message="Dữ liệu chính sách sẽ bị xóa vĩnh viễn và các chức vụ đang gán theo chính sách này sẽ quay về mặc định."
                isDanger={true}
            />
        </div>
    );
}

function BadgeCheck({ size, className }: { size: number, className: string }) {
    return <Check size={size} className={className} />;
}
