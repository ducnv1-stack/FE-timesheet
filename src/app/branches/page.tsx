"use client";

import { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    Navigation,
    Save,
    Search,
    Loader2,
    LocateFixed,
    Target,
    Plus,
    Trash2,
    Key,
    Warehouse,
    LayoutGrid,
    AlertCircle,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import PasswordModal from '@/components/ui/password-modal';

export default function BranchesPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const { success, error: toastError } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [userBranchId, setUserBranchId] = useState<string>('');
    const [userBranchName, setUserBranchName] = useState<string>('');
    const [userId, setUserId] = useState<string>('');

    // Auth Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<any>(null);
    const [justFetchedId, setJustFetchedId] = useState<string | null>(null);
    const [fetchingGpsId, setFetchingGpsId] = useState<string | null>(null);

    // New Branch State
    const [isAdding, setIsAdding] = useState(false);
    const [newBranch, setNewBranch] = useState({
        name: '',
        code: '',
        branchType: 'CHI_NHANH',
        latitude: null,
        longitude: null,
        checkinRadius: 50
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setUserRole(user.role?.code || '');

                const bId = user.employee?.branchId || user.branchId || '';
                setUserBranchId(bId);
                setUserBranchName(user.employee?.branch?.name || 'Chi nhánh của tôi');
                setUserId(user.id || '');

                if (user.role?.code === 'MANAGER' && bId) {
                    setSelectedBranch(bId);
                }
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
            }
        }
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches`);
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            toastError('Không thể tải danh sách chi nhánh');
        } finally {
            setLoading(false);
        }
    };

    const triggerActionWithPassword = (action: any) => {
        setPendingAction(() => action);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password: string) => {
        if (pendingAction) {
            await pendingAction(password);
            setIsPasswordModalOpen(false);
            setPendingAction(null);
        }
    };

    const executeCreate = async (password: string) => {
        setSaving('NEW');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newBranch, password, userId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Thêm chi nhánh thất bại');
            }

            success('Đã thêm chi nhánh mới');
            setIsAdding(false);
            setNewBranch({ name: '', code: '', branchType: 'CHI_NHANH', latitude: null, longitude: null, checkinRadius: 50 });
            fetchBranches();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(null);
        }
    };

    const executeUpdate = async (branchId: string, updates: any, password: string) => {
        setSaving(branchId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches/${branchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updates, password, userId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Cập nhật thất bại');
            }

            success('Đã cập nhật cấu hình chi nhánh');
            fetchBranches();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(null);
        }
    };

    const executeDelete = async (branchId: string, password: string) => {
        setSaving(branchId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches/${branchId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, userId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Xóa chi nhánh thất bại');
            }

            success('Đã xóa chi nhánh');
            fetchBranches();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(null);
        }
    };

    const getCurrentLocation = (branchId: string | null) => {
        if (!navigator.geolocation) {
            toastError('Trình duyệt của bạn không hỗ trợ hoặc đã chặn quyền định vị GPS.');
            return;
        }

        // Kiểm tra xem có đang dùng IP không (Geolocation yêu cầu HTTPS)
        const isInsecure = window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isInsecure) {
            toastError('Định vị GPS yêu cầu kết nối bảo mật (HTTPS). Vui lòng sử dụng tên miền có SSL hoặc localhost.');
            return;
        }

        setFetchingGpsId(branchId === null ? 'NEW' : branchId);
        success('Đang bắt đầu lấy tọa độ GPS...');

        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // Tăng lên 15 giây
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (branchId === null) {
                    setNewBranch(prev => ({ ...prev, latitude: latitude as any, longitude: longitude as any }));
                } else {
                    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, latitude, longitude } : b));
                    setJustFetchedId(branchId);
                }
                success('Đã lấy tọa độ hiện tại');
                setFetchingGpsId(null);
            },
            (error) => {
                console.error("GPS Error:", error);
                let msg = 'Không thể lấy vị trí hiện tại';
                if (error.code === 1) msg = 'Bạn đã từ chối quyền truy cập GPS trên trình duyệt.';
                else if (error.code === 2) msg = 'Không thể xác định vị trí (Sóng yếu hoặc lỗi mạng).';
                else if (error.code === 3) msg = 'Quá thời gian phản hồi định vị (Timeout).';

                toastError(msg);
                setFetchingGpsId(null);
            },
            options
        );
    };

    const filteredBranches = branches
        .filter(b => b.branchType === 'CHI_NHANH')
        .filter(b => {
            const matchSearch = (b.name + ' ' + b.code).toLowerCase().includes(searchTerm.toLowerCase());
            const matchBranch = selectedBranch ? b.id === selectedBranch : true;
            return matchSearch && matchBranch;
        });

    const canEdit = ['ADMIN', 'DIRECTOR', 'MANAGER'].includes(userRole);
    const canCreateDelete = ['ADMIN', 'DIRECTOR'].includes(userRole);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto font-outfit">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
                            <Building2 size={32} />
                        </div>
                        Quản lý chi nhánh
                    </h1>
                    <p className="text-slate-500 font-medium">Quản lý mạng lưới chi nhánh và cấu hình tọa độ GPS vận hành</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group flex-1 sm:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chi nhánh..."
                            className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {canCreateDelete && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-bold tracking-tighter hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 cursor-pointer"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Thêm chi nhánh
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats / Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary text-white rounded-2xl shadow-sm"><LayoutGrid size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 tracking-widest">Tổng số chi nhánh</p>
                        <p className="text-2xl font-bold text-slate-900">{branches.filter(b => b.branchType === 'CHI_NHANH').length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary text-white rounded-2xl shadow-sm"><Building2 size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 tracking-widest">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-slate-900">{branches.filter(b => b.branchType === 'CHI_NHANH').length}</p>
                    </div>
                </div>
            </div>

            {/* Add New Branch Panel */}
            {isAdding && (
                <div className="bg-white rounded-[2.5rem] p-8 border-4 border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-top-10 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <Plus className="text-primary" />
                            Thêm chi nhánh mới
                        </h2>
                        <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                            <X className="text-slate-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Tên chi nhánh</label>
                            <input
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="VD: Superb AI Hà Nội"
                                value={newBranch.name}
                                onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Mã (Code)</label>
                            <input
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="VD: HAN"
                                value={newBranch.code}
                                onChange={e => setNewBranch({ ...newBranch, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Loại</label>
                            <div className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm">
                                Chi nhánh bán hàng
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Vĩ độ</label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="Vĩ độ"
                                value={newBranch.latitude || ''}
                                onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    setNewBranch({ ...newBranch, latitude: isNaN(val) ? null : val as any });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Kinh độ</label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="Kinh độ"
                                value={newBranch.longitude || ''}
                                onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    setNewBranch({ ...newBranch, longitude: isNaN(val) ? null : val as any });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Bán kính (m)</label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="50"
                                value={newBranch.checkinRadius}
                                onChange={e => setNewBranch({ ...newBranch, checkinRadius: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => getCurrentLocation(null)}
                                disabled={fetchingGpsId === 'NEW'}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/20"
                            >
                                {fetchingGpsId === 'NEW' ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
                                Lấy tọa độ GPS
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-8 py-4 text-slate-500 font-bold tracking-tighter hover:bg-slate-50 rounded-2xl transition-all cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={() => triggerActionWithPassword(executeCreate)}
                            disabled={!newBranch.name || !newBranch.code}
                            className="flex-1 px-8 py-4 bg-accent text-white font-bold tracking-tighter rounded-2xl shadow-xl shadow-accent/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                        >
                            <Save size={20} />
                            Xác nhận và Lưu chi nhánh
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-80 bg-white rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-32 text-center border border-dashed border-slate-200">
                    <Building2 className="mx-auto text-slate-100 mb-6" size={80} />
                    <p className="text-slate-400 font-bold text-2xl">Không tìm thấy chi nhánh nào</p>
                    <p className="text-slate-300 font-medium mt-2">Thử thay đổi từ khóa tìm kiếm của bạn</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBranches.map((branch) => (
                        <div key={branch.id} className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/40 border border-slate-50 space-y-8 group hover:border-primary-subtle transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-12 -top-12 w-28 h-28 rotate-45 flex items-end justify-center pb-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg bg-primary">
                                CN
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg font-bold",
                                        branch.branchType === 'KHO_TONG' ? "bg-blue-600 text-white" : "bg-primary text-white"
                                    )}>
                                        {branch.branchType === 'KHO_TONG' ? <Warehouse size={28} /> : <Building2 size={28} />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">{branch.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold tracking-widest">{branch.code}</span>
                                            {branch.branchType === 'KHO_TONG' ?
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 tracking-widest"><Warehouse size={12} /> Kho tổng</span> :
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-primary tracking-widest"><Building2 size={12} /> Chi nhánh</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 tracking-widest px-1 uppercase">Vĩ độ</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                            value={branch.latitude || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setBranches(branches.map(b => b.id === branch.id ? { ...b, latitude: isNaN(val) ? null : val } : b));
                                                setJustFetchedId(null);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 tracking-widest px-1 uppercase">Kinh độ</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                            value={branch.longitude || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setBranches(branches.map(b => b.id === branch.id ? { ...b, longitude: isNaN(val) ? null : val } : b));
                                                setJustFetchedId(null);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 tracking-widest px-1 uppercase">Bán kính (m)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                            value={branch.checkinRadius || 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setBranches(branches.map(b => b.id === branch.id ? { ...b, checkinRadius: isNaN(val) ? 0 : val } : b));
                                                setJustFetchedId(null);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-widest px-1">Loại chi nhánh / Phân quyền</label>
                                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-bold text-slate-500">
                                        Chi nhánh bán hàng
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => getCurrentLocation(branch.id)}
                                    disabled={fetchingGpsId === branch.id}
                                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                                    title="Lấy tọa độ hiện tại"
                                >
                                    {fetchingGpsId === branch.id ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
                                </button>

                                <button
                                    onClick={() => {
                                        const updates = canCreateDelete
                                            ? {
                                                name: branch.name,
                                                code: branch.code,
                                                branchType: branch.branchType,
                                                latitude: branch.latitude,
                                                longitude: branch.longitude,
                                                checkinRadius: branch.checkinRadius
                                            }
                                            : {
                                                latitude: branch.latitude,
                                                longitude: branch.longitude,
                                                checkinRadius: branch.checkinRadius
                                            };
                                        triggerActionWithPassword((pwd: string) => executeUpdate(branch.id, updates, pwd));
                                        setJustFetchedId(null);
                                    }}
                                    disabled={saving === branch.id}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer",
                                        justFetchedId === branch.id
                                            ? "bg-accent text-white hover:bg-accent/90 animate-bounce shadow-accent/20"
                                            : "bg-primary text-white hover:bg-primary/90"
                                    )}
                                >
                                    {saving === branch.id ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {justFetchedId === branch.id ? "Xác nhận & Lưu" : "Lưu cấu hình"}
                                </button>

                                {canCreateDelete && branch.id !== userBranchId && (
                                    <button
                                        onClick={() => triggerActionWithPassword((pwd: string) => executeDelete(branch.id, pwd))}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-primary-subtle hover:text-primary rounded-xl transition-all active:scale-95 cursor-pointer"
                                        title="Xóa chi nhánh"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Password Verification Modal */}
            <PasswordModal
                isOpen={isPasswordModalOpen}
                title="Xác thực bảo mật"
                message="Để thực hiện thay đổi thông tin chi nhánh/kho hàng, vui lòng nhập mật khẩu tài khoản của bạn để xác nhận quyền truy cập."
                onConfirm={handlePasswordConfirm}
                onCancel={() => {
                    setIsPasswordModalOpen(false);
                    setPendingAction(null);
                    setJustFetchedId(null);
                }}
            />
        </div>
    );
}
