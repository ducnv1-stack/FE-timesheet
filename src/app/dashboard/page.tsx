"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import {
    LogOut, TrendingUp, Users, ShoppingBag,
    CreditCard, Calendar, ArrowRight, DollarSign, Info, Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Ensure this exists or reimplement locally if simpler

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchDashboardData(parsedUser.id);
    }, []);

    const fetchDashboardData = async (userId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/dashboard?userId=${userId}`);
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );

    if (!user || !data) return null;

    return (
        <div className="bg-transparent">
            <main className="max-w-7xl mx-auto space-y-6">
                {/* Role Based Content */}
                {['DIRECTOR', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT'].includes(data.role) && <DirectorDashboard data={data} />}
                {data.role === 'MANAGER' && <ManagerDashboard data={data} />}
                {data.role === 'SALE' && <SaleDashboard data={data} />}
                {data.role === 'TELESALE' && <TelesaleDashboard data={data} />}
                {data.role === 'MARKETING' && <MarketingDashboard data={data} />}
            </main>
        </div>
    );
}

// ------------------- Role Components -------------------

function DirectorDashboard({ data }: { data: any }) {
    // Mock Chart Data if not sufficient real data
    const chartData = data.topBranches?.length > 0 ? data.topBranches : [
        { name: 'Chi nhánh 1', revenue: 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Tổng doanh thu hệ thống"
                    value={formatCurrency(data.totalRevenue)}
                    icon={<DollarSign size={24} className="text-emerald-600" />}
                    trend="+0% so với tháng trước"
                />
                <StatCard
                    title="Tổng đơn hàng"
                    value={data.totalOrders !== undefined ? String(data.totalOrders) : "..."}
                    icon={<ShoppingBag size={24} className="text-blue-600" />}
                    trend="+0% hôm nay"
                />
                <StatCard
                    title="Nhân sự Active"
                    value={data.activeEmployees !== undefined ? String(data.activeEmployees) : "..."}
                    icon={<Users size={24} className="text-violet-600" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-rose-600" />
                        Top Chi Nhánh (Doanh thu)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000000}tr`} />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#be123c" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Info size={20} className="text-amber-500" />
                        Cảnh báo chỉ số (Min cao)
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {data.kpiAlerts?.length > 0 ? data.kpiAlerts.map((alert: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100 shadow-sm">
                                <div className="mt-1 text-amber-500">
                                    <Info size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Tỷ lệ giá thấp: {alert.branchName}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-slate-500"><strong>{alert.count}/{alert.total}</strong> đơn hàng ({alert.ratio}%) bán dưới giá Min.</p>
                                        <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">HIGH RISK</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <TrendingUp className="opacity-10 mb-2" size={48} />
                                <p className="text-sm italic">Hệ thống hiện không có cảnh báo nào.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ManagerDashboard({ data }: { data: any }) {
    const branchRevenue = data.branchRevenue || 0;
    const milestones = data.milestones || []; // Dynamic milestones from backend
    const currentPercent = data.performance?.milestonePercent || 0;
    const isPenalty = data.performance?.isPenalty || false;
    const isClemency = data.performance?.isClemency || false;
    const lowPriceRatio = data.lowPriceStats?.ratio || 0;

    // Determine the max scale for the progress bar based on milestones
    const maxMilestone = milestones.length > 0 ? Math.max(...milestones.map((m: any) => m.percent)) : 100;
    const maxScale = Math.max(maxMilestone, 150);

    const nextMilestone = milestones.find((m: any) => m.targetRevenue > branchRevenue) || milestones[milestones.length - 1];
    const missingAmount = nextMilestone ? Math.max(0, Number(nextMilestone.targetRevenue) - branchRevenue) : 0;

    return (
        <div className="space-y-4">
            {/* Dark Red KPI Card */}
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                            <p className="text-rose-100 text-sm font-medium mb-0.5 flex items-center gap-2">
                                <TrendingUp size={14} /> Doanh số chi nhánh tháng này
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-lg leading-tight">
                                {formatCurrency(branchRevenue)}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="text-rose-200 text-xs bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                    Mốc hiện tại: {currentPercent}%
                                </div>
                                {isPenalty && (
                                    <div className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-sm border flex items-center gap-1 ${isClemency
                                        ? 'text-emerald-300 bg-emerald-900/30 border-emerald-500/30'
                                        : 'text-amber-300 bg-amber-900/30 border-amber-500/30 animate-pulse'
                                        }`}>
                                        <Info size={12} /> {isClemency ? 'Đã được khoan hồng' : `Tỷ lệ giá thấp: ${lowPriceRatio.toFixed(1)}%`}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            {nextMilestone && nextMilestone.bonusAmount > 0 ? (
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 min-w-[160px]">
                                    <p className="text-[10px] text-rose-200 uppercase font-bold tracking-wider mb-0.5">Thưởng mốc kế tiếp</p>
                                    <p className="text-xl font-black text-emerald-300 leading-none">{formatCurrency(nextMilestone.bonusAmount)}</p>
                                </div>
                            ) : (
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                                    <p className="text-[10px] text-rose-200 uppercase font-bold tracking-wider mb-0.5">Mục tiêu tiếp theo</p>
                                    <p className="text-lg font-bold text-white leading-none">{nextMilestone?.percent}%</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Progress Bar */}
                    <div className="space-y-3">
                        <div className="relative h-10 mt-6 select-none">
                            <div className="absolute top-1/2 left-0 w-full h-2 bg-black/30 rounded-full -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full -translate-y-1/2 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-1000"
                                style={{ width: `${Math.min((branchRevenue / (nextMilestone?.targetRevenue || branchRevenue)) * 80, 100)}%` }}
                            ></div>

                            {milestones.map((m: any, index: number) => {
                                const position = (index / (milestones.length - 1)) * 100;
                                const reached = branchRevenue >= Number(m.targetRevenue);
                                const isNext = m.percent === nextMilestone?.percent;

                                return (
                                    <div
                                        key={index}
                                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-help transition-all duration-500"
                                        style={{ left: `${position}%` }}
                                    >
                                        <div className={`
                                            w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 z-10
                                            ${reached ? 'bg-emerald-400 border-emerald-200 scale-110' :
                                                isNext ? 'bg-white border-rose-500 animate-ping' : 'bg-slate-800 border-slate-600'}
                                        `}></div>
                                        {isNext && <div className="absolute top-0 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-rose-600 z-10"></div>}

                                        <div className={`absolute top-5 text-[9px] font-bold whitespace-nowrap transition-colors ${reached ? 'text-emerald-300' : 'text-rose-200/50'}`}>
                                            {m.percent}%
                                        </div>

                                        <div className="absolute bottom-5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none mb-1 border border-white/10">
                                            Doanh số: {formatCurrency(m.targetRevenue)}
                                            {m.bonusAmount > 0 && ` | Thưởng: ${formatCurrency(m.bonusAmount)}`}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="bg-black/20 rounded-xl p-3 mt-2 backdrop-blur-sm border border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-rose-100 flex items-center gap-1.5">
                                        <ArrowRight size={12} className="text-emerald-400" />
                                        Mục tiêu: <strong className="text-white">{nextMilestone?.percent}%</strong> ({formatCurrency(nextMilestone?.targetRevenue || 0)})
                                    </span>
                                    <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">
                                        Còn thiếu: {formatCurrency(missingAmount)}
                                    </span>
                                </div>
                                {isPenalty && !isClemency && (
                                    <p className="text-[10px] text-amber-300 italic pl-4">
                                        ⚠️ Đang bị phạt (Thưởng mốc x70%). Đạt 110% mục tiêu mốc ({formatCurrency((nextMilestone?.targetRevenue || 0) * 1.1)}) để được khoan hồng!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync Status Cards */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => window.location.href = '/employees'}
                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group text-left cursor-pointer"
                >
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-indigo-600">
                        <Users size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Quản lý nhân viên</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi hiệu suất đội ngũ</p>
                </button>

                <button
                    onClick={() => window.location.href = '/performance'}
                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group text-left cursor-pointer"
                >
                    <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-rose-600">
                        <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Báo cáo chi nhánh</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Chi tiết doanh thu & hiệu suất</p>
                </button>
            </div>

            {/* Unified Income Overview Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Tổng quan thu nhập & Hiệu suất</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Chi nhánh: {data.branchName || 'Đang cập nhật'}</p>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lương cơ bản</p>
                            <p className="text-xl font-black text-slate-700">{formatCurrency(data.baseSalary || 0)}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tổng hoa hồng</p>
                            <p className="text-xl font-black text-emerald-600">{formatCurrency(data.commission || 0)}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thưởng nóng (30%)</p>
                            <p className="text-xl font-black text-rose-600">{formatCurrency(data.hotBonus || 0)}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tiền Ship</p>
                            <p className="text-xl font-black text-indigo-600">{formatCurrency(data.shippingFees || 0)}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${isPenalty && !isClemency ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/30 border-emerald-100/50'}`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thưởng mốc</p>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-xl font-black ${isPenalty && !isClemency ? 'line-through text-slate-400' : 'text-emerald-700'}`}>
                                    {formatCurrency(data.baseBonus || 0)}
                                </p>
                                {isPenalty && !isClemency && (
                                    <p className="text-sm font-black text-rose-600">{formatCurrency(data.actualBonus || 0)}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Low Price Indicators */}
                        <div className={`p-5 rounded-2xl border ${isPenalty ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/30 border-emerald-100/50'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className={`text-xs font-black uppercase tracking-wider ${isPenalty ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    Chỉ số giá thấp (Dưới Min)
                                </h4>
                                {isClemency && <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">Được khoan hồng</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Số đơn</p>
                                    <p className="text-sm font-bold text-slate-700">{data.lowPriceStats?.count || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Giá trị</p>
                                    <p className="text-sm font-bold text-slate-700">{formatCurrency(data.lowPriceStats?.value || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Tỷ lệ</p>
                                    <p className={`text-sm font-bold ${isPenalty ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {lowPriceRatio.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Estimated Net Income (Dark Card) */}
                        <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <TrendingUp size={24} className="text-emerald-400" />
                            </div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thực nhận (Dự kiến)</h4>
                            <p className="text-3xl font-black tracking-tight mb-2 drop-shadow-sm text-white">
                                {formatCurrency(data.netIncome || 0)}
                            </p>
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] text-slate-400 font-bold max-w-[140px] leading-tight opacity-75">
                                    Toàn hệ thống chi nhánh: <span className="text-slate-200">{data.branchName}</span>
                                </p>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Tổng thu nhập</p>
                                    <p className="text-sm font-black text-emerald-400 leading-none">
                                        {formatCurrency(data.netIncome || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, title, href }: { icon: React.ReactNode, title: string, href: string }) {
    return (
        <a
            href={href}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
        >
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600 group-hover:bg-rose-100">
                {icon}
            </div>
            <span className="font-bold text-slate-700 group-hover:text-rose-700">{title}</span>
            <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-rose-600" />
        </a>
    );
}

function SaleDashboard({ data }: { data: any }) {
    // Force 200M base target as requested (100% = 200tr)
    const KPI_TARGET = 200000000;
    const currentRevenue = data.monthlyRevenue || 0;
    const lowPriceRevenue = data.lowPriceRevenue || 0;

    // Define Tiers based on user request/image
    const KPI_TIERS = [
        { percent: 40, label: '40%', bonus: 0 },
        { percent: 60, label: '60%', bonus: 0 },
        { percent: 80, label: '80%', bonus: 0 },
        { percent: 100, label: '100%', bonus: 0 },
        { percent: 125, label: '125%', bonus: 3000000 },
        { percent: 150, label: '150%', bonus: 6000000 },
        { percent: 200, label: '200%', bonus: 12000000 },
        { percent: 250, label: '250%', bonus: 20000000 },
        { percent: 300, label: '300%', bonus: 23000000 },
        { percent: 350, label: '350%', bonus: 26000000 },
        { percent: 400, label: '400%', bonus: 30000000 },
    ];

    // Calculate status
    const currentPercent = (currentRevenue / KPI_TARGET) * 100;
    const isPenalty = currentRevenue > 0 && (lowPriceRevenue / currentRevenue) > 0.2;

    // Find next milestone
    const nextTier = KPI_TIERS.find(t => t.percent > currentPercent) || KPI_TIERS[KPI_TIERS.length - 1];

    // Find next BONUS milestone (if any)
    const nextBonusTier = KPI_TIERS.find(t => t.percent > currentPercent && t.bonus > 0);

    const nextTierRevenue = (KPI_TARGET * nextTier.percent) / 100;
    const nextBonusRevenue = nextBonusTier ? (KPI_TARGET * nextBonusTier.percent) / 100 : null;

    // Adjust target if penalty active (110% of milestone)
    const effectiveTargetRevenue = isPenalty ? nextTierRevenue * 1.1 : nextTierRevenue;
    const missingAmount = Math.max(0, effectiveTargetRevenue - currentRevenue);

    // Progress bar max scale (show a bit more than 100% or current max)
    const maxScale = Math.max(150, Math.ceil(currentPercent / 50) * 50 + 50);

    return (
        <div className="space-y-4">
            {/* KPI Card */}
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                            <p className="text-rose-100 text-sm font-medium mb-0.5 flex items-center gap-2">
                                <TrendingUp size={14} /> Doanh số tháng này
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-lg leading-tight">
                                {formatCurrency(currentRevenue)}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="text-rose-200 text-xs bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                    KPI: {currentPercent.toFixed(1)}%
                                </div>
                                {isPenalty && (
                                    <div className="text-amber-300 text-xs bg-amber-900/30 px-2.5 py-1 rounded-full backdrop-blur-sm border border-amber-500/30 flex items-center gap-1 animate-pulse">
                                        <Info size={12} /> Tỷ lệ giá thấp: {((lowPriceRevenue / currentRevenue) * 100).toFixed(1)}% (&gt;20%)
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            {nextTier.bonus > 0 ? (
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 min-w-[160px]">
                                    <p className="text-[10px] text-rose-200 uppercase font-bold tracking-wider mb-0.5">Thưởng mốc kế tiếp</p>
                                    <p className="text-xl font-black text-emerald-300 leading-none">{formatCurrency(nextTier.bonus)}</p>
                                </div>
                            ) : (
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                                    <p className="text-[10px] text-rose-200 uppercase font-bold tracking-wider mb-0.5">Mục tiêu tiếp theo</p>
                                    <p className="text-lg font-bold text-white leading-none">{nextTier.label}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Progress Section */}
                    <div className="space-y-3">
                        {/* Enhanced Progress Bar */}
                        <div className="relative h-10 mt-6 select-none">
                            {/* Track */}
                            <div className="absolute top-1/2 left-0 w-full h-2 bg-black/30 rounded-full -translate-y-1/2"></div>

                            {/* Fill */}
                            <div
                                className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full -translate-y-1/2 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-1000"
                                style={{ width: `${Math.min((currentPercent / maxScale) * 100, 100)}%` }}
                            ></div>

                            {/* Nodes */}
                            {KPI_TIERS.filter(t => t.percent <= maxScale).map((tier, index) => {
                                const position = (tier.percent / maxScale) * 100;
                                const reached = currentPercent >= tier.percent;
                                const isNext = tier.percent === nextTier.percent;

                                return (
                                    <div
                                        key={index}
                                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-help transition-all duration-500"
                                        style={{ left: `${position}%` }}
                                    >
                                        <div className={`
                                            w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 z-10
                                            ${reached ? 'bg-emerald-400 border-emerald-200 scale-110' :
                                                isNext ? 'bg-white border-rose-500 animate-ping' : 'bg-slate-800 border-slate-600'}
                                        `}></div>
                                        {/* Static Marker (to fix ping effect) */}
                                        {isNext && <div className="absolute top-0 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-rose-600 z-10"></div>}

                                        {/* Label */}
                                        <div className={`absolute top-5 text-[9px] font-bold whitespace-nowrap transition-colors ${reached ? 'text-emerald-300' : 'text-rose-200/50'}`}>
                                            {tier.label}
                                        </div>

                                        {/* Tooltip */}
                                        {tier.bonus > 0 && (
                                            <div className="absolute bottom-5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none mb-1 border border-white/10">
                                                Thưởng: {formatCurrency(tier.bonus)}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="bg-black/20 rounded-xl p-3 mt-2 backdrop-blur-sm border border-white/5">
                            {isPenalty ? (
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-amber-500/20 rounded text-amber-300 mt-0.5">
                                        <Info size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-300">Cảnh báo: Doanh số giá thấp vượt mức 20%</p>
                                        <p className="text-xs text-rose-50 leading-relaxed opacity-90 mt-0.5">
                                            Vượt mốc <strong>{nextTier.label}</strong> tại <strong>110%</strong> chỉ tiêu
                                            (<strong>{formatCurrency(effectiveTargetRevenue)}</strong>).
                                        </p>
                                        <p className="text-xs font-bold text-white mt-1 text-right">
                                            Còn thiếu: {formatCurrency(missingAmount)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-rose-100 flex items-center gap-1.5">
                                            <ArrowRight size={12} className="text-emerald-400" />
                                            Mục tiêu: <strong className="text-white">{nextTier.label}</strong> ({formatCurrency(nextTierRevenue)})
                                        </span>
                                        <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">
                                            Còn thiếu: {formatCurrency(missingAmount)}
                                        </span>
                                    </div>
                                    {nextBonusTier && (
                                        <p className="text-[10px] text-rose-200/80 italic pl-4">
                                            Chạm mốc {nextBonusTier.label} ({formatCurrency(nextBonusRevenue!)}) để nhận <strong>+{formatCurrency(nextBonusTier.bonus)}</strong> thưởng!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => window.location.href = '/orders/new'}
                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group text-left cursor-pointer"
                >
                    <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-rose-600">
                        <ShoppingBag size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Tạo đơn hàng mới</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Lên đơn bán hàng ngay</p>
                </button>

                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 text-indigo-600">
                        <Calendar size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Lịch làm việc</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ca tiếp: 14:00 - 22:00</p>
                </div>
            </div>

            {/* Income & Performance Overview */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Tổng quan thu nhập & Hiệu suất</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Key Income Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Số đơn hàng</p>
                            <p className="text-xl font-black text-slate-900">{data.orderCount || 0}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lương cơ bản</p>
                            <p className="text-xl font-black text-slate-700">{formatCurrency(data.baseSalary || 0)}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tổng hoa hồng</p>
                            <p className="text-xl font-black text-emerald-600">{formatCurrency(data.totalCommission || 0)}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thưởng nóng</p>
                            <p className="text-xl font-black text-rose-600">{formatCurrency(data.hotBonus || 0)}</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tiền Ship</p>
                            <p className="text-xl font-black text-indigo-600">{formatCurrency(data.shippingFees || 0)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Penalty Section */}
                        <div className={`p-5 rounded-2xl border ${data.performance?.isPenalty ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/30 border-emerald-100/50'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className={`text-xs font-black uppercase tracking-wider ${data.performance?.isPenalty ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    Chỉ số giá thấp (Dưới Min)
                                </h4>
                                {data.performance?.isPenalty && !data.performance?.isClemency && (
                                    <span className="text-[9px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">BỊ PHẠT 30%</span>
                                )}
                                {data.performance?.isClemency && (
                                    <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">ĐƯỢC KHOAN HỒNG</span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Số đơn</p>
                                    <p className="text-sm font-black text-slate-800">{data.lowPriceStats?.count || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Giá trị</p>
                                    <p className="text-sm font-black text-slate-800">{formatCurrency(data.lowPriceStats?.value || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">Tỷ lệ</p>
                                    <p className={`text-sm font-black ${data.performance?.isPenalty ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {data.lowPriceStats?.ratio?.toFixed(1) || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Final Reward Section */}
                        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Thực nhận (Dự kiến)</h4>
                                    <TrendingUp size={16} className="text-emerald-400" />
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-black text-white">{formatCurrency(data.performance?.actualReward || 0)}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Mốc thưởng hiện tại: <span className="text-slate-200">
                                            {formatCurrency(data.performance?.milestone || 0)}
                                        </span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tổng thu nhập</p>
                                        <p className="text-lg font-black text-emerald-400">
                                            {formatCurrency((data.baseSalary || 0) + (data.totalCommission || 0) + (data.hotBonus || 0) + (data.shippingFees || 0) + (data.performance?.actualReward || 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TelesaleDashboard({ data }: { data: any }) {
    const router = useRouter();
    const fbRevenue = data.fbRevenue || 0;
    const fbOrderCount = data.fbOrderCount || 0;
    const commission = data.commission || 0;

    return (
        <div className="space-y-6 text-left">
            {/* Top Stat Card - Integrated Version */}
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group border border-white/10">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Left: Revenue */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <TrendingUp size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Doanh số Facebook</h3>
                        </div>
                        <p className="text-4xl md:text-5xl font-black truncate tracking-tight">
                            {formatCurrency(fbRevenue)}
                        </p>
                        <div className="mt-3 flex gap-2">
                            <span className="text-[10px] font-bold bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                Số đơn: {fbOrderCount}
                            </span>
                        </div>
                    </div>

                    {/* Right: Commission Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 min-w-[260px]">
                        <div className="flex items-center gap-2 mb-1">
                            <CreditCard size={14} className="text-emerald-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-100">Hoa hồng dự kiến (0.3%)</h4>
                        </div>
                        <p className="text-3xl font-black text-emerald-400">
                            {formatCurrency(commission)}
                        </p>
                        <p className="text-[9px] text-rose-200/50 mt-2 italic leading-tight">
                            * Tính trên tổng doanh thu Facebook tháng này.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                    <ShoppingBag size={20} className="text-rose-600" /> Đơn hàng Facebook gần đây
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.recentOrders?.map((order: any) => (
                        <div
                            key={order.id}
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all group"
                        >
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700 group-hover:text-rose-700">#{order.id.slice(0, 8)}</p>
                                <p className="text-[9px] text-slate-400 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-emerald-600">{formatCurrency(order.totalAmount)}</p>
                                <p className="text-[9px] text-emerald-500 font-black tracking-tighter">
                                    HH (0.3%): {formatCurrency(Number(order.totalAmount) * 0.003)}
                                </p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold truncate max-w-[100px] mt-1">{order.customerName}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {(!data.recentOrders || data.recentOrders.length === 0) && (
                    <div className="py-10 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                        Chưa có đơn hàng nào
                    </div>
                )}
            </div>
        </div>
    );
}

function MarketingDashboard({ data }: { data: any }) {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-6 text-white shadow-xl flex justify-between items-center text-left">
                <div>
                    <p className="text-rose-100 text-sm font-medium mb-1">💰 Tổng thưởng Marketing (Dự kiến)</p>
                    <h2 className="text-4xl font-black tracking-tight drop-shadow-lg">
                        {formatCurrency(data.totalReward)}
                    </h2>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <TrendingUp size={32} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {data.branchStats?.map((branch: any) => (
                    <div key={branch.branchId} className={`p-6 rounded-2xl border transition-all ${branch.isAchieved ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'
                        }`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">{branch.branchName}</h3>
                            {branch.isAchieved && (
                                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">VƯỢT MỐC</span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Doanh thu tháng</p>
                                <p className={`text-xl font-black ${branch.isAchieved ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {formatCurrency(branch.revenue)}
                                </p>
                            </div>

                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-400 font-bold uppercase">Mốc KPI:</span>
                                    <span className="text-slate-700 font-black">{formatCurrency(branch.threshold)}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-400 font-bold uppercase">Tỉ lệ thưởng:</span>
                                    <span className="text-rose-600 font-black">{branch.percent}%</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Thưởng nhận được</p>
                                    <p className={`text-lg font-black ${branch.isAchieved ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        {formatCurrency(branch.reward)}
                                    </p>
                                </div>
                                {!branch.isAchieved && (
                                    <p className="text-[10px] text-rose-500 font-bold">
                                        -{formatCurrency(branch.threshold - branch.revenue)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {data.branchStats?.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                    <Info size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">{data.message || 'Không có dữ liệu chi nhánh'}</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, trend }: any) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-100 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">{title}</p>
                    <h3 className="text-xl font-black text-slate-800">{value}</h3>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            )}
        </div>
    );
}
