'use client';

import { useState, useEffect } from 'react';
import { 
    Settings, Plus, Edit2, Trash2, Save, X, Search, Loader2, 
    Clock, MapPin, Calendar, Info, Check, AlertCircle, ChevronRight
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
                days: policy.days.sort((a, b) => {
                    const order = [1, 2, 3, 4, 5, 6, 0];
                    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
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
                    note: null
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

    const handleDayChange = (index: number, field: keyof AttendancePolicyDay, value: any) => {
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

            // Sanitize GPS data
            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude.toString()) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude.toString()) : null,
                radius: formData.radius ? parseInt(formData.radius.toString()) : null,
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
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    />
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Tạo chính sách mới
                </button>
            </div>

            {/* List View */}
            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
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
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight truncate">{policy.name}</h3>
                                    <p className="text-xs md:text-sm text-slate-400 font-medium line-clamp-2 md:line-clamp-1">{policy.note || 'Không có mô tả'}</p>
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => handleOpenForm(policy)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all cursor-pointer" title="Sửa"><Edit2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /></button>
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: policy.id })} className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-all cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /></button>
                                </div>
                            </div>

                            {/* Summary Info */}
                            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                                <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 md:gap-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
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
                                                dayData?.isOff ? "bg-slate-200" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            )} />
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => handleOpenForm(policy)}
                                className="w-full mt-6 py-3 bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white rounded-xl font-bold text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-50 w-full max-w-4xl h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 custom-scrollbar relative">
                        {/* Drawer Header */}
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 py-4 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl shrink-0">
                                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate">
                                        {editingPolicy ? 'Chỉnh sửa chính sách' : 'Tạo chính sách mới'}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider truncate">Cấu hình thời gian & địa điểm chuyên sâu</p>
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

                        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                            {/* General Section */}
                            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={16} className="text-emerald-500" />
                                    Thông tin chung
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 tracking-wider ml-1">Tên chính sách</label>
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm"
                                            placeholder="VD: Nhóm Sale Hà Nội, VP Miền Trung..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 tracking-wider ml-1">Mô tả ngắn</label>
                                        <input 
                                            type="text" 
                                            value={formData.note || ''}
                                            onChange={e => setFormData({...formData, note: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                            placeholder="Ghi chú về nhóm áp dụng..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* GPS Configuration */}
                            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 tracking-wider flex items-center gap-2">
                                        <MapPin size={16} className="text-rose-500" />
                                        Cấu hình GPS (Ghi đè chi nhánh)
                                    </h3>
                                    <button 
                                        onClick={getCurrentLocation}
                                        className="text-[10px] font-bold text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-50 transition-all cursor-pointer"
                                    >
                                        Lấy tọa độ hiện tại
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 tracking-wider ml-1">Vĩ độ (Latitude)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.latitude || ''}
                                            onChange={e => setFormData({...formData, latitude: e.target.value ? parseFloat(e.target.value) : null})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-mono text-xs"
                                            placeholder="21.0285..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 tracking-wider ml-1">Kinh độ (Longitude)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.longitude || ''}
                                            onChange={e => setFormData({...formData, longitude: e.target.value ? parseFloat(e.target.value) : null})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-mono text-xs"
                                            placeholder="105.8542..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 tracking-wider ml-1">Bán kính (Meters)</label>
                                        <input 
                                            type="number"
                                            value={formData.radius || ''}
                                            onChange={e => setFormData({...formData, radius: e.target.value ? parseInt(e.target.value) : null})}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-sm"
                                            placeholder="200"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                        <strong>Lưu ý:</strong> Nếu để trống các giá trị GPS ở đây, hệ thống sẽ sử dụng tọa độ mặc định của chi nhánh mà nhân viên đang công tác. Nếu bạn muốn cấu hình điểm chấm công riêng cho nhóm này (ví dụ: công trình, kho riêng), hãy điền tọa độ vào đây.
                                    </p>
                                </div>
                            </section>

                            {/* Weekly Schedule */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 tracking-wider flex items-center gap-2 pl-4">
                                    <Calendar size={16} className="text-blue-500" />
                                    Lịch biểu hàng tuần
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {(formData.days || []).map((day, idx) => (
                                        <div key={day.dayOfWeek} className={cn(
                                            "bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border-2 transition-all duration-300",
                                            day.isOff ? "border-slate-100 opacity-60 grayscale" : "border-white shadow-md hover:shadow-xl"
                                        )}>
                                            <div className="flex flex-col lg:flex-row items-center gap-6">
                                                {/* Day Switcher */}
                                                <div className="flex items-center gap-4 w-full lg:w-48 shrink-0">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                                                        day.isOff ? "bg-slate-100 text-slate-400" : "bg-emerald-500 text-white shadow-lg"
                                                    )}>
                                                        {DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label.split(' ')[1]}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleToggleDayOff(idx)}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 border-2",
                                                            day.isOff 
                                                                ? "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50 scale-100 active:scale-95" 
                                                                : "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 hover:border-emerald-600 scale-100 active:scale-95"
                                                        )}
                                                    >
                                                        {day.isOff ? <X size={12} className="shrink-0" /> : <Check size={12} className="shrink-0" />}
                                                        {day.isOff ? 'NGHỈ' : 'LÀM'}
                                                    </button>
                                                </div>

                                                {!day.isOff && (
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 w-full">
                                                        <div className="lg:col-span-1 space-y-1.5">
                                                            <label className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                                                <Clock size={12} /> Bắt đầu
                                                            </label>
                                                            <input 
                                                                type="time" 
                                                                value={day.startTime}
                                                                onChange={e => handleDayChange(idx, 'startTime', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                                                <Clock size={12} /> Kết thúc
                                                            </label>
                                                            <input 
                                                                type="time" 
                                                                value={day.endTime}
                                                                onChange={e => handleDayChange(idx, 'endTime', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                                                Hệ số OT
                                                            </label>
                                                            <input 
                                                                type="number" step="0.1"
                                                                value={day.otMultiplier}
                                                                onChange={e => handleDayChange(idx, 'otMultiplier', e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                                                            />
                                                        </div>
                                                        <div className="flex items-end pb-2 gap-3 flex-wrap lg:col-span-2">
                                                            <label className="flex items-center gap-1.5 cursor-pointer group shrink-0">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={day.requireGPS}
                                                                    onChange={e => handleDayChange(idx, 'requireGPS', e.target.checked)}
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight group-hover:text-emerald-600">GPS</span>
                                                            </label>
                                                            <label className="flex items-center gap-1.5 cursor-pointer group shrink-0">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={day.allowOT}
                                                                    onChange={e => handleDayChange(idx, 'allowOT', e.target.checked)}
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight group-hover:text-blue-600">OT</span>
                                                            </label>
                                                            <label className="flex items-center gap-1.5 cursor-pointer group shrink-0">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={day.isFlexible}
                                                                    onChange={e => handleDayChange(idx, 'isFlexible', e.target.checked)}
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                                />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight group-hover:text-amber-600">Linh hoạt</span>
                                                            </label>
                                                        </div>
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
