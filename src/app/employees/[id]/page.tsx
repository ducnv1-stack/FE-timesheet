'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, UserPlus, Key, Lock, Unlock, TrendingUp, Edit, X, Calendar, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';
import { cn } from '@/lib/utils';

interface Employee {
    id: string;
    fullName: string;
    phone: string | null;
    position: string;
    department: string | null;
    status: string | null;
    birthday: string | null;
    gender: string | null;
    workingType: string | null;
    joinDate: string | null;
    contractType: string | null;
    contractSigningDate: string | null;
    idCardNumber: string | null;
    permanentAddress: string | null;
    email: string | null;
    socialInsuranceNumber: string | null;
    isInternalDriver: boolean;
    branch: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        username: string;
        isActive: boolean;
        role: {
            id: string;
            name: string;
        };
    } | null;
}

export default function EmployeeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { success, error: toastError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [branches, setBranches] = useState<any[]>([]);

    // Account creation modal
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [roles, setRoles] = useState<any[]>([]);

    // Reset password modal
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Edit account modal
    const [showEditAccount, setShowEditAccount] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editRoleId, setEditRoleId] = useState('');

    // Confirmation modal
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Performance stats
    const [performanceDetail, setPerformanceDetail] = useState<any>(null);
    const [perfMonth, setPerfMonth] = useState(new Date().getMonth() + 1);
    const [perfYear, setPerfYear] = useState(new Date().getFullYear());
    const [currentUser, setCurrentUser] = useState<any>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        if (params.id) {
            fetchEmployee();
            fetchRoles();
            fetchBranches();
        }
    }, [params.id]);

    const fetchEmployee = async () => {
        try {
            const res = await fetch(`${API_URL}/employees/${params.id}`);
            const data = await res.json();
            setEmployee(data);
        } catch (error) {
            console.error('Error fetching employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_URL}/roles`);
            const data = await res.json();
            setRoles(data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };
    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_URL}/branches`);
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };
    const handleStartEdit = () => {
        if (employee) {
            setEditForm({
                ...employee,
                branchId: employee.branch.id,
                birthday: employee.birthday ? new Date(employee.birthday).toISOString().split('T')[0] : '',
                joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
                contractSigningDate: employee.contractSigningDate ? new Date(employee.contractSigningDate).toISOString().split('T')[0] : '',
            });
            setIsEditing(true);
        }
    };
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({});
    };
    const handleSaveEmployee = async () => {
        setSaving(true);
        try {
            const allowedFields = [
                'fullName', 'phone', 'branchId', 'position', 'department',
                'birthday', 'gender', 'status', 'workingType', 'joinDate',
                'contractType', 'contractSigningDate', 'idCardNumber',
                'permanentAddress', 'email', 'socialInsuranceNumber', 'isInternalDriver'
            ];

            const updateData: any = {};
            allowedFields.forEach(field => {
                if (editForm[field] !== undefined) {
                    updateData[field] = editForm[field];
                }
            });

            // Convert empty strings back to null for better DB consistency
            const optionalFields = [
                'birthday', 'joinDate', 'contractSigningDate', 'phone',
                'idCardNumber', 'permanentAddress', 'email', 'socialInsuranceNumber'
            ];

            optionalFields.forEach(field => {
                if (updateData[field] === '') {
                    updateData[field] = null;
                }
            });

            const res = await fetch(`${API_URL}/employees/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update employee');
            }
            success('Cập nhật thông tin thành công!');
            setIsEditing(false);
            fetchEmployee();
        } catch (error: any) {
            toastError('Lỗi: ' + (Array.isArray(error.message) ? error.message.join(', ') : error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!username || !password || !roleId) {
            toastError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/employees/${params.id}/create-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, roleId }),
            });

            if (!res.ok) throw new Error('Failed to create account');

            success('Tạo tài khoản thành công!');
            setShowCreateAccount(false);
            fetchEmployee();
        } catch (error: any) {
            toastError('Lỗi: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toastError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/employees/${params.id}/reset-password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });

            if (!res.ok) throw new Error('Failed to reset password');

            success('Reset mật khẩu thành công!');
            setShowResetPassword(false);
            setNewPassword('');
        } catch (error: any) {
            toastError('Lỗi: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditAccount = () => {
        if (employee?.user) {
            setEditUsername(employee.user.username);
            setEditRoleId(employee.user.role.id);
            setShowEditAccount(true);
        }
    };

    const handleUpdateAccount = async () => {
        if (!editUsername || !editRoleId) {
            toastError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/employees/${params.id}/account`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: editUsername,
                    roleId: editRoleId
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update account');
            }

            success('Cập nhật tài khoản thành công!');
            setShowEditAccount(false);
            fetchEmployee();
        } catch (error: any) {
            toastError('Lỗi: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAccount = async () => {
        if (!employee?.user) return;

        const newStatus = !employee.user.isActive;

        setConfirmModal({
            isOpen: true,
            title: newStatus ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
            message: `Bạn có chắc chắn muốn ${newStatus ? 'MỞ KHÓA' : 'KHÓA'} quyền truy cập của nhân viên ${employee.fullName}?`,
            isDanger: !newStatus,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetch(`${API_URL}/employees/${params.id}/toggle-account`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isActive: newStatus }),
                    });

                    if (!res.ok) throw new Error('Failed to toggle account');

                    success(`${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản thành công!`);
                    fetchEmployee();
                } catch (error: any) {
                    toastError('Lỗi: ' + error.message);
                }
            }
        });
    };

    const fetchPerformanceStats = async () => {
        try {
            const res = await fetch(`${API_URL}/employees/${params.id}/performance?month=${perfMonth}&year=${perfYear}`);
            if (!res.ok) return;
            const data = await res.json();
            setPerformanceDetail(data);
        } catch (error) {
            console.error('Error fetching performance stats:', error);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            if (['DIRECTOR', 'CHIEF_ACCOUNTANT'].includes(user.role?.code)) {
                fetchPerformanceStats();
            }
        }
    }, [perfMonth, perfYear, params.id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-xl text-slate-600">Không tìm thấy nhân viên</p>
                <button onClick={() => router.back()} className="px-6 py-3 bg-slate-600 text-white rounded-lg">
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={() => router.push('/employees')}
                        className="p-1.5 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">{employee.fullName}</h1>
                        <p className="text-[10px] text-slate-500">Chi tiết nhân viên</p>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-slate-900">Thông Tin Cơ Bản</h2>
                        <div className="flex gap-1.5">
                            {!isEditing ? (
                                <button
                                    onClick={handleStartEdit}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    Chỉnh sửa
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveEmployee}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {saving ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Hủy
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <InfoField
                            label="Họ tên"
                            value={employee.fullName}
                            isEditing={isEditing}
                            editValue={editForm.fullName}
                            onChange={(val) => setEditForm({ ...editForm, fullName: val })}
                        />
                        <InfoField
                            label="SĐT"
                            value={employee.phone}
                            isEditing={isEditing}
                            editValue={editForm.phone}
                            onChange={(val) => setEditForm({ ...editForm, phone: val })}
                        />
                        <InfoField
                            label="Chi nhánh"
                            value={employee.branch.name}
                            isEditing={isEditing}
                            type="select"
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                            editValue={editForm.branchId}
                            onChange={(val) => setEditForm({ ...editForm, branchId: val })}
                        />
                        <InfoField
                            label="Chức vụ"
                            value={employee.position}
                            isEditing={isEditing}
                            type="select"
                            options={[
                                { label: 'Giám đốc (GĐ)', value: 'GĐ' },
                                { label: 'Giám đốc KD (GĐKD)', value: 'GĐKD' },
                                { label: 'Trợ lý Giám đốc', value: 'Trợ lý GĐ' },
                                { label: 'Quản Lý', value: 'Quản Lý' },
                                { label: 'Nhân viên bán hàng (NVBH)', value: 'NVBH' },
                                { label: 'Kế toán', value: 'Kế toán' },
                                { label: 'Media', value: 'Media' },
                                { label: 'ADS', value: 'ADS' },
                                { label: 'HCNS', value: 'HCNS' },
                                { label: 'Nhân viên KT (NVKT)', value: 'NVKT' },
                                { label: 'Lái xe (Driver)', value: 'Driver' },
                                { label: 'Nhân viên (Khác)', value: 'Nhân viên' },
                            ]}
                            editValue={editForm.position}
                            onChange={(val) => setEditForm({ ...editForm, position: val })}
                        />
                        <InfoField
                            label="Phòng ban"
                            value={employee.department}
                            isEditing={isEditing}
                            type="select"
                            options={[
                                { label: 'BGĐ', value: 'BGĐ' },
                                { label: 'MKT', value: 'MKT' },
                                { label: 'HCKT', value: 'HCKT' },
                                { label: 'Kỹ Thuật', value: 'Kỹ Thuật' },
                                { label: 'Kho', value: 'Kho' },
                                { label: 'Lái xe', value: 'Lái xe' },
                                { label: 'Phòng KD', value: 'Phòng KD' },
                            ]}
                            editValue={editForm.department}
                            onChange={(val) => setEditForm({ ...editForm, department: val })}
                        />
                        <InfoField
                            label="Trạng thái"
                            value={employee.status}
                            isEditing={isEditing}
                            type="select"
                            options={[
                                { label: 'Đang làm việc', value: 'Đang làm việc' },
                                { label: 'Nghỉ việc', value: 'Nghỉ việc' },
                            ]}
                            editValue={editForm.status}
                            onChange={(val) => setEditForm({ ...editForm, status: val })}
                        />
                        <InfoField
                            label="Loại công việc"
                            value={employee.workingType}
                            isEditing={isEditing}
                            editValue={editForm.workingType}
                            onChange={(val) => setEditForm({ ...editForm, workingType: val })}
                        />
                        <InfoField
                            label="Giới tính"
                            value={employee.gender}
                            isEditing={isEditing}
                            type="select"
                            options={[
                                { label: 'Nam', value: 'Nam' },
                                { label: 'Nữ', value: 'Nữ' },
                            ]}
                            editValue={editForm.gender}
                            onChange={(val) => setEditForm({ ...editForm, gender: val })}
                        />
                        <InfoField
                            label="Email"
                            value={employee.email}
                            isEditing={isEditing}
                            editValue={editForm.email}
                            onChange={(val) => setEditForm({ ...editForm, email: val })}
                        />
                        <InfoField
                            label="CMND/CCCD"
                            value={employee.idCardNumber}
                            isEditing={isEditing}
                            editValue={editForm.idCardNumber}
                            onChange={(val) => setEditForm({ ...editForm, idCardNumber: val })}
                        />
                        <InfoField
                            label="Địa chỉ"
                            value={employee.permanentAddress}
                            isEditing={isEditing}
                            editValue={editForm.permanentAddress}
                            onChange={(val) => setEditForm({ ...editForm, permanentAddress: val })}
                        />
                        <InfoField
                            label="Ngày sinh"
                            value={employee.birthday ? new Date(employee.birthday).toLocaleDateString('vi-VN') : '-'}
                            isEditing={isEditing}
                            type="date"
                            editValue={editForm.birthday}
                            onChange={(val) => setEditForm({ ...editForm, birthday: val })}
                        />
                    </div>
                </div>

                {/* Performance Stats Section (Authorized Only) */}
                {['DIRECTOR', 'CHIEF_ACCOUNTANT'].includes(currentUser?.role?.code) && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <TrendingUp className="text-rose-500 w-4 h-4" />
                                Hiệu Suất & Thưởng
                            </h2>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold border border-slate-200 shadow-inner">
                                <select
                                    value={perfMonth}
                                    onChange={(e) => setPerfMonth(parseInt(e.target.value))}
                                    className="bg-transparent px-2 py-1 outline-none cursor-pointer hover:text-rose-600 transition-colors"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                    ))}
                                </select>
                                <div className="w-[1px] bg-slate-200 my-1 mx-0.5"></div>
                                <select
                                    value={perfYear}
                                    onChange={(e) => setPerfYear(parseInt(e.target.value))}
                                    className="bg-transparent px-2 py-1 outline-none cursor-pointer hover:text-rose-600 transition-colors"
                                >
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                            </div>
                        </div>

                        {performanceDetail ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="group bg-rose-50/30 p-3 rounded-xl border border-rose-100/50 hover:bg-rose-50/50 transition-all duration-300">
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider mb-1">Doanh số tháng</p>
                                        <p className="text-lg font-black text-slate-900 group-hover:scale-105 transition-transform origin-left">{formatCurrency(performanceDetail.totalRevenue)}</p>
                                    </div>
                                    <div className="group bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 hover:bg-slate-50 transition-all duration-300">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Tỷ lệ đơn dưới Min</p>
                                        <div className="flex items-center gap-2">
                                            <p className={cn(
                                                "text-lg font-black",
                                                performanceDetail.isPenalty ? "text-red-600" : "text-emerald-600"
                                            )}>
                                                {performanceDetail.lowPriceRatio.toFixed(1)}%
                                            </p>
                                            {performanceDetail.isPenalty && !performanceDetail.isClemency && (
                                                <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase ring-2 ring-red-50">Bị phạt</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="group bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 hover:bg-emerald-50/50 transition-all duration-300">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider mb-1">Thưởng thực nhận</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-black text-emerald-700 group-hover:scale-105 transition-transform origin-left">{formatCurrency(performanceDetail.actualReward)}</p>
                                            {performanceDetail.isClemency && (
                                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase ring-2 ring-amber-50">Khoan hồng</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs overflow-hidden relative">
                                    <div className="flex justify-between items-center mb-2 relative z-10">
                                        <span className="text-slate-500 font-bold text-[11px]">Mốc thưởng đạt được:</span>
                                        <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">{formatCurrency(performanceDetail.milestone)}</span>
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="text-slate-500 font-bold text-[11px]">Thưởng mốc tối đa:</span>
                                        <span className="font-black text-slate-500 line-through decoration-slate-300 decoration-1">{formatCurrency(performanceDetail.baseReward)}</span>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 text-slate-100/50 rotate-12">
                                        <TrendingUp size={60} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
                                <p className="text-slate-400 font-bold text-sm tracking-wide">ĐANG TẢI DỮ LIỆU HIỆU SUẤT...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Account Management */}
                <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 mb-3">Quản Lý Tài Khoản</h2>
                    {employee.user ? (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <InfoField label="Username" value={employee.user.username} />
                                <InfoField label="Vai trò" value={employee.user.role.name} />
                                <InfoField label="Trạng thái" value={employee.user.isActive ? '✓ Hoạt động' : '✗ Bị khóa'} />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowResetPassword(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold"
                                >
                                    <Key className="w-3.5 h-3.5" />
                                    Reset Mật Khẩu
                                </button>
                                <button
                                    onClick={handleToggleAccount}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold ${employee.user.isActive
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {employee.user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    {employee.user.isActive ? 'Khóa' : 'Mở Khóa'}
                                </button>
                                <button
                                    onClick={handleEditAccount}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-xs font-bold"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Sửa Thông Tin
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-[11px] text-slate-600 mb-3">Nhân viên này chưa có tài khoản đăng nhập</p>
                            <button
                                onClick={() => setShowCreateAccount(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-lg hover:shadow-lg text-xs"
                            >
                                <UserPlus className="w-4 h-4" />
                                Tạo Tài Khoản
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Account Modal */}
            {showCreateAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Tạo Tài Khoản</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                                    placeholder="Tên đăng nhập"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                                    placeholder="Ít nhất 6 ký tự"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Vai trò</label>
                                <select
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="">Chọn vai trò</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateAccount}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                            >
                                {saving ? 'Đang tạo...' : 'Tạo'}
                            </button>
                            <button
                                onClick={() => setShowCreateAccount(false)}
                                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Reset Mật Khẩu</h3>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                                placeholder="Ít nhất 6 ký tự"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleResetPassword}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Đang reset...' : 'Reset'}
                            </button>
                            <button
                                onClick={() => setShowResetPassword(false)}
                                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Account Modal */}
            {showEditAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-inter">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                                <Save size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Sửa Thông Tin</h3>
                                <p className="text-slate-500 text-sm">Cập nhật tài khoản hệ thống</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-medium"
                                    placeholder="Tên đăng nhập"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Vai trò</label>
                                <select
                                    value={editRoleId}
                                    onChange={(e) => setEditRoleId(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-medium appearance-none bg-no-repeat bg-[right_1rem_center]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='SelectionM19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1.5em' }}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handleUpdateAccount}
                                disabled={saving}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/20 disabled:opacity-50 transition-all active:scale-95"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                            <button
                                onClick={() => setShowEditAccount(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

function InfoField({
    label,
    field,
    value,
    isEditing,
    type = 'text',
    editValue,
    options = [],
    onChange
}: {
    label: string,
    field?: string,
    value: string | null | undefined,
    isEditing?: boolean,
    type?: 'text' | 'select' | 'date',
    editValue?: string | null,
    options?: { label: string, value: string }[],
    onChange?: (val: string) => void
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            {!isEditing ? (
                <p className="text-slate-900 font-bold text-[13px]">{value || '-'}</p>
            ) : (
                <div className="relative group">
                    {type === 'text' && (
                        <input
                            type="text"
                            value={editValue || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-bold text-slate-900 text-[11px]"
                        />
                    )}
                    {type === 'select' && (
                        <div className="relative">
                            <select
                                value={editValue || ''}
                                onChange={(e) => onChange?.(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-bold text-slate-900 text-[11px] appearance-none bg-no-repeat bg-[right_1rem_center]"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1.2em' }}
                            >
                                <option value="">- Chọn -</option>
                                {options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {type === 'date' && (
                        <div className="relative">
                            <input
                                type="date"
                                value={editValue || ''}
                                onChange={(e) => onChange?.(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-bold text-slate-900 text-[11px]"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
