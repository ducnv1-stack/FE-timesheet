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
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setUserRole(user.role?.code || '');

                const bId = user.employee?.branchId || user.branchId || '';
                setUserBranchId(bId);
                setUserBranchName(user.employee?.branch?.name || 'Chi nhánh của tôi');

                // If user is a MANAGER, lock filter to their branch
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

    const handleUpdate = async (branchId: string, updates: any) => {
        setSaving(branchId);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches/${branchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!res.ok) throw new Error('Cập nhật thất bại');

            success('Đã cập nhật cấu hình chi nhánh');
            fetchBranches();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setSaving(null);
        }
    };

    const getCurrentLocation = (branchId: string) => {
        if (!navigator.geolocation) {
            toastError('Trình duyệt không hỗ trợ định vị');
            return;
        }

        // Kiểm tra xem có phải môi trường an toàn (HTTPS hoặc localhost) không
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            toastError('Định vị chỉ hoạt động trên HTTPS hoặc localhost. Vui lòng nhập tọa độ thủ công hoặc sử dụng HTTPS.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const updatedBranches = branches.map(b =>
                    b.id === branchId ? { ...b, latitude, longitude } : b
                );
                setBranches(updatedBranches);
                success('Đã lấy tọa độ hiện tại');
            },
            (error) => {
                let msg = 'Không thể lấy vị trí hiện tại';
                if (error.code === 1) msg = 'Vui lòng cho phép quyền truy cập vị trí trong cài đặt trình duyệt';
                if (error.code === 2) msg = 'Vị trí không khả dụng (GPS yếu hoặc bị chặn)';
                if (error.code === 3) msg = 'Hết thời gian chờ lấy vị trí';
                toastError(msg);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const filteredBranches = branches.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBranch = selectedBranch ? b.id === selectedBranch : true;
        return matchSearch && matchBranch;
    });

    const isManagerLocked = userRole === 'MANAGER';

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight flex items-center gap-3">
                        <Building2 className="text-rose-600" size={32} />
                        Quản lý chi nhánh
                    </h1>
                    <p className="text-slate-500 font-medium">Cấu hình tọa độ GPS và thông tin vận hành</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Select Branch */}
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        disabled={isManagerLocked}
                        className={cn(
                            "px-4 py-3 bg-white border border-slate-200 rounded-2xl md:w-48 shadow-sm focus:ring-2 outline-none font-medium text-sm transition-all",
                            isManagerLocked
                                ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-100"
                                : "focus:ring-rose-500/20 focus:border-rose-500"
                        )}
                    >
                        {isManagerLocked ? (
                            <option value={userBranchId}>
                                {branches.length > 0 ? (branches.find(b => b.id === userBranchId)?.name || userBranchName) : userBranchName}
                            </option>
                        ) : (
                            <>
                                <option value="">Tất cả chi nhánh</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </>
                        )}
                    </select>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên chi nhánh..."
                            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full md:w-64 shadow-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-white rounded-[2rem] animate-pulse border border-slate-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200">
                    <Building2 className="mx-auto text-slate-200 mb-4" size={64} />
                    <p className="text-slate-400 font-bold text-lg">Không tìm thấy chi nhánh nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-outfit">
                    {filteredBranches.map((branch) => (
                        <div key={branch.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 group hover:border-rose-200 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                        <Navigation size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{branch.name}</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">{branch.code || 'NO_CODE'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUpdate(branch.id, {
                                        latitude: branch.latitude,
                                        longitude: branch.longitude,
                                        checkinRadius: branch.checkinRadius
                                    })}
                                    disabled={saving === branch.id}
                                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-rose-600 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                >
                                    {saving === branch.id ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vĩ độ (Latitude)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none"
                                            value={branch.latitude || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setBranches(branches.map(b => b.id === branch.id ? { ...b, latitude: isNaN(val) ? null : val } : b));
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kinh độ (Longitude)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none"
                                            value={branch.longitude || ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setBranches(branches.map(b => b.id === branch.id ? { ...b, longitude: isNaN(val) ? null : val } : b));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bán kính chấm công (m)</label>
                                    <div className="relative">
                                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="number"
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none"
                                            value={branch.checkinRadius || 50}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setBranches(branches.map(b => b.id === branch.id ? { ...b, checkinRadius: isNaN(val) ? 50 : val } : b));
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => getCurrentLocation(branch.id)}
                                    className="sm:self-end flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-rose-100 transition-all active:scale-95"
                                >
                                    <LocateFixed size={16} />
                                    Lấy vị trí hiện tại
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
