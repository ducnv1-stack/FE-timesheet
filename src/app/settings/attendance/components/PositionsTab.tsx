'use client';

import { useState, useEffect } from 'react';
import { BadgeCheck, Plus, Edit2, Trash2, Save, X, Search, Loader2, Settings, User, Users } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';
import { cn } from '@/lib/utils';

interface AttendancePolicy {
    id: string;
    name: string;
}

interface Position {
    id: string;
    name: string;
    note: string | null;
    attendancePolicyId: string | null;
    attendancePolicy: AttendancePolicy | null;
    _count?: {
        employees: number;
    };
}

export default function PositionsTab() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { success, error: toastError } = useToast();
    
    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPos, setEditingPos] = useState<Position | null>(null);
    const [formData, setFormData] = useState({ name: '', note: '', attendancePolicyId: '' });
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    // Employee List Modal state
    const [employeeModal, setEmployeeModal] = useState<{ 
        isOpen: boolean; 
        groupName: string; 
        employees: any[]; 
        loading: boolean 
    }>({
        isOpen: false,
        groupName: '',
        employees: [],
        loading: false
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [posRes, polRes] = await Promise.all([
                fetch(`${API_URL}/positions`),
                fetch(`${API_URL}/attendance-policies`)
            ]);
            const posData = await posRes.json();
            const polData = await polRes.json();
            setPositions(posData);
            setPolicies(polData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toastError('Không thể tải dữ liệu chức vụ/chính sách');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (pos?: Position) => {
        if (pos) {
            setEditingPos(pos);
            setFormData({ 
                name: pos.name, 
                note: pos.note || '', 
                attendancePolicyId: pos.attendancePolicyId || '' 
            });
        } else {
            setEditingPos(null);
            setFormData({ name: '', note: '', attendancePolicyId: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toastError('Vui lòng nhập tên chức vụ');
            return;
        }

        setSaving(true);
        try {
            const url = editingPos 
                ? `${API_URL}/positions/${editingPos.id}` 
                : `${API_URL}/positions`;
            const method = editingPos ? 'PATCH' : 'POST';

            // Clean data: if attendancePolicyId is empty string, set it to null
            const payload = {
                ...formData,
                attendancePolicyId: formData.attendancePolicyId || null
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Lỗi khi lưu chức vụ');
            }

            success(editingPos ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            const res = await fetch(`${API_URL}/positions/${deleteConfirm.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Lỗi khi xóa chức vụ');
            }

            success('Đã xóa chức vụ');
            fetchData();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const handleViewEmployees = async (posId: string, posName: string) => {
        setEmployeeModal({
            isOpen: true,
            groupName: posName,
            employees: [],
            loading: true
        });

        try {
            const res = await fetch(`${API_URL}/employees?positionId=${posId}`);
            if (!res.ok) throw new Error('Không thể tải danh sách nhân sự');
            const data = await res.json();
            setEmployeeModal(prev => ({ ...prev, employees: data, loading: false }));
        } catch (error: any) {
            toastError(error.message);
            setEmployeeModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
    };

    const filteredPositions = positions.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.note && p.note.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chức vụ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Thêm chức vụ
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
                </div>
            ) : filteredPositions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BadgeCheck className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Không tìm thấy chức vụ nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPositions.map((pos) => (
                        <div 
                            key={pos.id} 
                            className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <BadgeCheck className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(pos)}
                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm({ isOpen: true, id: pos.id })}
                                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors tracking-tight">
                                {pos.name}
                            </h3>
                            
                            {/* Policy Info */}
                            <div className="flex items-center gap-2 mb-3">
                                <Settings className="w-3.5 h-3.5 text-slate-400" />
                                <span className={cn(
                                    "text-[11px] font-bold px-2 py-0.5 rounded-md",
                                    pos.attendancePolicy 
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                        : "bg-slate-100 text-slate-400 border border-slate-200"
                                )}>
                                    {pos.attendancePolicy?.name || 'Chưa gán chính sách'}
                                </span>
                            </div>

                            <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5rem] mb-4">
                                {pos.note || 'Không có mô tả'}
                            </p>
                            
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider">Nhân sự</span>
                                <button 
                                    onClick={() => handleViewEmployees(pos.id, pos.name)}
                                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    <Users className="w-3 h-3" />
                                    {pos._count?.employees || 0} thành công
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                {editingPos ? 'Cập nhật chức vụ' : 'Thêm chức vụ mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider pl-1">Tên chức vụ</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold"
                                    placeholder="VD: NV Bán Hàng, Quản Lý..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider pl-1">Chính sách chấm công</label>
                                <select
                                    value={formData.attendancePolicyId}
                                    onChange={(e) => setFormData({ ...formData, attendancePolicyId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold cursor-pointer"
                                >
                                    <option value="">-- Mặc định (Theo Chi nhánh) --</option>
                                    {policies.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider pl-1">Mô tả / ghi chú</label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm min-h-[80px] resize-none"
                                    placeholder="Nhập mô tả chi tiết nếu có..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-6 border-2 border-slate-100 text-slate-500 font-black text-xs rounded-2xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                                    disabled={saving}
                                >
                                    HỦY
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-6 bg-slate-900 text-white font-bold text-xs rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? 'Đang lưu...' : 'Lưu lại'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Xóa Chức Vụ?"
                message="Thao tác này không thể hoàn tác. Các nhân sự thuộc chức vụ này sẽ không còn liên kết chức vụ."
                isDanger={true}
            />

            {/* Employee List Modal */}
            {employeeModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white tracking-wide leading-none mb-1">Thành viên</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{employeeModal.groupName}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setEmployeeModal(prev => ({ ...prev, isOpen: false }))} 
                                className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {employeeModal.loading ? (
                                <div className="py-12 flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải...</p>
                                </div>
                            ) : employeeModal.employees.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm font-medium text-slate-500 italic">Không có nhân sự nào giữ chức vụ này</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {employeeModal.employees.map((emp) => (
                                        <div key={emp.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 hover:bg-blue-50/50 hover:border-blue-100 transition-all group">
                                            <div className="relative">
                                                {emp.avatarUrl ? (
                                                    <>
                                                        <img 
                                                            src={`${API_URL}${emp.avatarUrl}`} 
                                                            alt={emp.fullName} 
                                                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).onerror = null;
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                                                if (fallback) fallback.classList.remove('hidden');
                                                            }}
                                                        />
                                                        <div className="hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm group-hover:bg-blue-100 transition-colors">
                                                            <User className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm group-hover:bg-blue-100 transition-colors">
                                                        <User className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                                                    emp.status === 'Đang làm việc' ? "bg-emerald-500" : "bg-slate-300"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate leading-tight mb-0.5 group-hover:text-blue-600 transition-colors">{emp.fullName}</h4>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] font-bold text-slate-400 truncate">{emp.dept?.name || 'Phát vãng'}</p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <p className="text-[10px] font-bold text-slate-400">{emp.employeeCode || emp.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-200">
                                Tổng cộng: {employeeModal.employees.length} nhân sự
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
