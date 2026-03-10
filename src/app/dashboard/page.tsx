"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    LogOut, TrendingUp, Users, ShoppingBag, Truck,
    CreditCard, Calendar, ArrowRight, DollarSign, Info, Clock,
    FileText, CheckCircle, AlertCircle, Wallet, LucideIcon,
    PieChart as PieChartIcon, X,
    ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight,
    MapPin, Trophy
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils'; // Ensure this exists or reimplement locally if simpler
import KPIPeriodTrend from '@/components/dashboard/KPIPeriodTrend';

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

    // Branch filter state
    const [branchId, setBranchId] = useState<string>('');
    const [branches, setBranches] = useState<any[]>([]);

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch branches for global roles
        const isGlobal = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'ADMIN'].includes(parsedUser.role?.code);
        if (isGlobal) {
            fetchBranches();
        }

        // Set initial branchId for MANAGERS
        if (parsedUser.role?.code === 'MANAGER' && parsedUser.employee?.branchId) {
            setBranchId(parsedUser.employee.branchId);
        }

        // Sử dụng debounce để tránh load liên tục khi người dùng đổi tháng ở date picker
        const timer = setTimeout(() => {
            fetchDashboardData(parsedUser.id, startDate, endDate, branchId);
        }, 500); // Đợi 500ms sau khi ngừng thao tác mới load

        return () => clearTimeout(timer);
    }, [startDate, endDate, branchId]);

    const fetchBranches = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/branches`);
            const result = await res.json();
            setBranches(result);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const fetchDashboardData = async (userId: string, start: string, end: string, branch: string) => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const url = new URL(`${apiUrl}/dashboard`);
            url.searchParams.append('userId', userId);
            url.searchParams.append('startDate', start);
            url.searchParams.append('endDate', end);
            if (branch && branch !== '') {
                url.searchParams.append('branchId', branch);
            }
            const res = await fetch(url.toString());
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
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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

    if (loading && !data) return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );

    if (!user || !data) return null;

    return (
        <div className="bg-transparent space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 md:gap-4 bg-white p-3 md:p-4 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Thống kê hoạt động</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {formatDate(startDate)} - {formatDate(endDate)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
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
                                className="px-2 md:px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all hover:bg-white hover:shadow-sm text-slate-500 hover:text-rose-600 cursor-pointer"
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

                    {/* Branch Filter - Only visible for Global/Accounting roles */}
                    {['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'ADMIN'].includes(user?.role?.code) && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1 pl-3 rounded-2xl border border-slate-100 group focus-within:border-rose-200 transition-colors h-10 w-full sm:w-auto">
                            <MapPin size={14} className="text-slate-400 group-focus-within:text-rose-500" />
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="bg-transparent border-none text-[10px] md:text-[11px] font-black text-slate-700 outline-none pr-2 py-1.5 cursor-pointer max-w-[120px] sm:max-w-[150px] truncate uppercase"
                            >
                                <option value="">Tất cả chi nhánh</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setQuickRange('month')}
                        className="p-2.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 group cursor-pointer"
                        title="Reset về tháng này"
                    >
                        <Clock size={18} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto space-y-6">
                {/* Role Based Content */}
                {['DIRECTOR', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'ADMIN'].includes(data.role) && (
                    <DirectorDashboard
                        data={data}
                        userId={user.id}
                        startDate={startDate}
                        endDate={endDate}
                        branchId={branchId}
                    />
                )}
                {data.role === 'MANAGER' && <ManagerDashboard data={data} startDate={startDate} endDate={endDate} branchId={branchId} />}
                {data.role === 'SALE' && <SaleDashboard data={data} startDate={startDate} endDate={endDate} branchId={branchId} />}
                {data.role === 'TELESALE' && <TelesaleDashboard data={data} startDate={startDate} endDate={endDate} />}
                {data.role === 'MARKETING' && <MarketingDashboard data={data} startDate={startDate} endDate={endDate} />}
                {(data.role === 'DRIVER' || data.role === 'DELIVERY_STAFF') && <DriverDashboard data={data} startDate={startDate} endDate={endDate} />}
            </main>
        </div>
    );
}

// ------------------- Branch Revenue Chart with Zoom -------------------

function BranchRevenueChart({ chartData }: { chartData: any[] }) {
    const total = chartData.length;
    const [visibleCount, setVisibleCount] = useState(Math.min(total, 8));
    const [startIndex, setStartIndex] = useState(0);

    // Reset when data changes
    useEffect(() => {
        setVisibleCount(Math.min(total, 8));
        setStartIndex(0);
    }, [total]);

    const canZoomIn = visibleCount > 3;
    const canZoomOut = visibleCount < total;
    const isZoomed = visibleCount < total;

    const visibleData = chartData.slice(startIndex, startIndex + visibleCount);
    const canGoLeft = startIndex > 0;
    const canGoRight = startIndex + visibleCount < total;

    const handleZoomIn = () => {
        const newCount = Math.max(3, visibleCount - 2);
        setVisibleCount(newCount);
        // Keep centered
        const maxStart = Math.max(0, total - newCount);
        setStartIndex(Math.min(startIndex, maxStart));
    };

    const handleZoomOut = () => {
        const newCount = Math.min(total, visibleCount + 2);
        setVisibleCount(newCount);
        const maxStart = Math.max(0, total - newCount);
        setStartIndex(Math.min(startIndex, maxStart));
    };

    const handleReset = () => {
        setVisibleCount(total);
        setStartIndex(0);
    };

    const handleLeft = () => {
        setStartIndex(Math.max(0, startIndex - 1));
    };

    const handleRight = () => {
        setStartIndex(Math.min(total - visibleCount, startIndex + 1));
    };

    // Dynamic bar size based on visible count
    const barSize = visibleCount <= 4 ? 50 : visibleCount <= 6 ? 40 : visibleCount <= 10 ? 30 : 22;

    return (
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm whitespace-nowrap">
                    <TrendingUp size={18} className="text-rose-600 flex-shrink-0" />
                    <span className="hidden sm:inline">Doanh thu theo Chi nhánh</span>
                    <span className="sm:hidden">DT Chi nhánh</span>
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Zoom info badge */}
                    {isZoomed && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-1 rounded-lg mr-1 whitespace-nowrap">
                            {startIndex + 1}–{Math.min(startIndex + visibleCount, total)}/{total}
                        </span>
                    )}

                    {/* Left navigation */}
                    {isZoomed && (
                        <button
                            onClick={handleLeft}
                            disabled={!canGoLeft}
                            className={`p-1.5 rounded-lg transition-all ${canGoLeft
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                            title="Xem chi nhánh trước"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    )}

                    {/* Right navigation */}
                    {isZoomed && (
                        <button
                            onClick={handleRight}
                            disabled={!canGoRight}
                            className={`p-1.5 rounded-lg transition-all ${canGoRight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                            title="Xem chi nhánh tiếp"
                        >
                            <ChevronRight size={14} />
                        </button>
                    )}

                    {isZoomed && <div className="w-px h-5 bg-slate-200 mx-0.5"></div>}

                    {/* Zoom In */}
                    <button
                        onClick={handleZoomIn}
                        disabled={!canZoomIn}
                        className={`p-1.5 rounded-lg transition-all ${canZoomIn
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 cursor-pointer'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                        title="Phóng to (xem ít chi nhánh hơn)"
                    >
                        <ZoomIn size={14} />
                    </button>

                    {/* Zoom Out */}
                    <button
                        onClick={handleZoomOut}
                        disabled={!canZoomOut}
                        className={`p-1.5 rounded-lg transition-all ${canZoomOut
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                        title="Thu nhỏ (xem nhiều chi nhánh hơn)"
                    >
                        <ZoomOut size={14} />
                    </button>

                    {/* Reset */}
                    {isZoomed && (
                        <button
                            onClick={handleReset}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                            title="Hiển thị tất cả chi nhánh"
                        >
                            <Maximize2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            fontSize={visibleCount > 8 ? 8 : 10}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            angle={visibleCount > 6 ? -35 : 0}
                            textAnchor={visibleCount > 6 ? "end" : "middle"}
                            height={visibleCount > 6 ? 60 : 30}
                            dy={visibleCount > 6 ? 5 : 0}
                            tickFormatter={(val: string) => val.length > 10 ? val.slice(0, 10) + '…' : val}
                        />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`} />
                        <Tooltip
                            labelFormatter={(label) => `Chi nhánh: ${label}`}
                            formatter={(value: any, name: any) => [formatCurrency(value), name]}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar name="Doanh số bán" dataKey="salesRevenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={barSize} />
                        <Bar name="Đã hoàn thành" dataKey="revenue" fill="#be123c" radius={[6, 6, 0, 0]} barSize={barSize} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Zoom hint */}
            {total > 6 && !isZoomed && (
                <p className="text-[9px] text-slate-400 text-center mt-2 font-bold uppercase tracking-wider">
                    💡 Dùng nút <ZoomIn size={10} className="inline" /> để phóng to xem chi tiết từng chi nhánh
                </p>
            )}
        </div>
    );
}

// ------------------- Role Components -------------------

function DirectorDashboard({ data, userId, startDate, endDate, branchId }: { data: any, userId: string, startDate: string, endDate: string, branchId: string }) {
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
        <>
            <div className="space-y-6 text-left">
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <DollarSign size={18} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Doanh số hoàn thành</p>
                        </div>
                        <p className="text-lg font-black text-slate-800">{formatCurrency(data.totalRevenue)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{data.orderCount || 0} đơn đã xác nhận</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <ShoppingBag size={18} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Doanh số bán</p>
                        </div>
                        <p className="text-lg font-black text-blue-700">{formatCurrency(data.salesRevenue || 0)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{data.salesOrderCount || 0} đơn trong kỳ</p>
                    </div>
                    <div
                        onClick={() => router.push(`/orders?paymentStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                        className={`p-3 rounded-2xl border shadow-sm transition-all cursor-pointer group ${(data.debtStats?.remainingAmount || data.pendingRevenueTotal || 0) > 0 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:shadow-md' : 'bg-white border-slate-100'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${(data.debtStats?.remainingAmount || data.pendingRevenueTotal || 0) > 0 ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-200' : 'bg-slate-50 text-slate-400'}`}>
                                    <Clock size={18} />
                                </div>
                                <p className={`text-[10px] font-black uppercase ${(data.debtStats?.remainingAmount || data.pendingRevenueTotal || 0) > 0 ? 'text-amber-700' : 'text-slate-400'}`}>Khách còn nợ</p>
                            </div>
                            <ArrowRight size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className={`text-lg font-black ${(data.debtStats?.remainingAmount || data.pendingRevenueTotal || 0) > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                            {formatCurrency(data.debtStats?.totalAmount || data.debtStats?.remainingAmount || data.pendingRevenueTotal || 0)}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-1.5 border-t border-amber-100/50 pt-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-400 uppercase">Số đơn nợ:</span>
                                <span className="text-slate-700">{data.debtStats?.count || (data.unconfirmedCount + data.pendingInstallmentCount) || 0} đơn</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-400 uppercase">Đã trả:</span>
                                <span className="text-emerald-600 font-black">{formatCurrency(data.debtStats?.paidAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-400 uppercase">Còn thiếu:</span>
                                <span className="text-rose-600 font-black">{formatCurrency(data.debtStats?.remainingAmount || data.pendingRevenueTotal || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <StatCard
                        title="Tổng đơn hàng"
                        value={String(data.totalOrders || 0)}
                        icon={<ShoppingBag size={20} className="text-rose-600" />}
                    />
                </div>

                {/* Financial Alerts & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        onClick={() => router.push(`/orders?paymentStatus=pending&excludeInstallment=true&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                        className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center text-amber-600">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-800 uppercase">Chờ khớp tiền</p>
                            <p className="text-lg font-black text-amber-900">{data.unconfirmedCount || 0} <span className="text-[10px] font-medium">đơn</span></p>
                            <p className="text-[9px] text-amber-700 font-bold">~ {formatCurrency(data.unconfirmedRevenue || 0)}</p>
                        </div>
                    </div>

                    <div
                        onClick={() => router.push(`/orders?tab=installment&paymentStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                        className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center text-indigo-600">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-800 uppercase">Chờ duyệt trả góp</p>
                            <p className="text-lg font-black text-indigo-900">{data.pendingInstallmentCount || 0} <span className="text-[10px] font-medium">đơn</span></p>
                            <p className="text-[9px] text-indigo-700 font-bold">~ {formatCurrency(data.pendingInstallmentRevenue || 0)}</p>
                        </div>
                    </div>

                    <div
                        onClick={() => router.push(`/orders?tab=invoice&invoiceStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                        className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-800 uppercase">Chờ xuất hóa đơn</p>
                            <p className="text-lg font-black text-blue-900">{data.unissuedInvoiceCount || 0} <span className="text-[10px] font-medium">đơn</span></p>
                            <p className="text-[9px] text-blue-700 font-bold">Cần xử lý ngay</p>
                        </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-800 uppercase">Nhân sự đang làm</p>
                            <p className="text-lg font-black text-emerald-900">{data.activeEmployees || 0} <span className="text-[10px] font-medium">nhân sự</span></p>
                            <p className="text-[9px] text-emerald-700 font-bold">Toàn hệ thống</p>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue by Branch Bar Chart with Zoom */}
                    <BranchRevenueChart chartData={chartData} />


                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                            <PieChartIcon size={18} className="text-violet-600" />
                            Cơ cấu Thanh toán
                        </h3>
                        <div className="flex flex-col xl:flex-row items-center gap-6">
                            <div className="h-[200px] w-full xl:w-1/2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full xl:w-1/2 space-y-2.5">
                                {pieData.map((p: any, i: number) => {
                                    const total = pieData.reduce((acc: number, curr: any) => acc + curr.value, 0);
                                    const percent = total > 0 ? (p.value / total) * 100 : 0;
                                    return (
                                        <div key={i} className="flex flex-col gap-0.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase truncate">{p.name}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-800">{percent.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mr-2">
                                                    <div
                                                        className="h-full transition-all duration-1000"
                                                        style={{ width: `${percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{formatCurrency(p.value)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {pieData.length === 0 && (
                                    <p className="text-center py-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Chưa có dữ liệu</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Trend & Best Sellers & Top Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                <TrendingUp size={16} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Xu hướng doanh số hệ thống</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Biến động theo ngày</p>
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.revenueTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
                                    <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`} />
                                    <Tooltip
                                        labelFormatter={(label) => {
                                            if (!label) return '';
                                            const parts = label.split('-');
                                            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                            return label;
                                        }}
                                        formatter={(value: any, name: any) => [formatCurrency(value), name === 'salesRevenue' ? "Doanh số bán" : "Doanh số HT"]}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line name="salesRevenue" type="monotone" dataKey="salesRevenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                    <Line name="revenue" type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} dot={{ r: 2.5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="lg:col-span-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <ShoppingBag size={16} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Top Sản Phẩm</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Bán chạy nhất hệ thống</p>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            {data.bestSellers?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-transparent hover:border-amber-100 transition-colors">
                                    <div className="flex items-start gap-2 min-w-0 flex-1 mr-2">
                                        <span className="shrink-0 w-5 h-5 mt-0.5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">{idx + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-black text-slate-700 leading-tight mb-0.5" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.name}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase">SL: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-rose-600 shrink-0 mt-0.5">{formatCurrency(item.revenue)}</p>
                                </div>
                            ))}
                            {(!data.bestSellers || data.bestSellers.length === 0) && (
                                <p className="text-center py-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Chưa có dữ liệu</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <Users size={16} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Top Nhân Sự</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Doanh số cao nhất</p>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            {data.topEmployees?.map((emp: any, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => router.push(`/orders?employeeId=${emp.id}&startDate=${startDate}&endDate=${endDate}`)}
                                    className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-start gap-2 min-w-0 flex-1 mr-2">
                                            <span className={`shrink-0 w-5 h-5 mt-0.5 rounded-md flex items-center justify-center text-[9px] font-black ${idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : idx === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : idx === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-white border border-slate-200 text-slate-500'}`}>{idx + 1}</span>
                                            <p className="text-[11px] font-black text-slate-700 leading-tight" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{emp.name}</p>
                                        </div>
                                        <p className="shrink-0 text-[11px] font-black text-emerald-600 mt-0.5">{formatCurrency(emp.revenue)}</p>
                                    </div>
                                    <div className="flex items-center justify-between pl-7 gap-2">
                                        <p className="text-[8px] text-slate-400 font-bold uppercase truncate shrink-0 max-w-[50%]">{emp.position}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase truncate flex-1 text-right">{emp.branchName}</p>
                                    </div>
                                </div>
                            ))}
                            {(!data.topEmployees || data.topEmployees.length === 0) && (
                                <p className="text-center py-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Chưa có dữ liệu</p>
                            )}
                        </div>
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
                                <tr className="border-b border-slate-50 whitespace-nowrap">
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">Chi nhánh</th>
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Doanh số bán</th>
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Doanh số HT</th>
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Đơn bán</th>
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Đơn hoàn thành</th>
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tỷ lệ giá thấp</th>
                                    <th className="pb-3 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Chờ khớp</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Hóa đơn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.branchDetails?.map((branch: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                                        <td className="py-3 pr-6 text-xs font-black text-slate-700 text-left">{branch.name}</td>
                                        <td className="py-3 pr-6 text-xs font-bold text-blue-600 text-right">{formatCurrency(branch.salesRevenue)}</td>
                                        <td className="py-3 pr-6 text-xs font-black text-emerald-600 text-right">{formatCurrency(branch.revenue)}</td>
                                        <td className="py-3 pr-6 text-xs font-bold text-slate-500 text-center">{branch.salesOrderCount}</td>
                                        <td className="py-3 pr-6 text-xs font-black text-emerald-600 text-center">{branch.completedOrderCount}</td>
                                        <td className="py-3 pr-6 text-center">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${branch.lowPriceRatio > 15 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {branch.lowPriceRatio}%
                                            </span>
                                        </td>
                                        <td className="py-3 pr-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {branch.unconfirmedOrders > 0 && (
                                                    <span
                                                        onClick={() => router.push(`/orders?paymentStatus=pending&excludeInstallment=true&branchId=${branch.id}&startDate=${startDate}&endDate=${endDate}`)}
                                                        className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 cursor-pointer hover:bg-amber-600 hover:text-white transition-colors"
                                                        title="Chờ khớp tiền thường"
                                                    >
                                                        {branch.unconfirmedOrders} CK
                                                    </span>
                                                )}
                                                {branch.pendingInstallmentOrders > 0 && (
                                                    <span
                                                        onClick={() => router.push(`/orders?tab=installment&paymentStatus=pending&branchId=${branch.id}&startDate=${startDate}&endDate=${endDate}`)}
                                                        className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors"
                                                        title="Chờ duyệt trả góp"
                                                    >
                                                        {branch.pendingInstallmentOrders} TG
                                                    </span>
                                                )}
                                                {branch.unconfirmedOrders === 0 && branch.pendingInstallmentOrders === 0 && (
                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                )}
                                            </div>
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
        </>
    );
}

function ManagerDashboard({ data, startDate, endDate, branchId }: { data: any, startDate: string, endDate: string, branchId: string }) {
    const router = useRouter();
    const branchRevenue = data.branchRevenue || 0;
    const branchSalesRevenue = data.branchSalesRevenue || 0;
    const branchPendingRevenue = data.branchPendingRevenue || 0;
    const milestones = data.milestones || []; // Dynamic milestones from backend
    const currentPercent = data.performance?.milestonePercent || 0;
    const isPenalty = data.performance?.isPenalty || false;
    const isClemency = data.performance?.isClemency || false;
    const lowPriceRatio = data.lowPriceStats?.ratio || 0;

    // Determine the max scale for the progress bar based on revenue
    const maxMilestoneRevenue = milestones.length > 0 ? Math.max(...milestones.map((m: any) => Number(m.targetRevenue))) : 1;
    // Buffer to ensure the last dot isn't cut off and progress can exceed last milestone
    const maxRevenueScale = Math.max(maxMilestoneRevenue * 1.1, branchRevenue * 1.05);

    const nextMilestone = milestones.find((m: any) => Number(m.targetRevenue) > branchRevenue) || milestones[milestones.length - 1];
    const missingAmount = nextMilestone ? Math.max(0, Number(nextMilestone.targetRevenue) - branchRevenue) : 0;

    const ranking = data.ranking?.branch;
    const branchTopStaff = data.ranking?.branchTopStaff;
    const serverTopStaff = data.ranking?.serverTopStaff;
    const getFullAvatarUrl = (path: string | null | undefined) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    return (
        <div className="space-y-4">
            {/* Branch Position & Recognition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Branch Position */}
                <div className="p-4 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Trophy size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Trophy size={12} className="text-indigo-300" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Vị thế chi nhánh</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black">Hạng {ranking?.completed?.rank || '—'}</span>
                            <span className="text-indigo-300 font-bold text-xs">/ {ranking?.completed?.totalCount || '—'}</span>
                        </div>
                        <p className="text-[8px] mt-0.5 text-indigo-200 font-medium uppercase tracking-tight opacity-70">toàn hệ thống</p>
                        <div className="mt-3 pt-3 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] text-indigo-100 italic leading-tight">
                                "{data.branchName} đang đứng thứ {ranking?.completed?.rank || '—'} hệ thống."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Performer - Server Rankings */}
                <div className="relative group overflow-hidden bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trophy size={40} className="text-blue-600" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-100">
                                <Trophy size={16} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top Sales Server</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                            {/* Top Sales Server Employee */}
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md overflow-hidden border-2 border-white">
                                        <UserAvatar
                                            src={getFullAvatarUrl(serverTopStaff?.sales?.avatarUrl)}
                                            fallbackIcon={<Users size={16} />}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded-md bg-blue-600 shadow-sm flex items-center justify-center border border-white">
                                        <span className="text-[7px] text-white font-black">Hạng {serverTopStaff?.sales?.rank || '—'}</span>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-black text-slate-800 truncate mb-0">
                                        {serverTopStaff?.sales?.name || (serverTopStaff?.sales?.id ? `NV #${serverTopStaff.sales.id.slice(-4)}` : 'Đang cập nhật')}
                                    </h4>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-blue-700 leading-none">
                                            {formatCurrency(serverTopStaff?.sales?.amount || 0)}
                                        </p>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">Top Doanh số bán</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Completed Server Employee */}
                            <div className="flex items-center gap-3 lg:pt-0 lg:border-t-0 pt-1 border-t border-slate-50">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md overflow-hidden border-2 border-white">
                                        <UserAvatar
                                            src={getFullAvatarUrl(serverTopStaff?.completed?.avatarUrl)}
                                            fallbackIcon={<Users size={16} />}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded-md bg-emerald-600 shadow-sm flex items-center justify-center border border-white text-white">
                                        <span className="text-[7px] font-black">Hạng {serverTopStaff?.completed?.rank || '—'}</span>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-black text-slate-800 truncate mb-0.5">
                                        {serverTopStaff?.completed?.name || (serverTopStaff?.completed?.id ? `NV #${serverTopStaff.completed.id.slice(-4)}` : 'Đang cập nhật')}
                                    </h4>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-emerald-700 leading-none">
                                            {formatCurrency(serverTopStaff?.completed?.amount || 0)}
                                        </p>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">Top Hoàn thành</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performer - Branch Rankings */}
                <div className="relative group overflow-hidden bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MapPin size={40} className="text-rose-600" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 transition-colors group-hover:bg-rose-100">
                                <Users size={16} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top Sales Chi nhánh</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                            {/* Top Sales Branch Employee */}
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md overflow-hidden border-2 border-white">
                                        <UserAvatar
                                            src={getFullAvatarUrl(branchTopStaff?.sales?.avatarUrl)}
                                            fallbackIcon={<Users size={16} />}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-rose-600 shadow-lg flex items-center justify-center border-2 border-white">
                                        <Trophy size={8} className="text-white" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-black text-slate-800 truncate mb-0.5">
                                        {branchTopStaff?.sales?.name || (branchTopStaff?.sales?.id ? `NV #${branchTopStaff.sales.id.slice(-4)}` : 'Đang cập nhật')}
                                    </h4>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-rose-700 leading-none">
                                            {formatCurrency(branchTopStaff?.sales?.amount || 0)}
                                        </p>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">Top Doanh số bán</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Completed Branch Employee */}
                            <div className="flex items-center gap-3 lg:pt-0 lg:border-t-0 pt-1 border-t border-slate-50">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md overflow-hidden border-2 border-white">
                                        <UserAvatar
                                            src={getFullAvatarUrl(branchTopStaff?.completed?.avatarUrl)}
                                            fallbackIcon={<Users size={16} />}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-amber-600 shadow-lg flex items-center justify-center border-2 border-white text-white">
                                        <CheckCircle size={8} className="text-white" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-black text-slate-800 truncate mb-0.5">
                                        {branchTopStaff?.completed?.name || (branchTopStaff?.completed?.id ? `NV #${branchTopStaff.completed.id.slice(-4)}` : 'Đang cập nhật')}
                                    </h4>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-amber-700 leading-none">
                                            {formatCurrency(branchTopStaff?.completed?.amount || 0)}
                                        </p>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">Top Hoàn thành</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-rose-100 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <DollarSign size={18} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Doanh số thực</p>
                    </div>
                    <p className="text-lg font-black text-slate-800">{formatCurrency(branchRevenue)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Đã xác nhận thanh toán</p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <ShoppingBag size={18} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Doanh số bán</p>
                    </div>
                    <p className="text-lg font-black text-blue-600">{formatCurrency(branchSalesRevenue)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Tổng giá trị bán hàng</p>
                </div>

                <div
                    onClick={() => router.push(`/orders?paymentStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                    className={`p-3 rounded-2xl border shadow-sm transition-all cursor-pointer group ${(data.debtStats?.remainingAmount || branchPendingRevenue) > 0 ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:shadow-md' : 'bg-white border-slate-100'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${(data.debtStats?.remainingAmount || branchPendingRevenue) > 0 ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-200' : 'bg-slate-50 text-slate-400'}`}>
                                <Clock size={18} />
                            </div>
                            <p className={`text-[10px] font-black uppercase ${(data.debtStats?.remainingAmount || branchPendingRevenue) > 0 ? 'text-amber-700' : 'text-slate-400'}`}>Khách còn nợ</p>
                        </div>
                        <ArrowRight size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`text-lg font-black ${(data.debtStats?.remainingAmount || branchPendingRevenue) > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {formatCurrency(data.debtStats?.totalAmount || data.debtStats?.remainingAmount || branchPendingRevenue)}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1.5 border-t border-amber-100/50 pt-1.5">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-400 uppercase">Số đơn nợ:</span>
                            <span className="text-slate-700">{data.debtStats?.count || (data.unconfirmedCount + data.pendingInstallmentCount) || 0} đơn</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-400 uppercase">Đã trả:</span>
                            <span className="text-emerald-600 font-black">{formatCurrency(data.debtStats?.paidAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-400 uppercase">Còn thiếu:</span>
                            <span className="text-rose-600 font-black">{formatCurrency(data.debtStats?.remainingAmount || branchPendingRevenue)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600">
                            <TrendingUp size={18} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Tỷ lệ chốt</p>
                    </div>
                    <p className="text-lg font-black text-slate-800">{lowPriceRatio}%</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Tỷ lệ sản phẩm Min cao</p>
                </div>
            </div>

            {/* Dark Red KPI Card */}
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-4 md:p-5 text-white shadow-xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-3">
                        <div>
                            <p className="text-rose-100 text-[10px] font-bold uppercase tracking-wider mb-0.5">Doanh thu hiện tại</p>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-lg leading-tight">
                                {formatCurrency(branchRevenue)}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="text-rose-200 text-xs bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                    Mốc hiện tại: {formatCurrency(branchRevenue)}
                                </div>
                                {isPenalty && (
                                    <div className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-sm border flex items-center gap-1 ${isClemency
                                        ? 'text-emerald-300 bg-emerald-900/30 border-emerald-500/30'
                                        : 'text-amber-300 bg-amber-900/30 border-amber-500/30 animate-pulse'
                                        }`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        {isClemency ? 'Đã được khoan hồng' : `Tỷ lệ giá thấp: ${lowPriceRatio.toFixed(1)}%`}
                                    </div>
                                )}
                            </div>
                            {/* Doanh số bán CN & chờ thanh toán */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                    <span className="text-rose-200">DS Bán CN:</span> <span className="text-white font-bold">{formatCurrency(branchSalesRevenue)}</span>
                                </div>
                                {branchPendingRevenue > 0 && (
                                    <div className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                                        <span className="text-amber-200">⚠️ Chờ TT:</span> <span className="text-amber-300 font-bold">{formatCurrency(branchPendingRevenue)}</span>
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
                                    <p className="text-lg font-bold text-white leading-none">{formatCurrency(nextMilestone?.targetRevenue || 0)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Progress Bar (Linear Revenue Scale) */}
                    <div className="space-y-3">
                        <div className="relative h-10 mt-6 select-none">
                            <div className="absolute top-1/2 left-0 w-full h-2 bg-black/30 rounded-full -translate-y-1/2"></div>
                            <div
                                className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full -translate-y-1/2 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-1000"
                                style={{ width: `${Math.min((branchRevenue / maxRevenueScale) * 100, 100)}%` }}
                            ></div>

                            {milestones.filter((m: any) => Number(m.targetRevenue) > 0).map((m: any, index: number) => {
                                const position = (Number(m.targetRevenue) / maxRevenueScale) * 100;
                                const reached = branchRevenue >= Number(m.targetRevenue);
                                const isNext = Number(m.targetRevenue) === Number(nextMilestone?.targetRevenue);

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

                                        {/* Removed % label under dot to avoid clutter */}

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
                                        Mục tiêu: <strong className="text-white">{formatCurrency(nextMilestone?.targetRevenue || 0)}</strong>
                                    </span>
                                    <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">
                                        Còn thiếu: {formatCurrency(missingAmount)}
                                    </span>
                                </div>
                                {isPenalty && !isClemency && (
                                    <p className="text-[10px] text-amber-300 italic pl-4">
                                        ⚠️ Đang bị phạt (Thưởng mốc x70%). Đạt mốc {formatCurrency((nextMilestone?.targetRevenue || 0) * 1.1)} để được khoan hồng!
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Chờ khớp tiền */}
                <div
                    onClick={() => router.push(`/orders?paymentStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                    className={`p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${(data.unconfirmedCount || 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'} shadow-sm`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className={(data.unconfirmedCount || 0) > 0 ? 'text-amber-500' : 'text-slate-400'} />
                        <p className="text-[10px] font-black text-slate-500 uppercase">Chờ khớp tiền</p>
                    </div>
                    <p className={`text-2xl font-black ${(data.unconfirmedCount || 0) > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {data.unconfirmedCount || 0} <span className="text-sm font-normal">đơn hàng</span>
                    </p>
                    {(data.unconfirmedCount || 0) > 0 && (
                        <p className="text-[10px] text-amber-500 font-bold mt-1">⚠️ Cần xác nhận thanh toán</p>
                    )}
                </div>

                {/* Chờ duyệt trả góp */}
                <div
                    onClick={() => router.push(`/orders?tab=installment&paymentStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                    className={`p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${(data.pendingInstallmentCount || 0) > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'} shadow-sm`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} className={(data.pendingInstallmentCount || 0) > 0 ? 'text-indigo-500' : 'text-slate-400'} />
                        <p className="text-[10px] font-black text-slate-500 uppercase">Chờ duyệt trả góp</p>
                    </div>
                    <p className={`text-2xl font-black ${(data.pendingInstallmentCount || 0) > 0 ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {data.pendingInstallmentCount || 0} <span className="text-sm font-normal">đơn hàng</span>
                    </p>
                    {(data.pendingInstallmentCount || 0) > 0 && (
                        <p className="text-[10px] text-indigo-500 font-bold mt-1">⚠️ Cần xác nhận trả góp</p>
                    )}
                </div>

                {/* Chờ xuất hóa đơn */}
                <div
                    onClick={() => router.push(`/orders?tab=invoice&invoiceStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                    className={`p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${(data.unissuedInvoiceCount || 0) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'} shadow-sm`}
                >
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

            {/* Revenue Trend & Best Sellers (Branch Specific) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Xu hướng doanh số chi nhánh</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Biến động theo ngày</p>
                        </div>
                    </div>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.revenueTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
                                <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`} />
                                <Tooltip
                                    labelFormatter={(label) => {
                                        if (!label) return '';
                                        const parts = label.split('-');
                                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                        return label;
                                    }}
                                    formatter={(value: any, name: any) => [formatCurrency(value), name === 'salesRevenue' ? "Doanh số bán" : "Doanh số HT"]}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line name="salesRevenue" type="monotone" dataKey="salesRevenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                <Line name="revenue" type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} dot={{ r: 2.5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <ShoppingBag size={16} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Top Sản Phẩm CN</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Bán chạy nhất chi nhánh</p>
                        </div>
                    </div>
                    <div className="space-y-2 flex-1">
                        {data.bestSellers?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-transparent hover:border-amber-100 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">{idx + 1}</span>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-700 truncate max-w-[120px]">{item.name}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase">SL: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="text-[11px] font-black text-rose-600">{formatCurrency(item.revenue)}</p>
                            </div>
                        ))}
                        {(!data.bestSellers || data.bestSellers.length === 0) && (
                            <p className="text-center py-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Cơ cấu Thanh toán (Pie Chart) */}
            {data.paymentMethodBreakdown && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <PieChartIcon size={14} className="text-violet-500" />
                        Cơ cấu Thanh toán Chi nhánh
                    </h4>
                    <div className="flex flex-col xl:flex-row items-center gap-6">
                        <div className="h-[180px] w-full xl:w-1/2">
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
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full xl:w-1/2 space-y-2.5">
                            {data.paymentMethodBreakdown.filter((p: any) => p.amount > 0).map((p: any, i: number) => {
                                const total = data.paymentMethodBreakdown.reduce((acc: number, curr: any) => acc + curr.amount, 0);
                                const percent = total > 0 ? (p.amount / total) * 100 : 0;
                                return (
                                    <div key={i} className="flex flex-col gap-0.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5] }}></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase truncate">
                                                    {p.method === 'CASH' ? 'Tiền mặt' : p.method === 'TRANSFER_COMPANY' ? 'CK Công ty' : p.method === 'TRANSFER_PERSONAL' ? 'CK Cá nhân' : p.method === 'CARD' ? 'Quẹt thẻ' : 'Trả góp'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-800">{percent.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mr-2">
                                                <div
                                                    className="h-full transition-all duration-1000"
                                                    style={{ width: `${percent}%`, backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5] }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{formatCurrency(p.amount)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!data.paymentMethodBreakdown || data.paymentMethodBreakdown.every((p: any) => p.amount === 0)) && (
                                <p className="text-center py-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Chưa có dữ liệu</p>
                            )}
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


function UserAvatar({ src, fallbackIcon, className }: { src: string | undefined, fallbackIcon: React.ReactNode, className?: string }) {
    const [error, setError] = useState(false);
    if (!src || error) return <div className={className + " flex items-center justify-center italic"}>{fallbackIcon}</div>;
    return (
        <img
            src={src}
            alt=""
            className={className}
            onError={() => setError(true)}
        />
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

function RankingCard({ type, rank, total, branchRank, icon, color }: { type: string, rank: number | null, total: number, branchRank: number | null, icon: React.ReactNode, color: 'blue' | 'rose' | 'amber' }) {
    const getMotivationalMessage = (rank: number | null, type: string) => {
        if (!rank) return `Bạn đang nỗ lực đạt thứ hạng đầu (${type}). Hãy bứt phá mạnh mẽ hơn nữa nhé! 💪`;
        if (rank === 1) return `Xin chúc mừng! Bạn đang xuất sắc đứng Top 1 Server (${type}). Hãy giữ vững phong độ nhé! 🏆`;
        if (rank <= 5) return `Tuyệt vời! Bạn đang nằm trong Top 5 Server (${type}). Chỉ một chút nỗ lực nữa là chạm tới ngôi đầu! 🚀`;
        return `Bạn đang ở vị trí thứ ${rank} Server (${type}). Hãy bứt phá mạnh mẽ hơn nữa nhé! 💪`;
    };

    const colorClasses = {
        blue: 'bg-blue-50 border-blue-100 text-blue-600',
        rose: 'bg-rose-50 border-rose-100 text-rose-600',
        amber: 'bg-amber-50 border-amber-100 text-amber-600',
    };

    const iconClasses = {
        blue: 'bg-blue-100 text-blue-600',
        rose: 'bg-rose-100 text-rose-600',
        amber: 'bg-amber-100 text-amber-600',
    };

    return (
        <div className={`p-4 rounded-2xl border ${colorClasses[color]} shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClasses[color]}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase opacity-70">{type}</p>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-black">
                            Hạng {rank || '—'} / {total || '—'}
                        </p>
                        {branchRank && (
                            <span className="text-[10px] font-black bg-white/50 px-1.5 py-0.5 rounded border border-current/10">
                                CN: #{branchRank}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <p className="text-[11px] font-medium leading-relaxed italic opacity-90 border-t border-current/10 pt-2 mt-2">
                "{getMotivationalMessage(rank, type)}"
            </p>
        </div>
    );
}

function SaleDashboard({ data, startDate, endDate, branchId }: { data: any, startDate: string, endDate: string, branchId: string }) {
    const router = useRouter();
    // Force 200M base target as requested (100% = 200tr)
    const KPI_TARGET = 200000000;
    const salesRevenue = data.salesRevenue || 0;
    const completedRevenue = data.completedRevenue || data.monthlyRevenue || 0;
    const pendingRevenue = data.pendingRevenue || 0;
    const currentRevenue = completedRevenue; // Lương/thưởng tính trên doanh số hoàn thành
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

    const ranking = data.ranking?.employee;
    const showRanking = ranking && (ranking.sales.rank || ranking.completed.rank);

    return (
        <div className="space-y-4">
            {/* Leaderboard Section */}
            {showRanking && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* System wide status */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 p-4 rounded-3xl border border-blue-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-blue-200/40 hover:-translate-y-1 flex flex-col justify-between">
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all duration-500 rotate-12 group-hover:rotate-0">
                            <Trophy size={40} className="text-blue-600" />
                        </div>
                        <div className="flex items-center gap-2.5 mb-3.5 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
                                <Trophy size={16} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600/60 leading-none mb-0.5">Hệ thống</p>
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Top Server</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Doanh số bán</span>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                                        #{ranking.sales.rank || '—'}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors group-hover:text-blue-500">/ {ranking.sales.totalCount}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoàn thành</span>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                                        #{ranking.completed.rank || '—'}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors group-hover:text-blue-500">/ {ranking.completed.totalCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10">
                            <div className="bg-gradient-to-r from-blue-600/5 to-transparent border-l-3 border-blue-500 p-2.5 rounded-r-xl">
                                <p className="text-[11px] font-bold leading-relaxed italic text-blue-900 drop-shadow-sm">
                                    "{(() => {
                                        const bestRank = Math.min(...[ranking.sales.rank, ranking.completed.rank].filter(r => r !== null) as number[]);
                                        if (!bestRank || bestRank > 10) return "Hãy nỗ lực bứt phá để vinh danh toàn hệ thống nhé! 💪";
                                        if (bestRank === 1) return "Bạn là số 1 toàn hệ thống. Hãy giữ vững ngôi vương nhé! 👑";
                                        return `Bạn đang dẫn đầu toàn hệ thống (Hạng ${bestRank}). Tiến lên! 🚀`;
                                    })()}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Branch status */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50/50 p-4 rounded-3xl border border-rose-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-rose-200/40 hover:-translate-y-1 flex flex-col justify-between">
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-700"></div>
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all duration-500 rotate-12 group-hover:rotate-0">
                            <MapPin size={40} className="text-rose-600" />
                        </div>
                        <div className="flex items-center gap-2.5 mb-3.5 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-600/60 leading-none mb-0.5">Địa phương</p>
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Top Chi nhánh</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Doanh số bán</span>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                                        #{ranking.branchSales.rank || '—'}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors group-hover:text-rose-500">/ {ranking.branchSales.totalCount}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoàn thành</span>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl font-black text-slate-800 tracking-tighter">
                                        #{ranking.branchCompleted.rank || '—'}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase transition-colors group-hover:text-rose-500">/ {ranking.branchCompleted.totalCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10">
                            <div className="bg-gradient-to-r from-rose-600/5 to-transparent border-l-3 border-rose-500 p-2.5 rounded-r-xl">
                                <p className="text-[11px] font-bold leading-relaxed italic text-rose-900 drop-shadow-sm">
                                    "{(() => {
                                        const bestBranchRank = Math.min(...[ranking.branchSales.rank, ranking.branchCompleted.rank].filter(r => r !== null) as number[]);
                                        if (!bestBranchRank || bestBranchRank === 1) return "Bạn là chiến binh số 1 của chi nhánh! 🌟";
                                        if (bestBranchRank <= 3) return "Rất xuất sắc! Bạn thuộc Top 3 chi nhánh. 🏆";
                                        return "Sắp chạm tới vị trí dẫn đầu rồi. Cố lên! 🔥";
                                    })()}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* KPI Card */}
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-4 md:p-5 text-white shadow-xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                            <p className="text-rose-100 text-sm font-medium mb-0.5 flex items-center gap-2">
                                <TrendingUp size={14} /> Doanh số hoàn thành
                            </p>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-lg leading-tight">
                                {formatCurrency(completedRevenue)}
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
                            {/* Doanh số bán & chờ thanh toán */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                    <span className="text-rose-200">DS Bán:</span> <span className="text-white font-bold">{formatCurrency(salesRevenue)}</span>
                                </div>
                                {(data.debtStats?.remainingAmount || pendingRevenue) > 0 && (
                                    <div
                                        onClick={() => router.push(`/orders?paymentStatus=pending&startDate=${startDate}&endDate=${endDate}${branchId ? `&branchId=${branchId}` : ''}`)}
                                        className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 cursor-pointer hover:bg-amber-500/40 transition-colors flex items-center gap-1"
                                    >
                                        <Clock size={10} className="text-amber-200" />
                                        <span className="text-amber-200">Nợ:</span> <span className="text-amber-300 font-bold">{formatCurrency(data.debtStats?.remainingAmount || pendingRevenue)}</span>
                                        <span className="text-amber-100/60 ml-1">({data.debtStats?.count || 0} đơn)</span>
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

            {/* KPI Period Trend */}
            <KPIPeriodTrend periodStats={data.periodStats} />

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
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Tổng đơn hàng</p>
                            <p className="text-lg font-black text-slate-900">{data.salesOrderCount || data.orderCount || 0}</p>
                            <p className="text-[8px] text-slate-400 -mt-0.5">Trong kỳ báo cáo</p>
                        </div>
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Lương cơ bản</p>
                            <p className="text-lg font-black text-slate-700">{formatCurrency(data.baseSalary || 0)}</p>
                        </div>
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Tổng hoa hồng</p>
                            <p className="text-lg font-black text-emerald-600">{formatCurrency(data.totalCommission || 0)}</p>
                        </div>
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Thưởng nóng</p>
                            <p className="text-lg font-black text-rose-600">{formatCurrency(data.hotBonus || 0)}</p>
                        </div>
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Thưởng KPI kỳ</p>
                            <p className={`text-lg font-black ${(data.periodBonus || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(data.periodBonus || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Tiền Ship</p>
                            <p className="text-lg font-black text-indigo-600">{formatCurrency(data.shippingFees || 0)}</p>
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
                                        <p className="text-xl font-black text-white">{formatCurrency(data.performance?.actualReward || 0)}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Mốc thưởng hiện tại: <span className="text-slate-200">
                                            {formatCurrency(data.performance?.milestone || 0)}
                                        </span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tổng thu nhập</p>
                                        <p className="text-lg font-black text-emerald-400">
                                            {formatCurrency(data.netIncome || 0)}
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
    const systemRevenue = data.systemRevenue || 0;
    const totalOrderCount = data.totalOrderCount || 0;
    const baseSalary = data.baseSalary || 6000000;
    const commission = data.commission || 0;
    const netIncome = data.netIncome || (baseSalary + commission);

    return (
        <div className="space-y-6 text-left">
            {/* Top Stat Card - Integrated Version */}
            <div className="bg-gradient-to-br from-rose-700 to-rose-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group border border-white/10">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Left: Revenue */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1 opacity-80">
                                    <TrendingUp size={12} className="text-blue-300" />
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-blue-100">Doanh số bán hệ thống</h3>
                                </div>
                                <p className="text-2xl md:text-3xl font-black truncate tracking-tight text-blue-50">
                                    {formatCurrency(data.systemSalesRevenue || 0)}
                                </p>
                                <span className="text-[9px] font-bold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/20 text-blue-200 mt-2 inline-block">
                                    Đơn bán: {data.totalOrderCount || 0}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1 opacity-80">
                                    <TrendingUp size={12} className="text-emerald-300" />
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Tiền về hệ thống</h3>
                                </div>
                                <p className="text-2xl md:text-3xl font-black truncate tracking-tight">
                                    {formatCurrency(systemRevenue)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="text-[9px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/20 text-emerald-300">
                                        Đơn hoàn thành: {data.completedOrderCount || 0}
                                    </span>
                                    <span className="text-[9px] font-bold bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
                                        Lương cứng: {formatCurrency(baseSalary)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Commission Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 min-w-[280px]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <CreditCard size={14} className="text-emerald-400" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-100">Hoa hồng (0.2%)</h4>
                                </div>
                                <p className="text-2xl font-black text-emerald-400">
                                    {formatCurrency(commission)}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 mb-1 justify-end">
                                    <DollarSign size={14} className="text-white" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-100">Tổng thực nhận</h4>
                                </div>
                                <p className="text-2xl font-black text-white">
                                    {formatCurrency(netIncome)}
                                </p>
                            </div>
                        </div>
                        <p className="text-[9px] text-rose-200/50 italic leading-tight border-t border-white/5 pt-2">
                            * Cách tính: 6.000.000đ lương cứng + 0.2% tổng doanh số hệ thống tháng này.
                        </p>
                    </div>
                </div>
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
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-lg">
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

function DriverDashboard({ data, startDate, endDate }: { data: any, startDate: string, endDate: string }) {
    return (
        <div className="space-y-4">
            {/* Main Stats Card */}
            <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-3xl p-4 md:p-5 text-white shadow-xl relative overflow-hidden group border border-white/10">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1.5 opacity-80">
                            <Truck size={14} />
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-100">Thu nhập vận chuyển tháng này</h3>
                        </div>
                        <p className="text-3xl font-black tracking-tight">
                            {formatCurrency(data.monthlyStats?.completedShippingFees || 0)}
                        </p>
                        <p className="text-[10px] text-rose-200 mt-0.5 opacity-80">
                            Ước tính: {formatCurrency(data.monthlyStats?.estimatedShippingFees || 0)}
                        </p>
                        <div className="mt-2 flex gap-2">
                            <span className="text-[9px] font-bold bg-black/20 px-2.5 py-0.5 rounded-full border border-white/5">
                                Đã giao: {data.monthlyStats?.deliveredCount || 0} / {data.monthlyStats?.totalTrips || 0} chuyến
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[210px] text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={14} className="text-emerald-400" />
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-rose-100">Tổng thu nhập tích lũy</h4>
                        </div>
                        <p className="text-xl font-black text-emerald-300">
                            {formatCurrency(data.allTimeStats?.totalShippingFees || 0)}
                        </p>
                        <p className="text-[8px] text-rose-200 mt-1 opacity-80">
                            Tổng cộng {data.allTimeStats?.totalTrips || 0} chuyến hàng
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center mb-2 text-amber-600">
                        <Clock size={16} />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Đang chờ xử lý</p>
                    <p className="text-xl font-black text-slate-800">{data.monthlyStats?.pendingCount || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center mb-2 text-emerald-600">
                        <CheckCircle size={16} />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Tỷ lệ hoàn thành</p>
                    <p className="text-xl font-black text-slate-800">
                        {data.monthlyStats?.totalTrips > 0
                            ? ((data.monthlyStats.deliveredCount / data.monthlyStats.totalTrips) * 100).toFixed(0)
                            : 0}%
                    </p>
                </div>

                <div className="hidden md:block bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left">
                    <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center mb-2 text-rose-600">
                        <ShoppingBag size={16} />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Tổng chuyến tháng</p>
                    <p className="text-xl font-black text-slate-800">{data.monthlyStats?.totalTrips || 0}</p>
                </div>
            </div>

            {/* Recent Deliveries */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                            <Truck size={16} />
                        </div>
                        <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Chuyến hàng gần đây</h3>
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {data.recentDeliveries?.map((delivery: any) => (
                        <div key={delivery.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${delivery.status === 'delivered'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : 'bg-amber-50 border-amber-100 text-amber-600'
                                    }`}>
                                    <ShoppingBag size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-700">
                                        {delivery.customerName || `Đơn #${delivery.orderId.slice(0, 8)}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                        {formatDate(delivery.date)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-800">{formatCurrency(delivery.fee)}</p>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${delivery.status === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : delivery.status === 'assigned'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {delivery.status === 'delivered' ? 'Đã giao' : delivery.status === 'assigned' ? 'Đang giao' : 'Chờ giao'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {(!data.recentDeliveries || data.recentDeliveries.length === 0) && (
                        <div className="py-12 text-center">
                            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Không có chuyến hàng nào gần đây</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                    <button
                        onClick={() => window.location.href = '/orders'}
                        className="text-[9px] font-black text-rose-600 uppercase tracking-widest hover:text-rose-700 transition-colors"
                    >
                        Xem tất cả đơn hàng
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: any) {
    return (
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-100 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-medium mb-0.5 uppercase tracking-tight">{title}</p>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{value}</h3>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
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
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(order.createdAt)}</p>
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
