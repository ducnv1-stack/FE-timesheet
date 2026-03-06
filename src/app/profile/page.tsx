"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Building2, Briefcase, Phone, Mail, Calendar, MapPin, CreditCard,
    BadgeCheck, Clock, Contact, Heart, Shield, Key, Eye, EyeOff, Save, ArrowLeft,
    Pencil, ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

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
        dateOfBirth: string | null;
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
                    <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(225,29,72,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%)] bg-[length:40px_40px]" />

                <div className="relative px-8 py-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-28 h-28 rounded-[2rem] bg-white p-1.5 shadow-2xl shrink-0">
                        <div className="w-full h-full rounded-[1.7rem] bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-3xl font-black tracking-tighter">
                            {emp ? getInitials(emp.fullName) : profile.username.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                            {emp?.fullName || profile.username}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            {emp && (
                                <>
                                    <span className="px-3 py-1 bg-white/10 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
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
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                                <Key size={14} className="text-rose-600" />
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
                                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 text-xs"
                                            placeholder="Nhập tên đăng nhập mới"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveUsername}
                                                disabled={savingUsername}
                                                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
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
                                <p className="text-sm font-bold text-rose-600">{profile.role.name}</p>
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
                                        <ChevronRight size={14} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Đổi mật khẩu</h4>

                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-slate-900 text-xs"
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
                                                className="w-full px-3 py-2 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-slate-900 text-xs"
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
                                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-slate-900 text-xs"
                                            placeholder="Xác nhận mật khẩu mới"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={savingPassword}
                                                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
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
                                    <InfoItem label="Ngày vào làm" value={emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('vi-VN') : null} icon={<Calendar size={13} />} />
                                    <InfoItem label="Loại hợp đồng" value={emp.contractType} icon={<BadgeCheck size={13} />} />
                                    <InfoItem label="Ngày ký hợp đồng" value={emp.contractSigningDate ? new Date(emp.contractSigningDate).toLocaleDateString('vi-VN') : null} icon={<Calendar size={13} />} />
                                    {emp.isInternalDriver && (
                                        <div className="sm:col-span-2">
                                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 inline-flex items-center gap-1.5">
                                                ✓ Là tài xế nội bộ
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                                        <User size={14} className="text-teal-600" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin cá nhân</h3>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                    <InfoItem label="Số điện thoại" value={emp.phone} icon={<Phone size={13} />} />
                                    <InfoItem label="Ngày sinh" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString('vi-VN') : null} icon={<Calendar size={13} />} />
                                    <InfoItem label="Giới tính" value={emp.gender} icon={<User size={13} />} />
                                    <InfoItem label="CMND/CCCD" value={emp.idCardNumber} icon={<CreditCard size={13} />} />
                                    <InfoItem label="Email" value={emp.email} icon={<Mail size={13} />} />
                                    <InfoItem label="Số sổ BHXH" value={emp.socialInsuranceNumber} icon={<Heart size={13} />} />
                                    <div className="sm:col-span-2">
                                        <InfoItem label="Địa chỉ thường trú" value={emp.permanentAddress} icon={<MapPin size={13} />} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
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
                highlight === 'green' && "text-emerald-600",
                highlight === 'red' && "text-red-500",
                !highlight && "text-slate-900"
            )}>
                {value || '-'}
            </p>
        </div>
    );
}
