"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Award, Calendar, ChevronRight, Crown, DollarSign, Medal, Search, ShoppingBag, Trophy, Users, Building2, User as UserIcon, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function LeaderboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState(formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [endDate, setEndDate] = useState(formatLocalDate(new Date()));
    const [branchId, setBranchId] = useState("");
    const [activeTab, setActiveTab] = useState<'employees' | 'branches'>('employees');
    const [metric, setMetric] = useState<'sales' | 'completed'>('sales');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // If manager, lock to their branch
        if (parsedUser.role?.code === 'MANAGER' && parsedUser.employee?.branchId) {
            setBranchId(parsedUser.employee.branchId);
        }

        fetchBranches();
    }, [router]);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches`);
            const json = await res.json();
            setBranches(json);
        } catch (err) {
            console.error("Failed to fetch branches", err);
        }
    };

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/leaderboard`);
            url.searchParams.append('userId', user.id);
            url.searchParams.append('startDate', startDate);
            url.searchParams.append('endDate', endDate);
            if (branchId) url.searchParams.append('branchId', branchId);

            const res = await fetch(url.toString());
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Failed to fetch leaderboard", err);
        } finally {
            setLoading(false);
        }
    }, [user, startDate, endDate, branchId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const isHighLevelRole = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'ADMIN'].includes(user?.role?.code);
    const isManager = user?.role?.code === 'MANAGER';

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-200/50';
        if (rank === 2) return 'bg-slate-400 text-white border-slate-300 shadow-lg shadow-slate-200/50';
        if (rank === 3) return 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-200/50';
        return 'bg-white text-slate-400 border-slate-100';
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return (
            <div className="flex flex-col items-center justify-center -space-y-0.5">
                <Crown size={18} color="white" strokeWidth={2.5} />
                <span className="text-[9px] font-black drop-shadow-sm">1</span>
            </div>
        );
        if (rank === 2) return (
            <div className="flex flex-col items-center justify-center -space-y-0.5">
                <Medal size={18} color="white" strokeWidth={2.5} />
                <span className="text-[9px] font-black drop-shadow-sm">2</span>
            </div>
        );
        if (rank === 3) return (
            <div className="flex flex-col items-center justify-center -space-y-0.5">
                <Award size={18} color="white" strokeWidth={2.5} />
                <span className="text-[9px] font-black drop-shadow-sm">3</span>
            </div>
        );
        return <span className="font-black text-xs">{rank}</span>;
    };

    const listData = activeTab === 'employees'
        ? data?.employees?.[metric] || []
        : data?.branches?.[metric] || [];

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shadow-sm">
                            <Trophy size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-800">Bảng Xếp Hạng</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">
                        Tôn vinh nỗ lực và vinh danh những cá nhân, tập thể xuất sắc nhất {isManager ? `tại ${user?.employee?.branch?.name}` : 'toàn hệ thống'}.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm shrink min-w-0 hover:border-rose-300 transition-colors">
                        <Calendar
                            size={14}
                            className="text-slate-400 shrink-0 cursor-pointer"
                            onClick={(e) => {
                                const input = (e.currentTarget.parentElement as HTMLElement)?.querySelector('input');
                                if (input && 'showPicker' in input) (input as any).showPicker();
                            }}
                        />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            onClick={(e) => {
                                if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker();
                            }}
                            className="text-[11px] font-bold border-none focus:ring-0 cursor-pointer p-0 bg-transparent text-slate-800 outline-none min-w-0 w-[95px]"
                        />
                        <span className="text-slate-300">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            onClick={(e) => {
                                if ('showPicker' in e.currentTarget) (e.currentTarget as any).showPicker();
                            }}
                            className="text-[11px] font-bold border-none focus:ring-0 cursor-pointer p-0 bg-transparent text-slate-800 outline-none min-w-0 w-[95px]"
                        />
                    </div>

                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 shrink min-w-0">
                        <Building2 size={14} className="text-slate-400 shrink-0" />
                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            disabled={isManager}
                            className={cn(
                                "flex-1 text-[11px] font-bold border-none focus:ring-0 bg-transparent p-0 cursor-pointer text-slate-800 outline-none appearance-none min-w-0",
                                isManager ? "opacity-50 cursor-not-allowed" : ""
                            )}
                        >
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="text-slate-400 shrink-0" />
                    </div>
                </div>
            </div>

            {/* Personalized Performance & Motivational Card */}
            {user && (data?.employee?.[metric]?.rank || data?.employee?.[`branch${metric.charAt(0).toUpperCase() + metric.slice(1)}`]?.rank) && (
                <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200 group-hover:rotate-6 transition-transform">
                            <Trophy size={40} />
                        </div>

                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-black text-slate-800">
                                Thành tích của bạn tháng này
                            </h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                {data.employee[metric]?.rank && (
                                    <span className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl text-xs font-black flex items-center gap-2">
                                        <Trophy size={14} />
                                        Top {data.employee[metric].rank} Server
                                    </span>
                                )}
                                {data.employee[`branch${metric.charAt(0).toUpperCase() + metric.slice(1)}`]?.rank && (
                                    <span className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl text-xs font-black flex items-center gap-2">
                                        <Medal size={14} />
                                        Top {data.employee[`branch${metric.charAt(0).toUpperCase() + metric.slice(1)}`].rank} Chi nhánh
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-rose-600 italic">
                                {data.employee[metric]?.rank === 1
                                    ? "Xin chúc mừng bạn đang Top 1 Server, hãy giữ vững phong độ tuyệt vời này nhé!"
                                    : data.employee[metric]?.rank <= 3
                                        ? "Tuyệt vời! Bạn đang nằm trong Top 3 xuất sắc nhất. Hãy bứt phá lên vị trí số 1!"
                                        : data.employee[metric]?.rank <= 10
                                            ? `Bạn đang ở Top ${data.employee[metric].rank}, chỉ một chút nỗ lực nữa là vào Top 3 rồi!`
                                            : "Mọi nỗ lực đều được ghi nhận. Hãy tiếp tục cố gắng để ghi danh vào bảng vàng nhé!"
                                }
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[120px]">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Thứ hạng</p>
                                <p className="text-2xl font-black text-slate-800">#{data.employee[metric]?.rank || '—'}</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[120px]">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Hạng CN</p>
                                <p className="text-2xl font-black text-slate-800">#{data.employee[`branch${metric.charAt(0).toUpperCase() + metric.slice(1)}`]?.rank || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Tabs & Metrics */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Role Tabs */}
                    <div className="flex p-1 bg-slate-200/50 rounded-xl backdrop-blur-sm border border-slate-200 w-fit">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer",
                                activeTab === 'employees'
                                    ? "bg-white text-rose-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            <Users size={14} />
                            Nhân viên
                        </button>
                        <button
                            onClick={() => setActiveTab('branches')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer",
                                activeTab === 'branches'
                                    ? "bg-white text-rose-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            <Building2 size={14} />
                            Chi nhánh
                        </button>
                    </div>

                    {/* Metric Toggle */}
                    <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm font-medium text-xs w-fit">
                        <button
                            onClick={() => setMetric('sales')}
                            className={cn(
                                "flex-1 sm:flex-initial px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer",
                                metric === 'sales' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <ShoppingBag size={14} />
                            Doanh số bán
                        </button>
                        <button
                            onClick={() => setMetric('completed')}
                            className={cn(
                                "flex-1 sm:flex-initial px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer",
                                metric === 'completed' ? "bg-rose-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <DollarSign size={14} />
                            Doanh số hoàn thành
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin" />
                                <p className="text-sm font-black text-slate-800 animate-pulse">Đang thu thập dữ liệu...</p>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider w-16 text-center whitespace-nowrap">Top Server</th>
                                    {activeTab === 'employees' && (
                                        <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Top Chi Nhánh</th>
                                    )}
                                    <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">
                                        {activeTab === 'employees' ? 'Nhân viên' : 'Chi nhánh'}
                                    </th>
                                    {activeTab === 'employees' && (
                                        <>
                                            <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Chức vụ</th>
                                            <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">Chi nhánh</th>
                                        </>
                                    )}
                                    <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right whitespace-nowrap">Giá trị đạt được</th>
                                    <th className="px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center whitespace-nowrap">Tình trạng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {listData.length > 0 ? (
                                    listData.map((item: any) => (
                                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-2 py-1.5 whitespace-nowrap text-center">
                                                <div className={cn(
                                                    "w-7 h-7 mx-auto rounded-lg border flex items-center justify-center shrink-0 overflow-visible",
                                                    getRankColor(item.rank)
                                                )}>
                                                    {getRankIcon(item.rank)}
                                                </div>
                                            </td>
                                            {activeTab === 'employees' && (
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition-all",
                                                            item.branchRank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                                                item.branchRank === 2 ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                                                    item.branchRank === 3 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                                                                        "bg-slate-50 text-slate-500 border border-slate-100"
                                                        )}>
                                                            {item.branchRank === 1 && <Crown size={10} fill="currentColor" />}
                                                            {item.branchRank === 2 && <Medal size={10} fill="currentColor" />}
                                                            {item.branchRank === 3 && <Award size={10} fill="currentColor" />}
                                                            #{item.branchRank || '—'}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden shadow-sm shrink-0 relative">
                                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 text-slate-400 z-0">
                                                            {activeTab === 'employees' ? <UserIcon size={14} /> : <Building2 size={14} />}
                                                        </div>
                                                        {item.avatarUrl && (
                                                            <img
                                                                src={item.avatarUrl.startsWith('http') ? item.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL}${item.avatarUrl}`}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover relative z-10"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[120px] md:max-w-[200px]" title={item.name || `Đối tượng #${item.id.slice(-4)}`}>
                                                            {item.name || `Đối tượng #${item.id.slice(-4)}`}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium font-mono leading-tight">
                                                            {item.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {activeTab === 'employees' && (
                                                <>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100 uppercase">
                                                            {item.position || 'Sale'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                                                            {item.branchName || '—'}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-3 py-2 whitespace-nowrap text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className={cn(
                                                        "text-xs font-black",
                                                        metric === 'sales' ? "text-blue-600" : "text-rose-600"
                                                    )}>
                                                        {formatCurrency(item.amount)}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <ArrowUpRight size={8} className="text-emerald-500" />
                                                        <p className="text-[9px] text-slate-400 font-bold">Tháng này</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                <div className="flex justify-center">
                                                    {item.rank <= 3 ? (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />
                                                            Vượt trội
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black">
                                                            Nỗ lực
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-slate-100 rounded-full">
                                                    <Search size={24} strokeWidth={1.5} />
                                                </div>
                                                <p className="text-xs font-bold">Không tìm thấy dữ liệu xếp hạng trong kỳ này.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer Motivational Quote */}
            <div className="bg-gradient-to-r from-rose-700 to-rose-500 p-6 md:p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-rose-200/50 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />

                <div className="space-y-2 text-center md:text-left relative z-10 w-full overflow-hidden">
                    <h3 className="text-lg md:text-xl font-black tracking-tight truncate">Đừng bao giờ dừng nỗ lực!</h3>
                    <p className="text-rose-50 opacity-90 text-[11px] md:text-xs max-w-lg italic font-medium leading-relaxed">
                        "Mỗi bước tiến hôm nay là viên gạch cho thành công ngày mai."
                    </p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center justify-center gap-1.5 bg-white text-rose-600 px-5 py-3 rounded-xl font-black text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 relative z-10 shrink-0 w-full md:w-auto cursor-pointer"
                >
                    Về Dashboard
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
