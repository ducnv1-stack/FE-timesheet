"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    LogOut, TrendingUp, Users, ShoppingBag,
    CreditCard, Calendar, ArrowRight, DollarSign, Info, Clock,
    FileText, CheckCircle, AlertCircle, Wallet, LucideIcon,
    PieChart as PieChartIcon, X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Ensure this exists or reimplement locally if simpler

const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Default to this month
    const [startDate, setStartDate] = useState(formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [endDate, setEndDate] = useState(formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)));

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchDashboardData(parsedUser.id, startDate, endDate);
    }, [startDate, endDate]);

    const fetchDashboardData = async (userId: string, start: string, end: string) => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/dashboard?userId=${userId}&startDate=${start}&endDate=${end}`);
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    const setQuickRange = (range: 'today' | 'week' | 'month' | '3months') => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (range) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'week':
                const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1); // Monday
                start = new Date(now.setDate(first));
                start.setHours(0, 0, 0, 0);
                end = new Date();
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case '3months':
                start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
        }

        setStartDate(formatLocalDate(start));
        setEndDate(formatLocalDate(end));
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
        <div className="bg-transparent space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thống kê hoạt động</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {new Date(startDate).toLocaleDateString('vi-VN')} - {new Date(endDate).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Quick Ranges */}
                    <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-100 h-10 overflow-hidden">
                        {[
                            { label: 'Hôm nay', val: 'today' },
                            { label: 'Tuần này', val: 'week' },
                            { label: 'Tháng này', val: 'month' },
                            { label: '3 tháng', val: '3months' },
                        ].map((btn) => (
                            <button
                                key={btn.val}
                                onClick={() => setQuickRange(btn.val as any)}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all hover:bg-white hover:shadow-sm text-slate-500 hover:text-rose-600"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 hidden lg:block"></div>

                    {/* Custom Range Picker */}
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 group focus-within:border-rose-200 transition-colors h-10">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black text-slate-700 outline-none px-2 cursor-pointer focus:text-rose-600"
                        />
                        <ArrowRight size={12} className="text-slate-300" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black text-slate-700 outline-none px-2 cursor-pointer focus:text-rose-600"
                        />
                    </div>

                    <button
                        onClick={() => fetchDashboardData(user.id, startDate, endDate)}
                        className="p-2.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 group"
                        title="Làm mới dữ liệu"
                    >
                        <Clock size={18} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto space-y-6">
                {/* Role Based Content */}
                {['DIRECTOR', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT'].includes(data.role) && (
                    <DirectorDashboard
                        data={data}
                        userId={user.id}
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}
                {data.role === 'MANAGER' && <ManagerDashboard data={data} startDate={startDate} endDate={endDate} />}
                {data.role === 'SALE' && <SaleDashboard data={data} startDate={startDate} endDate={endDate} />}
                {data.role === 'TELESALE' && <TelesaleDashboard data={data} startDate={startDate} endDate={endDate} />}
                {data.role === 'MARKETING' && <MarketingDashboard data={data} startDate={startDate} endDate={endDate} />}
            </main>
        </div>
    );
}

// ------------------- Role Components -------------------

function DirectorDashboard({ data, userId, startDate, endDate }: { data: any, userId: string, startDate: string, endDate: string }) {
    const router = useRouter();
    const [selectedViolationBranch, setSelectedViolationBranch] = useState<any>(null);

    // Mock Chart Data if not sufficient real data
    const chartData = data.topBranches?.length > 0 ? data.topBranches : [
        { name: 'Đang tải...', revenue: 0 },
    ];

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const PAYMENT_LABELS: any = {
        'CASH': 'Tiền mặt',
        'TRANSFER_COMPANY': 'CK Công ty',
        'TRANSFER_PERSONAL': 'CK Cá nhân',
        'CARD': 'Quẹt thẻ',
        'INSTALLMENT': 'Trả góp'
    };

    const pieData = data.paymentMethodBreakdown?.filter((p: any) => p.amount > 0).map((p: any) => ({
        name: PAYMENT_LABELS[p.method] || p.method,
        value: p.amount
    })) || [];

    return (
        <div className="space-y-6 text-left">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng doanh thu hệ thống"
                    value={formatCurrency(data.totalRevenue)}
                    icon={<DollarSign size={20} className="text-emerald-600" />}
                    trend="+0% tháng này"
                />
                <StatCard
                    title="Tiền mặt đã thu"
                    value={formatCurrency(data.paymentSummary?.cash || 0)}
                    icon={<Wallet size={20} className="text-blue-600" />}
                />
                <StatCard
                    title="Chuyển khoản / Thẻ"
                    value={formatCurrency((data.paymentSummary?.transfer || 0) + (data.paymentSummary?.card || 0))}
                    icon={<CreditCard size={20} className="text-violet-600" />}
                />
                <StatCard
                    title="Tổng đơn hàng"
                    value={String(data.totalOrders || 0)}
                    icon={<ShoppingBag size={20} className="text-rose-600" />}
                />
            </div>

            {/* Financial Alerts & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    onClick={() => router.push(`/orders?tab=installment&paymentStatus=pending&startDate=${startDate}&endDate=${endDate}`)}
                    className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors group"
                >
                    <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center text-amber-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-800 uppercase">Chờ khớp tiền</p>
                        <p className="text-xl font-black text-amber-900">{data.unconfirmedCount || 0} <span className="text-xs font-medium">đơn hàng</span></p>
                        <p className="text-[10px] text-amber-700 font-bold">~ {formatCurrency(data.unconfirmedRevenue || 0)}</p>
                    </div>
                </div>

                <div
                    onClick={() => router.push(`/orders?tab=invoice&invoiceStatus=pending&startDate=${startDate}&endDate=${endDate}`)}
                    className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4 cursor-pointer hover:bg-blue-100 transition-colors group"
                >
                    <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-800 uppercase">Chờ xuất hóa đơn</p>
                        <p className="text-xl font-black text-blue-900">{data.unissuedInvoiceCount || 0} <span className="text-xs font-medium">đơn hàng</span></p>
                        <p className="text-[10px] text-blue-700 font-bold">Cần xử lý ngay</p>
                    </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase">Nhân sự đang làm</p>
                        <p className="text-xl font-black text-emerald-900">{data.activeEmployees || 0} <span className="text-xs font-medium">nhân sự</span></p>
                        <p className="text-[10px] text-emerald-700 font-bold">Toàn hệ thống</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue by Branch Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                        <TrendingUp size={18} className="text-rose-600" />
                        Doanh thu theo Chi nhánh
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`} />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#be123c" radius={[6, 6, 0, 0]} barSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Pie Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                        <PieChartIcon size={18} className="text-violet-600" />
                        Cơ cấu Thanh toán
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {pieData.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Alerts & Branch Table */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Alerts List */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm text-amber-500">
                        <AlertCircle size={18} />
                        Cảnh báo (Min cao)
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {data.kpiAlerts?.length > 0 ? data.kpiAlerts.map((alert: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => setSelectedViolationBranch({ id: alert.branchId, name: alert.branchName })}
                                className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                            >
                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{alert.branchName}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] text-slate-500"><strong>{alert.count}/{alert.total}</strong> đơn ({alert.ratio}%)</p>
                                    <span className="text-[8px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase">High Risk</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs italic text-slate-400 py-10 text-center">Không có cảnh báo</p>
                        )}
                    </div>
                </div>

                {/* Detailed Branch Table */}
                <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                        <FileText size={18} className="text-blue-600" />
                        Chi tiết Doanh thu & Vận hành Chi nhánh
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Chi nhánh</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Doanh thu</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Đơn hàng</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tỷ lệ giá thấp</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Chờ khớp tiền</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Hóa đơn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.branchDetails?.map((branch: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 text-xs font-black text-slate-700">{branch.name}</td>
                                        <td className="py-3 text-xs font-black text-emerald-600 text-right">{formatCurrency(branch.revenue)}</td>
                                        <td className="py-3 text-xs font-bold text-slate-600 text-center">{branch.orderCount}</td>
                                        <td className="py-3 text-center">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${branch.lowPriceRatio > 15 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {branch.lowPriceRatio}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-center">
                                            {branch.unconfirmedOrders > 0 ? (
                                                <span
                                                    onClick={() => router.push(`/orders?tab=installment&paymentStatus=pending&branchId=${branch.id}&startDate=${startDate}&endDate=${endDate}`)}
                                                    className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 cursor-pointer hover:bg-amber-600 hover:text-white transition-colors"
                                                >
                                                    {branch.unconfirmedOrders} đơn
                                                </span>
                                            ) : (
                                                <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-3 text-center">
                                            {branch.pendingInvoices > 0 ? (
                                                <span
                                                    onClick={() => router.push(`/orders?tab=invoice&invoiceStatus=pending&branchId=${branch.id}&startDate=${startDate}&endDate=${endDate}`)}
                                                    className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
                                                >
                                                    {branch.pendingInvoices} đơn
                                                </span>
                                            ) : (
                                                <CheckCircle size={14} className="text-blue-500 mx-auto" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedViolationBranch && (
                <ViolatedOrdersDialog
                    branch={selectedViolationBranch}
                    userId={userId}
                    startDate={startDate}
                    endDate={endDate}
                    onClose={() => setSelectedViolationBranch(null)}
                />
            )}
        </div>
    );
}

function ManagerDashboard({ data, startDate, endDate }: { data: any, startDate: string, endDate: string }) {
    const branchRevenue = data.branchRevenue || 0;
    const milestones = data.milestones || []; // Dynamic milestones from backend
    const currentPercent = data.performance?.milestonePercent || 0;
    const isPenalty = data.performance?.isPenalty || false;
    const isClemency = data.performance?.isClemency || false;
    const lowPriceRatio = data.lowPriceStats?.ratio || 0;

    // Determine the max scale for the progress bar based on milestones
    const maxMilestone = milestones.length > 0 ? Math.max(...milestones.map((m: any) => m.percent)) : 100;
    const maxScale = Math.max(maxMilestone, 150);

    const targetAt100 = milestones.find((m: any) => m.percent === 100)?.targetRevenue || milestones[milestones.length - 1]?.targetRevenue || 1;
    const currentRevenuePercent = (branchRevenue / targetAt100) * 100;

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
                                <div className="text-rose-100 text-[10px] font-bold opacity-80">
                                    KPI: {currentRevenuePercent.toFixed(1)}%
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
                                style={{ width: `${Math.min((currentRevenuePercent / maxScale) * 100, 100)}%` }}
                            ></div>

                            {milestones.map((m: any, index: number) => {
                                const position = (m.percent / maxScale) * 100;
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

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tổng doanh thu CN</p>
                    <p className="text-lg font-black text-slate-800">{formatCurrency(branchRevenue)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><TrendingUp size={10} /> Tháng này</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tiền mặt đã thu</p>
                    <p className="text-lg font-black text-emerald-600">{formatCurrency(data.cashAmount || 0)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><DollarSign size={10} /> Cash</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Chuyển khoản / Thẻ</p>
                    <p className="text-lg font-black text-blue-600">{formatCurrency(data.transferAmount || 0)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><CreditCard size={10} /> Transfer & Card</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tổng đơn hàng</p>
                    <p className="text-lg font-black text-slate-800">{data.totalOrders || 0}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><ShoppingBag size={10} /> Đơn CN</p>
                </div>
            </div>

            {/* Alert Cards + Pie Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Chờ khớp tiền */}
                <div className={`p-4 rounded-2xl border ${(data.unconfirmedCount || 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className={(data.unconfirmedCount || 0) > 0 ? 'text-amber-500' : 'text-slate-400'} />
                        <p className="text-[10px] font-black text-slate-500 uppercase">Chờ khớp tiền</p>
                    </div>
                    <p className={`text-2xl font-black ${(data.unconfirmedCount || 0) > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {data.unconfirmedCount || 0} <span className="text-sm font-normal">đơn hàng</span>
                    </p>
                    {(data.unconfirmedCount || 0) > 0 && (
                        <p className="text-[10px] text-amber-500 font-bold mt-1">⚠️ Cần xác nhận trả góp</p>
                    )}
                </div>

                {/* Chờ xuất hóa đơn */}
                <div className={`p-4 rounded-2xl border ${(data.unissuedInvoiceCount || 0) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className={(data.unissuedInvoiceCount || 0) > 0 ? 'text-blue-500' : 'text-slate-400'} />
                        <p className="text-[10px] font-black text-slate-500 uppercase">Chờ xuất hóa đơn</p>
                    </div>
                    <p className={`text-2xl font-black ${(data.unissuedInvoiceCount || 0) > 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                        {data.unissuedInvoiceCount || 0} <span className="text-sm font-normal">đơn hàng</span>
                    </p>
                    {(data.unissuedInvoiceCount || 0) > 0 && (
                        <p className="text-[10px] text-blue-500 font-bold mt-1">📋 Cần xử lý ngay</p>
                    )}
                </div>

                {/* Nhân sự đang làm */}
                <div className="p-4 rounded-2xl border bg-white border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={16} className="text-emerald-500" />
                        <p className="text-[10px] font-black text-slate-500 uppercase">Nhân sự đang làm</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">
                        {data.activeEmployees || 0} <span className="text-sm font-normal text-slate-500">nhân sự</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Chi nhánh</p>
                </div>
            </div>

            {/* Cơ cấu Thanh toán (Pie Chart) */}
            {data.paymentMethodBreakdown && data.paymentMethodBreakdown.some((p: any) => p.amount > 0) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <PieChartIcon size={14} className="text-violet-500" />
                        Cơ cấu Thanh toán Chi nhánh
                    </h4>
                    <div className="flex items-center gap-6">
                        <div className="h-[160px] flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.paymentMethodBreakdown.filter((p: any) => p.amount > 0).map((p: any) => ({
                                            name: p.method === 'CASH' ? 'Tiền mặt' :
                                                p.method === 'TRANSFER_COMPANY' ? 'CK Công ty' :
                                                    p.method === 'TRANSFER_PERSONAL' ? 'CK Cá nhân' :
                                                        p.method === 'CARD' ? 'Quẹt thẻ' : 'Trả góp',
                                            value: p.amount
                                        }))}
                                        cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                        paddingAngle={4} dataKey="value"
                                    >
                                        {data.paymentMethodBreakdown.filter((p: any) => p.amount > 0).map((_: any, index: number) => (
                                            <Cell key={index} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {data.paymentMethodBreakdown.filter((p: any) => p.amount > 0).map((p: any, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5] }} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        {p.method === 'CASH' ? 'Tiền mặt' : p.method === 'TRANSFER_COMPANY' ? 'CK Công ty' : p.method === 'TRANSFER_PERSONAL' ? 'CK Cá nhân' : p.method === 'CARD' ? 'Quẹt thẻ' : 'Trả góp'}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-700 ml-auto">{formatCurrency(p.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

function SaleDashboard({ data, startDate, endDate }: { data: any, startDate: string, endDate: string }) {
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

function TelesaleDashboard({ data, startDate, endDate }: { data: any, startDate: string, endDate: string }) {
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

function MarketingDashboard({ data, startDate, endDate }: { data: any, startDate: string, endDate: string }) {
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

function ViolatedOrdersDialog({ branch, onClose, userId, startDate, endDate }: any) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchViolated = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${apiUrl}/dashboard/violated-orders?userId=${userId}&branchId=${branch.id}&startDate=${startDate}&endDate=${endDate}`);
                const result = await res.json();
                setOrders(Array.isArray(result) ? result : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchViolated();
    }, [branch.id, userId, startDate, endDate]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Đơn hàng vi phạm giá Min</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Chi nhánh: {branch.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600"></div>
                        </div>
                    ) : (
                        <>
                            {orders.map((order: any) => (
                                <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-rose-600">#{order.id.slice(0, 8)}</p>
                                            <p className="text-sm font-bold text-slate-800">{order.customerName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-700">{formatCurrency(order.totalAmount)}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-2">
                                        {order.violatedItems.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-slate-600">{item.productName} (x{item.quantity})</span>
                                                <div className="flex gap-3 items-center">
                                                    <span className="text-slate-400 line-through">{formatCurrency(item.minPrice)}</span>
                                                    <span className="font-black text-rose-600">{formatCurrency(item.unitPrice)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-2 italic text-right">Nhân viên: <strong>{order.employeeName}</strong></p>
                                </div>
                            ))}
                            {orders.length === 0 && <p className="text-center py-10 text-sm text-slate-400 italic">Không có dữ liệu</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
