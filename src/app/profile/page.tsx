"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Building2, Briefcase, Phone, Mail, Calendar, MapPin, CreditCard,
    BadgeCheck, Clock, Contact, Heart, Shield, Key, Eye, EyeOff, Save, ArrowLeft,
    Pencil, ChevronRight, Trash2, Camera
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import ConfirmModal from '@/components/ui/confirm-modal';
import FixedDatePicker from '@/components/ui/FixedDatePicker';

interface UserProfile {
    id: string;
    username: string;
    isActive: boolean;
    role: { id: string; name: string; code: string };
    employee: {
        id: string;
        fullName: string;
        phone: string | null;
        email: string | null;
        avatarUrl: string | null;
        birthday: string | null;
        gender: string | null;
        idCardNumber: string | null;
        permanentAddress: string | null;
        position: string;
        department: string | null;
        workingType: string | null;
        status: string;
        joinDate: string | null;
        contractType: string | null;
        contractSigningDate: string | null;
        socialInsuranceNumber: string | null;
        isInternalDriver: boolean;
        branch: { id: string; name: string };
    } | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Edit states
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileEditForm, setProfileEditForm] = useState<any>({});
    const [savingProfile, setSavingProfile] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                router.push('/login');
                return;
            }
            const user = JSON.parse(storedUser);
            const res = await fetch(`${apiUrl}/auth/profile/${user.id}`);
            if (!res.ok) throw new Error('Không thể tải thông tin');
            const data = await res.json();
            setProfile(data);
            setNewUsername(data.username);
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUsername = async () => {
        if (!newUsername.trim()) {
            toastError('Tên đăng nhập không được để trống');
            return;
        }
        setSavingUsername(true);
        try {
            const res = await fetch(`${apiUrl}/auth/profile/${profile!.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật');
            success('Đổi tên đăng nhập thành công!');
            setIsEditingUsername(false);

            // Update localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                user.username = newUsername.trim();
                localStorage.setItem('user', JSON.stringify(user));
            }
            fetchProfile();
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setSavingUsername(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.employee) return;

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

            const res = await fetch(`${apiUrl}/employees/${profile.employee.id}/avatar`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to upload avatar');
            success('Cập nhật ảnh đại diện thành công!');

            // Refresh data
            await fetchProfile();

            // Sync to local storage for Navbar to update
            const resMe = await fetch(`${apiUrl}/employees/${profile.employee.id}`);
            if (resMe.ok) {
                const updatedEmp = await resMe.json();
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    user.employee = updatedEmp;
                    localStorage.setItem('user', JSON.stringify(user));
                    window.dispatchEvent(new Event('user-avatar-updated'));
                }
            }
        } catch (error: any) {
            toastError('Lỗi tải ảnh: ' + error.message);
        } finally {
            setUploadingAvatar(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDeleteAvatar = async () => {
        if (!profile?.employee) return;
        try {
            const res = await fetch(`${apiUrl}/employees/${profile.employee.id}/avatar`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete avatar');
            success('Đã gỡ ảnh đại diện.');

            // Refresh local state and global Navbar
            await fetchProfile();
            const resMe = await fetch(`${apiUrl}/employees/${profile.employee.id}`);
            if (resMe.ok) {
                const updatedEmp = await resMe.json();
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    user.employee = updatedEmp;
                    localStorage.setItem('user', JSON.stringify(user));
                    window.dispatchEvent(new Event('user-avatar-updated'));
                }
            }
        } catch (error: any) {
            toastError('Lỗi xóa ảnh: ' + error.message);
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword) {
            toastError('Vui lòng nhập mật khẩu hiện tại');
            return;
        }
        if (!newPassword || newPassword.length < 4) {
            toastError('Mật khẩu mới phải có ít nhất 4 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            toastError('Xác nhận mật khẩu không khớp');
            return;
        }
        setSavingPassword(true);
        try {
            const res = await fetch(`${apiUrl}/auth/profile/${profile!.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật');
            success('Đổi mật khẩu thành công!');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleStartEditProfile = () => {
        if (!emp) return;
        setProfileEditForm({
            phone: emp.phone || '',
            email: emp.email || '',
            birthday: emp.birthday ? new Date(emp.birthday).toISOString().split('T')[0] : '',
            gender: emp.gender || '',
            permanentAddress: emp.permanentAddress || '',
            idCardNumber: emp.idCardNumber || '',
        });
        setIsEditingProfile(true);
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch(`${apiUrl}/auth/profile/${profile!.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileEditForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật');
            success('Cập nhật thông tin cá nhân thành công!');
            setIsEditingProfile(false);
            fetchProfile();
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-subtle border-t-primary rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium text-sm">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-red-500 font-bold">Không thể tải thông tin hồ sơ</p>
            </div>
        );
    }

    const emp = profile.employee;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(225,29,72,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%)] bg-[length:40px_40px]" />

                <div className="relative px-8 py-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-28 h-28 rounded-[2rem] bg-white p-1.5 shadow-2xl shrink-0 relative">
                        <div
                            className="w-full h-full rounded-[1.7rem] bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-3xl font-black tracking-tighter cursor-pointer overflow-hidden group relative"
                            onClick={() => emp && document.getElementById('profile-avatar-upload')?.click()}
                        >
                            {emp?.avatarUrl ? (
                                <img src={emp.avatarUrl.startsWith('http') ? emp.avatarUrl : `${apiUrl}${emp.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                emp ? getInitials(emp.fullName) : profile.username.substring(0, 2).toUpperCase()
                            )}
                            {emp && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                    {uploadingAvatar ? (
                                        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                                    )}
                                </div>
                            )}
                        </div>
                        {emp && emp.avatarUrl && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(true);
                                }}
                                className="absolute -top-2 -right-2 p-2 bg-primary-subtle text-primary hover:bg-primary hover:text-white rounded-full transition-all shadow-md z-10 cursor-pointer"
                                title="Xóa ảnh đại diện"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        {emp && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById('profile-avatar-upload')?.click();
                                }}
                                className="absolute -bottom-2 -right-2 p-2 bg-white text-slate-700 hover:text-primary rounded-full transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] z-10 cursor-pointer border border-slate-100"
                                title="Đổi ảnh đại diện"
                            >
                                <Camera size={16} />
                            </button>
                        )}
                        {emp && (
                            <input id="profile-avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        )}
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                            {emp?.fullName || profile.username}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            {emp && (
                                <>
                                    <span className="px-3 py-1 bg-white/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                        <Briefcase size={11} />
                                        {emp.position}
                                    </span>
                                    <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                        <Building2 size={11} />
                                        {emp.branch.name}
                                    </span>
                                </>
                            )}
                            <span className="px-3 py-1 bg-white/10 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                <Shield size={11} />
                                {profile.role.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Account Settings */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Username Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary-subtle flex items-center justify-center">
                                <Key size={14} className="text-primary" />
                            </div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tài khoản</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                    Tên đăng nhập
                                </label>
                                {!isEditingUsername ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-slate-900">{profile.username}</p>
                                        <button
                                            onClick={() => {
                                                setNewUsername(profile.username);
                                                setIsEditingUsername(true);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-bold text-slate-900 text-xs"
                                            placeholder="Nhập tên đăng nhập mới"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveUsername}
                                                disabled={savingUsername}
                                                className="flex-1 px-3 py-2 bg-primary hover:bg-primary-light text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                            >
                                                {savingUsername ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingUsername(false)}
                                                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                    Vai trò
                                </label>
                                <p className="text-sm font-bold text-primary">{profile.role.name}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                {!isChangingPassword ? (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group cursor-pointer"
                                    >
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <Key size={14} className="text-slate-400" />
                                            Đổi mật khẩu
                                        </span>
                                        <ChevronRight size={14} className="text-slate-400 group-hover:text-primary-light transition-colors" />
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Đổi mật khẩu</h4>

                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-medium text-slate-900 text-xs"
                                                placeholder="Mật khẩu hiện tại"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-medium text-slate-900 text-xs"
                                                placeholder="Mật khẩu mới (tối thiểu 4 ký tự)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>

                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-medium text-slate-900 text-xs"
                                            placeholder="Xác nhận mật khẩu mới"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={savingPassword}
                                                className="flex-1 px-3 py-2 bg-primary hover:bg-primary-light text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                            >
                                                {savingPassword ? 'Đang lưu...' : 'Xác nhận'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmPassword('');
                                                }}
                                                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Employee Info (read-only) */}
                <div className="lg:col-span-2 space-y-6">
                    {emp && (
                        <>
                            {/* Work Info */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <Briefcase size={14} className="text-indigo-600" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin công việc</h3>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                    <InfoItem label="Chi nhánh" value={emp.branch.name} icon={<Building2 size={13} />} />
                                    <InfoItem label="Chức vụ" value={emp.position} icon={<BadgeCheck size={13} />} />
                                    <InfoItem label="Phòng ban" value={emp.department} icon={<Contact size={13} />} />
                                    <InfoItem label="Trạng thái" value={emp.status} icon={<Clock size={13} />} highlight={emp.status === 'Đang làm việc' ? 'green' : 'red'} />
                                    <InfoItem label="Loại công việc" value={emp.workingType} icon={<Clock size={13} />} />
                                    <InfoItem label="Ngày vào làm" value={emp.joinDate ? formatDate(emp.joinDate) : null} icon={<Calendar size={13} />} />
                                    <InfoItem label="Loại hợp đồng" value={emp.contractType} icon={<BadgeCheck size={13} />} />
                                    <InfoItem label="Ngày ký hợp đồng" value={emp.contractSigningDate ? formatDate(emp.contractSigningDate) : null} icon={<Calendar size={13} />} />
                                    {emp.isInternalDriver && (
                                        <div className="sm:col-span-2">
                                            <span className="px-3 py-1.5 bg-emerald-50 text-accent rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 inline-flex items-center gap-1.5">
                                                ✓ Là tài xế nội bộ
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                                            <User size={14} className="text-teal-600" />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin cá nhân</h3>
                                    </div>
                                    {!isEditingProfile ? (
                                        <button
                                            onClick={handleStartEditProfile}
                                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Pencil size={12} />
                                            Chỉnh sửa
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={savingProfile}
                                                className="px-3 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <Save size={12} />
                                                {savingProfile ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingProfile(false)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                    {isEditingProfile ? (
                                        <>
                                            <EditField label="Số điện thoại" value={profileEditForm.phone} onChange={(val) => setProfileEditForm({ ...profileEditForm, phone: val })} icon={<Phone size={13} />} />
                                            <EditField label="Ngày sinh" type="date" value={profileEditForm.birthday} onChange={(val) => setProfileEditForm({ ...profileEditForm, birthday: val })} icon={<Calendar size={13} />} />
                                            <EditField label="Giới tính" type="select" options={[{ label: 'Nam', value: 'Nam' }, { label: 'Nữ', value: 'Nữ' }]} value={profileEditForm.gender} onChange={(val) => setProfileEditForm({ ...profileEditForm, gender: val })} icon={<User size={13} />} />
                                            <EditField label="CMND/CCCD" value={profileEditForm.idCardNumber} onChange={(val) => setProfileEditForm({ ...profileEditForm, idCardNumber: val })} icon={<CreditCard size={13} />} />
                                            <EditField label="Email" value={profileEditForm.email} onChange={(val) => setProfileEditForm({ ...profileEditForm, email: val })} icon={<Mail size={13} />} />
                                            <div className="sm:col-span-2">
                                                <EditField label="Địa chỉ thường trú" value={profileEditForm.permanentAddress} onChange={(val) => setProfileEditForm({ ...profileEditForm, permanentAddress: val })} icon={<MapPin size={13} />} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <InfoItem label="Số điện thoại" value={emp.phone} icon={<Phone size={13} />} />
                                            <InfoItem label="Ngày sinh" value={emp.birthday ? formatDate(emp.birthday) : null} icon={<Calendar size={13} />} />
                                            <InfoItem label="Giới tính" value={emp.gender} icon={<User size={13} />} />
                                            <InfoItem label="CMND/CCCD" value={emp.idCardNumber} icon={<CreditCard size={13} />} />
                                            <InfoItem label="Email" value={emp.email} icon={<Mail size={13} />} />
                                            <InfoItem label="Số sổ BHXH" value={emp.socialInsuranceNumber} icon={<Heart size={13} />} />
                                            <div className="sm:col-span-2">
                                                <InfoItem label="Địa chỉ thường trú" value={emp.permanentAddress} icon={<MapPin size={13} />} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAvatar}
                title="Xóa ảnh đại diện?"
                message="Bạn có chắc chắn muốn gỡ ảnh đại diện của mình không? Hành động này không thể hoàn tác."
                confirmLabel="Xóa Ảnh"
                cancelLabel="Hủy"
                isDanger={true}
            />
        </div>
    );
}

function EditField({ label, value, icon, onChange, type = 'text', options = [] }: {
    label: string,
    value: string,
    icon?: React.ReactNode,
    onChange: (val: string) => void,
    type?: 'text' | 'date' | 'select',
    options?: { label: string, value: string }[]
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-slate-400">{icon}</span>}
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            </div>
            {type === 'text' && (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-bold text-slate-900 text-xs"
                />
            )}
            {type === 'date' && (
                <FixedDatePicker
                    value={value}
                    onChange={onChange}
                    className="h-[38px] !rounded-xl text-xs font-bold"
                />
            )}
            {type === 'select' && (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-bold text-slate-900 text-xs appearance-none bg-no-repeat bg-[right_1rem_center]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundSize: '1.2em' }}
                >
                    <option value="">- Chọn -</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )}
        </div>
    );
}

function InfoItem({ label, value, icon, highlight }: {
    label: string;
    value: string | null | undefined;
    icon?: React.ReactNode;
    highlight?: 'green' | 'red';
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-slate-400">{icon}</span>}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className={cn(
                "text-[13px] font-bold pl-0 min-h-[20px]",
                highlight === 'green' && "text-accent",
                highlight === 'red' && "text-red-500",
                !highlight && "text-slate-900"
            )}>
                {value || '-'}
            </p>
        </div>
    );
}
