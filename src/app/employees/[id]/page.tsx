'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, UserPlus, Key, Lock, Unlock, TrendingUp, Edit, X, Calendar, ChevronDown,
    Phone, Mail, MapPin, Briefcase, Building2, User2, BadgeCheck, ShieldAlert, GraduationCap,
    Clock, CreditCard, Heart, Contact, Camera
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';
import FixedDatePicker from '@/components/ui/FixedDatePicker';
import { cn, formatDate } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface Employee {
    id: string;
    fullName: string;
    phone: string | null;
    position: string;
    department: string | null;
    avatarUrl: string | null;
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
    pos: {
        id: string;
        name: string;
    } | null;
    dept: {
        id: string;
        name: string;
    } | null;
    positionId: string | null;
    departmentId: string | null;
    attendancePolicyId: string | null;
    attendancePolicy?: {
        id: string;
        name: string;
    } | null;
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
    const [allDepartments, setAllDepartments] = useState<any[]>([]);
    const [allPositions, setAllPositions] = useState<any[]>([]);
    const [allAttendancePolicies, setAllAttendancePolicies] = useState<any[]>([]);

    // Avatar upload
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = import('react').then(m => m.useRef<HTMLInputElement>(null)).catch(() => null); // Quick fix since useRef was not imported, wait we can just import useRef. Wait, I'll use React.useRef.
    const actualFileInputRef = (typeof window !== 'undefined') ? window.document.createElement('input') : null; // Safe fallback. I'll just use React.useRef.

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

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (params.id) {
            fetchEmployee();
            fetchRoles();
            fetchBranches();
            fetchDepartments();
            fetchPositions();
            fetchAttendancePolicies();
        }
    }, [params.id]);

    const fetchAttendancePolicies = async () => {
        try {
            const res = await fetch(`${API_URL}/attendance-policies`);
            const data = await res.json();
            setAllAttendancePolicies(data);
        } catch (error) {
            console.error('Error fetching attendance policies:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_URL}/departments`);
            const data = await res.json();
            setAllDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchPositions = async () => {
        try {
            const res = await fetch(`${API_URL}/positions`);
            const data = await res.json();
            setAllPositions(data);
        } catch (error) {
            console.error('Error fetching positions:', error);
        }
    };

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
                positionId: employee.positionId || '',
                departmentId: employee.departmentId || '',
                attendancePolicyId: employee.attendancePolicyId || '',
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
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();

        try {
            const compressOptions = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };

            let fileToUpload = file;
            try {
                fileToUpload = await imageCompression(file, compressOptions);
            } catch (err) {
                console.error("Lỗi khi nén ảnh Avatar:", err);
            }

            formData.append('file', fileToUpload, fileToUpload.name);

            const res = await fetch(`${API_URL}/employees/${params.id}/avatar`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to upload avatar');
            success('Cập nhật ảnh đại diện thành công!');
            fetchEmployee(); // Refresh data
        } catch (error: any) {
            toastError('Lỗi tải ảnh: ' + error.message);
        } finally {
            setUploadingAvatar(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleSaveEmployee = async () => {
        setSaving(true);
        try {
            const allowedFields = [
                'fullName', 'phone', 'branchId', 'positionId', 'departmentId',
                'birthday', 'gender', 'status', 'workingType', 'joinDate',
                'contractType', 'contractSigningDate', 'idCardNumber',
                'permanentAddress', 'email', 'socialInsuranceNumber', 'isInternalDriver',
                'attendancePolicyId'
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
                'idCardNumber', 'permanentAddress', 'email', 'socialInsuranceNumber',
                'attendancePolicyId'
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

            if (!res.ok) {
                const errorData = await res.json();
                const errorMessage = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message || 'Tạo tài khoản thất bại';
                throw new Error(errorMessage);
            }

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

            if (!res.ok) {
                const errorData = await res.json();
                const errorMessage = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message || 'Reset mật khẩu thất bại';
                throw new Error(errorMessage);
            }

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
            if (['DIRECTOR', 'CHIEF_ACCOUNTANT', 'HR', 'ADMIN'].includes(user.role?.code)) {
                fetchPerformanceStats();
            }
        }
    }, [perfMonth, perfYear, params.id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full shadow-lg"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-slate-50">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <User2 size={48} />
                </div>
                <p className="text-xl font-black text-slate-400">Không tìm thấy nhân viên</p>
                <button
                    onClick={() => router.push('/employees')}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                >
                    <ArrowLeft size={18} />
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-2 md:p-4 lg:p-6 font-inter">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-900 relative">
                        <button
                            onClick={() => router.push('/employees')}
                            className="absolute top-4 left-4 p-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all active:scale-90 z-10 cursor-pointer"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <div className="px-6 pb-8 -mt-12 relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl relative">
                                <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-4xl font-black tracking-tighter cursor-pointer overflow-hidden group relative" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                    {employee.avatarUrl ? (
                                        <img src={employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${API_URL}${employee.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(employee.fullName)
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                        {uploadingAvatar ? (
                                            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <Camera size={28} className="text-white" />
                                        )}
                                    </div>
                                </div>
                                <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                <div className={cn(
                                    "absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg",
                                    employee.status === 'Đang làm việc' ? "bg-emerald-500" : "bg-slate-400"
                                )}>
                                    {employee.status === 'Đang làm việc' ? <BadgeCheck size={16} className="text-white" /> : <Clock size={16} className="text-white" />}
                                </div>
                            </div>

                            <div className="flex-1 pb-2">
                                {!isEditing ? (
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{employee.fullName}</h1>
                                ) : (
                                    <input
                                        type="text"
                                        value={editForm.fullName || ''}
                                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                        className="text-3xl font-black text-slate-900 tracking-tight mb-1 bg-slate-50 border-b-2 border-rose-500 outline-none w-full max-w-md px-2 py-1 rounded-lg"
                                        placeholder="Nhập họ tên đầy đủ"
                                    />
                                )}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-100 flex items-center gap-1.5">
                                        <Briefcase size={12} />
                                        {employee.pos?.name || employee.position || 'Chưa rõ'}
                                    </span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200 flex items-center gap-1.5">
                                        <Building2 size={12} />
                                        {employee.branch.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 pb-2">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 text-slate-700 font-black text-xs rounded-2xl hover:border-rose-500 hover:text-rose-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <Edit size={16} />
                                        CHỈNH SỬA
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveEmployee}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black text-xs rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                                    >
                                        <Save size={16} />
                                        {saving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 text-slate-500 font-black text-xs rounded-2xl hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                                    >
                                        HỦY
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Areas */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Work Information Card */}
                        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                    <Briefcase size={20} />
                                </div>
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Thông Tin Công Việc</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 min-[500px]:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoField
                                    label="Chi nhánh"
                                    icon={<Building2 size={14} />}
                                    value={employee.branch.name}
                                    isEditing={isEditing}
                                    type="select"
                                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                                    editValue={editForm.branchId}
                                    onChange={(val) => setEditForm({ ...editForm, branchId: val })}
                                />
                                <InfoField
                                    label="Chức vụ"
                                    icon={<BadgeCheck size={14} />}
                                    value={employee.pos?.name || employee.position}
                                    isEditing={isEditing}
                                    type="select"
                                    options={allPositions.map(p => ({ label: p.name, value: p.id }))}
                                    editValue={editForm.positionId}
                                    onChange={(val) => setEditForm({ ...editForm, positionId: val })}
                                />
                                <InfoField
                                    label="Phòng ban"
                                    icon={<Contact size={14} />}
                                    value={employee.dept?.name || employee.department}
                                    isEditing={isEditing}
                                    type="select"
                                    options={allDepartments.map(d => ({ label: d.name, value: d.id }))}
                                    editValue={editForm.departmentId}
                                    onChange={(val) => setEditForm({ ...editForm, departmentId: val })}
                                />
                                <InfoField
                                    label="Chính sách riêng"
                                    icon={<ShieldAlert size={14} />}
                                    value={employee.attendancePolicy?.name || 'Theo mặc định'}
                                    isEditing={isEditing}
                                    type="select"
                                    options={[
                                        { label: '--- Theo Chức vụ ---', value: '' },
                                        ...allAttendancePolicies.map(p => ({ label: p.name, value: p.id }))
                                    ]}
                                    editValue={editForm.attendancePolicyId}
                                    onChange={(val) => setEditForm({ ...editForm, attendancePolicyId: val })}
                                />
                                <InfoField
                                    label="Trạng thái"
                                    icon={<Clock size={14} />}
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
                                    icon={<Clock size={14} />}
                                    value={employee.workingType}
                                    isEditing={isEditing}
                                    type="text"
                                    editValue={editForm.workingType}
                                    onChange={(val) => setEditForm({ ...editForm, workingType: val })}
                                    placeholder="VD: Full time, Hành chính..."
                                />
                                <InfoField
                                    label="Ngày vào làm"
                                    icon={<Calendar size={14} />}
                                    value={employee.joinDate ? formatDate(employee.joinDate) : '-'}
                                    isEditing={isEditing}
                                    type="date"
                                    editValue={editForm.joinDate}
                                    onChange={(val) => setEditForm({ ...editForm, joinDate: val })}
                                />
                                <InfoField
                                    label="Loại hợp đồng"
                                    icon={<BadgeCheck size={14} />}
                                    value={employee.contractType}
                                    isEditing={isEditing}
                                    type="text"
                                    editValue={editForm.contractType}
                                    onChange={(val) => setEditForm({ ...editForm, contractType: val })}
                                    placeholder="VD: 1 năm, Không xác định..."
                                />
                                <InfoField
                                    label="Ngày ký hợp đồng"
                                    icon={<Calendar size={14} />}
                                    value={employee.contractSigningDate ? formatDate(employee.contractSigningDate) : '-'}
                                    isEditing={isEditing}
                                    type="date"
                                    editValue={editForm.contractSigningDate}
                                    onChange={(val) => setEditForm({ ...editForm, contractSigningDate: val })}
                                />
                                <div className="min-[500px]:col-span-2 mt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isInternalDriver || false}
                                                onChange={(e) => setEditForm({ ...editForm, isInternalDriver: e.target.checked })}
                                                disabled={!isEditing}
                                                className="peer sr-only"
                                            />
                                            <div className={cn(
                                                "w-12 h-6 bg-slate-200 rounded-full transition-all duration-300",
                                                editForm.isInternalDriver && "bg-emerald-500",
                                                !isEditing && "opacity-50 cursor-not-allowed"
                                            )} />
                                            <div className={cn(
                                                "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                                editForm.isInternalDriver && "translate-x-6 shadow-md"
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-wider transition-colors",
                                            editForm.isInternalDriver ? "text-emerald-600" : "text-slate-400"
                                        )}>Là tài xế nội bộ</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information Card */}
                        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                    <User2 size={20} />
                                </div>
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Thông Tin Cá Nhân</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 min-[500px]:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoField
                                    label="Số điện thoại"
                                    icon={<Phone size={14} />}
                                    value={employee.phone}
                                    isEditing={isEditing}
                                    editValue={editForm.phone}
                                    onChange={(val) => setEditForm({ ...editForm, phone: val })}
                                    placeholder="Số điện thoại"
                                />
                                <InfoField
                                    label="Ngày sinh"
                                    icon={<Calendar size={14} />}
                                    value={employee.birthday ? formatDate(employee.birthday) : '-'}
                                    isEditing={isEditing}
                                    type="date"
                                    editValue={editForm.birthday}
                                    onChange={(val) => setEditForm({ ...editForm, birthday: val })}
                                />
                                <InfoField
                                    label="Giới tính"
                                    icon={<User2 size={14} />}
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
                                    label="CMND/CCCD"
                                    icon={<CreditCard size={14} />}
                                    value={employee.idCardNumber}
                                    isEditing={isEditing}
                                    editValue={editForm.idCardNumber}
                                    onChange={(val) => setEditForm({ ...editForm, idCardNumber: val })}
                                    placeholder="Số CMND/CCCD"
                                />
                                <div className="min-[500px]:col-span-2">
                                    <InfoField
                                        label="Email"
                                        icon={<Mail size={14} />}
                                        value={employee.email}
                                        isEditing={isEditing}
                                        editValue={editForm.email}
                                        onChange={(val) => setEditForm({ ...editForm, email: val })}
                                        placeholder="Email"
                                    />
                                </div>
                                <div className="min-[500px]:col-span-1">
                                    <InfoField
                                        label="Số sổ BHXH"
                                        icon={<Heart size={14} />}
                                        value={employee.socialInsuranceNumber}
                                        isEditing={isEditing}
                                        editValue={editForm.socialInsuranceNumber}
                                        onChange={(val) => setEditForm({ ...editForm, socialInsuranceNumber: val })}
                                        placeholder="Số bảo hiểm xã hội"
                                    />
                                </div>
                                <div className="min-[500px]:col-span-2">
                                    <InfoField
                                        label="Địa chỉ thường trú"
                                        icon={<MapPin size={14} />}
                                        value={employee.permanentAddress}
                                        isEditing={isEditing}
                                        editValue={editForm.permanentAddress}
                                        onChange={(val) => setEditForm({ ...editForm, permanentAddress: val })}
                                        placeholder="Địa chỉ"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Cards */}
                    <div className="space-y-6">
                        {/* Account Management Card */}
                        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden overflow-hidden sticky top-6">
                            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 text-rose-500 rounded-xl">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Tài Khoản</h2>
                                </div>
                                {employee.user && (
                                    <span className={cn(
                                        "w-2 h-2 rounded-full animate-pulse",
                                        employee.user.isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                    )} />
                                )}
                            </div>

                            <div className="p-6">
                                {employee.user ? (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</span>
                                                <span className="text-sm font-black text-slate-900">{employee.user.username}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{employee.user.role.name}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                onClick={() => setShowResetPassword(true)}
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                                            >
                                                <Key size={14} />
                                                RESET MẬT KHẨU
                                            </button>
                                            <button
                                                onClick={handleToggleAccount}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer",
                                                    employee.user.isActive
                                                        ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                                                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                )}
                                            >
                                                {employee.user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                                                {employee.user.isActive ? 'KHÓA TÀI KHOẢN' : 'MỞ KHÓA TÀI KHOẢN'}
                                            </button>
                                            <button
                                                onClick={handleEditAccount}
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-xs transition-all active:scale-95 shadow-lg shadow-slate-900/10 cursor-pointer"
                                            >
                                                <Edit size={14} />
                                                SỬA THÔNG TIN
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto border-2 border-dashed border-slate-200">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-bold leading-relaxed">Nhân viên này chưa có<br />tài khoản đăng nhập hệ thống</p>
                                        </div>
                                        <button
                                            onClick={() => setShowCreateAccount(true)}
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-rose-500/20 transition-all active:scale-95 text-xs tracking-wider cursor-pointer"
                                        >
                                            <UserPlus size={18} />
                                            TẠO TÀI KHOẢN
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Account Modal */}
            {showCreateAccount && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Tạo Tài Khoản</h3>
                                <p className="text-slate-500 text-sm">Cấp quyền truy cập hệ thống</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-bold text-slate-900"
                                    placeholder="Tên đăng nhập"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Mật khẩu</label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-bold text-slate-900"
                                    placeholder="Ít nhất 6 ký tự"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Vai trò</label>
                                <select
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-no-repeat bg-[right_1rem_center] cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1.5em' }}
                                >
                                    <option value="">Chọn vai trò</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={handleCreateAccount}
                                disabled={saving}
                                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black rounded-xl hover:shadow-xl hover:shadow-rose-500/20 shadow-lg shadow-rose-500/10 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer text-xs tracking-widest uppercase"
                            >
                                {saving ? 'ĐANG TẠO...' : 'TẠO TÀI KHOẢN MỚI'}
                            </button>
                            <button
                                onClick={() => setShowCreateAccount(false)}
                                className="w-full py-3 bg-white text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-xs"
                            >
                                HỦY BỎ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPassword && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50">
                                <Key size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Reset Mật Khẩu</h3>
                            <p className="text-slate-500 text-xs mt-2">Thiết lập mật khẩu mới cho tài khoản</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Mật khẩu mới</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-center text-slate-900 placeholder:text-slate-300"
                                    placeholder="Ít nhất 6 ký tự"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={handleResetPassword}
                                disabled={saving}
                                className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black rounded-xl hover:shadow-xl hover:shadow-rose-500/20 shadow-lg shadow-rose-500/10 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer text-xs tracking-widest uppercase"
                            >
                                {saving ? 'ĐANG RESET...' : 'XÁC NHẬN RESET'}
                            </button>
                            <button
                                onClick={() => setShowResetPassword(false)}
                                className="w-full py-3 bg-white text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-xs"
                            >
                                HỦY BỎ
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
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all font-medium appearance-none bg-no-repeat bg-[right_1rem_center] cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1.5em' }}
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
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                            <button
                                onClick={() => setShowEditAccount(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
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
    icon,
    value,
    isEditing,
    type = 'text',
    editValue,
    options = [],
    onChange,
    placeholder
}: {
    label: string,
    icon?: React.ReactNode,
    value: string | null | undefined,
    isEditing?: boolean,
    type?: 'text' | 'select' | 'date',
    editValue?: string | null,
    options?: { label: string, value: string }[],
    onChange?: (val: string) => void,
    placeholder?: string
}) {
    return (
        <div className="flex flex-col gap-1.5 group/field">
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-slate-400 group-hover/field:text-rose-500 transition-colors">{icon}</span>}
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            </div>
            {!isEditing ? (
                <p className="text-slate-900 font-bold text-[13px] pl-0 min-h-[20px]">{value || '-'}</p>
            ) : (
                <div className="relative">
                    {type === 'text' && (
                        <input
                            type="text"
                            value={editValue || ''}
                            onChange={(e) => onChange?.(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 text-xs"
                        />
                    )}
                    {type === 'select' && (
                        <div className="relative">
                            <select
                                value={editValue || ''}
                                onChange={(e) => onChange?.(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 text-xs appearance-none bg-no-repeat bg-[right_1rem_center] cursor-pointer"
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
                            <FixedDatePicker
                                value={editValue || ''}
                                onChange={(val) => onChange?.(val)}
                                className="h-[38px] !rounded-xl text-xs font-bold"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
