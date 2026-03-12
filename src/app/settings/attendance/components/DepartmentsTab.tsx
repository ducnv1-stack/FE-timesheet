'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Save, X, Search, Loader2, User, Users } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';
import { cn } from '@/lib/utils';

interface Department {
    id: string;
    name: string;
    note: string | null;
    _count?: {
        employees: number;
    };
}

export default function DepartmentsTab() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { success, error: toastError } = useToast();
    
    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '', note: '' });
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
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/departments`);
            const data = await res.json();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toastError('Không thể tải danh sách phòng ban');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({ name: dept.name, note: dept.note || '' });
        } else {
            setEditingDept(null);
            setFormData({ name: '', note: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toastError('Vui lòng nhập tên phòng ban');
            return;
        }

        setSaving(true);
        try {
            const url = editingDept 
                ? `${API_URL}/departments/${editingDept.id}` 
                : `${API_URL}/departments`;
            const method = editingDept ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Lỗi khi lưu phòng ban');
            }

            success(editingDept ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
            setIsModalOpen(false);
            fetchDepartments();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            const res = await fetch(`${API_URL}/departments/${deleteConfirm.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Lỗi khi xóa phòng ban');
            }

            success('Đã xóa phòng ban');
            fetchDepartments();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const handleViewEmployees = async (deptId: string, deptName: string) => {
        setEmployeeModal({
            isOpen: true,
            groupName: deptName,
            employees: [],
            loading: true
        });

        try {
            const res = await fetch(`${API_URL}/employees?departmentId=${deptId}`);
            if (!res.ok) throw new Error('Không thể tải danh sách nhân sự');
            const data = await res.json();
            setEmployeeModal(prev => ({ ...prev, employees: data, loading: false }));
        } catch (error: any) {
            toastError(error.message);
            setEmployeeModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
    };

    const filteredDepts = departments.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.note && d.note.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm phòng ban..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Thêm phòng ban
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
                </div>
            ) : filteredDepts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Không tìm thấy phòng ban nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDepts.map((dept) => (
                        <div 
                            key={dept.id} 
                            className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Decorative background element */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(dept)}
                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteConfirm({ isOpen: true, id: dept.id })}
                                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-rose-600 transition-colors tracking-tight">
                                {dept.name}
                            </h3>
                            <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5rem] mb-4">
                                {dept.note || 'Không có mô tả'}
                            </p>
                            
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider">Nhân sự</span>
                                <button 
                                    onClick={() => handleViewEmployees(dept.id, dept.name)}
                                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    <Users className="w-3 h-3" />
                                    {dept._count?.employees || 0} thành viên
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
                                {editingDept ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider pl-1">Tên phòng ban</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm font-bold"
                                    placeholder="VD: Phòng Kinh Doanh, Kỹ Thuật..."
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider pl-1">Mô tả / ghi chú</label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm min-h-[100px] resize-none"
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
                title="Xóa Phòng Ban?"
                message="Thao tác này không thể hoàn tác. Các nhân sự thuộc phòng ban này sẽ không còn liên kết phòng ban."
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
                                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải...</p>
                                </div>
                            ) : employeeModal.employees.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm font-medium text-slate-500 italic">Không có nhân sự nào trong nhóm này</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {employeeModal.employees.map((emp) => (
                                        <div key={emp.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 hover:bg-rose-50/50 hover:border-rose-100 transition-all group">
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
                                                        <div className="hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm group-hover:bg-rose-100 transition-colors">
                                                            <User className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm group-hover:bg-rose-100 transition-colors">
                                                        <User className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                                                    emp.status === 'Đang làm việc' ? "bg-emerald-500" : "bg-slate-300"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate leading-tight mb-0.5 group-hover:text-rose-600 transition-colors">{emp.fullName}</h4>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] font-bold text-slate-400 truncate">{emp.pos?.name || 'Chưa gán chức vụ'}</p>
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
