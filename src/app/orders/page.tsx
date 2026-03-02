"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    Eye,
    FileText,
    Calendar,
    User as UserIcon,
    ArrowRight,
    ShoppingBag,
    Printer,
    ArrowLeft,
    MapPin,
    Search as SearchIcon,
    Trash2,
    CheckCircle,
    Check,
    CreditCard,
    ShieldCheck,
    ReceiptText,
    Truck,
    Clock,
    Car
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import OrderInvoiceView from '../../components/orders/OrderInvoiceView';
import ConfirmModal from '@/components/ui/confirm-modal';

const LoadingBarStyle = () => (
    <style jsx global>{`
        @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `}</style>
);

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'created' | 'assigned' | 'installment' | 'invoice'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
    const [showLowPriceOnly, setShowLowPriceOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'delivered'>('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'pending' | 'issued'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination States
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [tabCounts, setTabCounts] = useState<any>({ all: 0, created: 0, assigned: 0, installment: 0, invoice: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const { error: toastError, success } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Handle URL Search Params for Filters (Drill-down from Dashboard)
    useEffect(() => {
        const paymentParam = searchParams.get('paymentStatus');
        const invoiceParam = searchParams.get('invoiceStatus');
        const branchParam = searchParams.get('branchId');
        const tabParam = searchParams.get('tab');
        const startParam = searchParams.get('startDate');
        const endParam = searchParams.get('endDate');

        if (paymentParam) setPaymentStatusFilter(paymentParam === 'pending' ? 'pending' : 'all');
        if (invoiceParam) setInvoiceStatusFilter(invoiceParam === 'pending' ? 'pending' : 'all');
        if (branchParam) setSelectedBranchId(branchParam || 'all');
        if (tabParam) setActiveTab(tabParam as any);

        if (startParam && endParam) {
            setStartDate(startParam);
            setEndDate(endParam);
            setTimeFilter('custom');
        }
    }, [searchParams]);

    const handleConfirmDelivery = async (orderId: string) => {
        if (!user) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${apiUrl}/orders/${orderId}/confirm-delivery?userId=${user.id}`, {
                method: 'PATCH',
            });

            if (!res.ok) throw new Error('Failed to confirm delivery');

            success('Đã xác nhận giao hàng thành công');
            fetchOrders();
        } catch (err: any) {
            toastError('Lỗi khi xác nhận: ' + err.message);
        }
    };

    const handleConfirmPayment = async (orderId: string) => {
        if (!user) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${apiUrl}/orders/${orderId}/confirm-payment?userId=${user.id}`, {
                method: 'PATCH',
            });

            if (!res.ok) throw new Error('Failed to confirm payment');

            success('Đã xác nhận thanh toán & ghi nhận doanh số');
            fetchOrders();
        } catch (err: any) {
            toastError('Lỗi khi xác nhận: ' + err.message);
        }
    };

    const handleConfirmInvoice = async (orderId: string) => {
        if (!user) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${apiUrl}/orders/${orderId}/confirm-invoice?userId=${user.id}`, {
                method: 'PATCH',
            });

            if (!res.ok) throw new Error('Failed to confirm invoice issuance');

            success('Đã xác nhận xuất hóa đơn thành công');
            fetchOrders();
        } catch (err: any) {
            toastError('Lỗi khi xác nhận: ' + err.message);
        }
    };

    const fetchOrders = async () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        try {
            // Chỉ hiện vòng xoay loading toàn trang ở lần đầu tiên (khi loading đang là true)
            // Các lần sau (khi loading đã là false), ta dùng refreshing để hiện thanh loading bar nhỏ ở trên
            if (!loading) {
                setRefreshing(true);
            }

            const userRole = typeof userData.role === 'object' ? (userData.role.code || userData.role.name) : userData.role;
            const userBranchId = userData.employee?.branchId;
            const GLOBAL_ROLES = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MARKETING'];

            const orderParams = new URLSearchParams();
            orderParams.append('userId', userData.id);
            if (userRole) orderParams.append('roleCode', userRole);

            // Only send default branch if restricted
            if (userBranchId && !GLOBAL_ROLES.includes(userRole)) {
                orderParams.append('branchId', userBranchId);
            }

            // Read filters: prefer URL params on first load (to avoid race condition with state)
            const urlPaymentStatus = searchParams.get('paymentStatus');
            const urlInvoiceStatus = searchParams.get('invoiceStatus');
            const urlTab = searchParams.get('tab');
            const urlBranch = searchParams.get('branchId');
            const urlStartDate = searchParams.get('startDate');
            const urlEndDate = searchParams.get('endDate');

            const effectivePaymentStatus = urlPaymentStatus || paymentStatusFilter;
            const effectiveInvoiceStatus = urlInvoiceStatus || invoiceStatusFilter;
            const effectiveTab = urlTab || activeTab;
            const effectiveBranchId = urlBranch || selectedBranchId;
            const effectiveStartDate = urlStartDate || startDate;
            const effectiveEndDate = urlEndDate || endDate;

            // Scalability: Add Pagination & Filter Params
            orderParams.append('page', page.toString());
            orderParams.append('limit', limit.toString());
            if (debouncedSearch) orderParams.append('search', debouncedSearch);
            if (effectiveBranchId !== 'all') orderParams.append('branchId', effectiveBranchId);
            if (selectedEmployeeId !== 'all') orderParams.append('employeeId', selectedEmployeeId);
            if (statusFilter !== 'all') orderParams.append('status', statusFilter);
            if (effectivePaymentStatus && effectivePaymentStatus !== 'all') orderParams.append('paymentStatus', effectivePaymentStatus);
            if (paymentMethodFilter !== 'all') orderParams.append('paymentMethod', paymentMethodFilter);
            if (effectiveInvoiceStatus && effectiveInvoiceStatus !== 'all') orderParams.append('invoiceStatus', effectiveInvoiceStatus);

            // Date / time filter
            if (effectiveStartDate && effectiveEndDate) {
                orderParams.append('startDate', effectiveStartDate);
                orderParams.append('endDate', effectiveEndDate);
            } else if (timeFilter !== 'all' && timeFilter !== 'custom') {
                orderParams.append('timeFilter', timeFilter);
            }

            if (effectiveTab !== 'all') orderParams.append('tab', effectiveTab);
            if (showLowPriceOnly) orderParams.append('lowPrice', 'true');

            const orderUrl = `${apiUrl}/orders?${orderParams.toString()}`;

            const orderRes = await fetch(orderUrl);
            if (!orderRes.ok) throw new Error('Failed to fetch orders');
            const result = await orderRes.json();

            // Result is now { data, meta }
            setOrders(result.data || []);
            setTotal(result.meta?.total || 0);
            setTotalPages(result.meta?.totalPages || 0);
            if (result.meta?.counts) {
                setTabCounts(result.meta.counts);
            }

            if (GLOBAL_ROLES.includes(userRole) && branches.length === 0) {
                const [branchRes, employeeRes] = await Promise.all([
                    fetch(`${apiUrl}/branches`),
                    fetch(`${apiUrl}/employees`)
                ]);
                if (branchRes.ok) setBranches(await branchRes.json());
                if (employeeRes.ok) setEmployees(await employeeRes.json());
            }
        } catch (err) {
            console.error(err);
            toastError('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset employee when branch changes to avoid filtering by an employee not in the selected branch
    useEffect(() => {
        setSelectedEmployeeId('all');
    }, [selectedBranchId]);

    useEffect(() => {
        fetchOrders();
    }, [
        page,
        limit,
        debouncedSearch,
        activeTab,
        selectedBranchId,
        selectedEmployeeId,
        statusFilter,
        paymentStatusFilter,
        paymentMethodFilter,
        invoiceStatusFilter,
        timeFilter,
        startDate,
        endDate,
        showLowPriceOnly,
        searchParams  // Re-fetch when URL params change (drill-down from dashboard)
    ]);

    const handleDeleteOrder = async () => {
        if (!deleteOrderId || !user) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${apiUrl}/orders/${deleteOrderId}?userId=${user.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete order');
            }

            success('Xóa đơn hàng thành công');
            fetchOrders();
        } catch (err: any) {
            toastError('Lỗi khi xóa: ' + err.message);
        } finally {
            setShowDeleteConfirm(false);
            setDeleteOrderId(null);
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPaymentStatusFilter('all');
        setPaymentMethodFilter('all');
        setInvoiceStatusFilter('all');
        setTimeFilter('all');
        setStartDate('');
        setEndDate('');
        setSelectedBranchId('all');
        setSelectedEmployeeId('all');
        setActiveTab('all');
        setShowLowPriceOnly(false);
        setPage(1);
        router.push('/orders');
    };

    const filteredOrders = orders;
    const tabFilteredOrders = orders;

    // Correct counts from Backend
    const createdCount = tabCounts.created;
    const assignedCount = tabCounts.assigned;
    const installmentCount = tabCounts.installment;
    const invoiceCount = tabCounts.invoice;
    const allOrdersCount = tabCounts.all;

    // Helpers for UI Logic
    const isOrderCreatedByUser = (order: any) => {
        return user && order.createdBy === user.id;
    };

    const isOrderAssignedToUser = (order: any) => {
        if (!user?.employee?.id) return false;
        return order.splits?.some((split: any) => split.employeeId === user.employee.id);
    };

    const userRole = user ? (typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role) : '';
    const GLOBAL_ROLES = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'MARKETING'];
    const isGlobalRole = GLOBAL_ROLES.includes(userRole);
    const isDirector = userRole === 'DIRECTOR';
    const isAccountant = userRole === 'ACCOUNTANT' || userRole === 'CHIEF_ACCOUNTANT';
    const isSale = userRole === 'SALE' || userRole === 'TELESALE';
    const isDriver = userRole === 'DRIVER';

    // Income calculation helper
    const calculateOrderIncome = (order: any) => {
        if (!user?.employee?.id) return { total: 0, revenue: 0, commission: 0, bonus: 0, deliveryFee: 0 };

        const myId = user.employee.id;
        const mySplit = order.splits?.find((s: any) => s.employeeId === myId);

        let commission = 0;
        let bonus = 0;
        let revenue = 0;

        if (mySplit) {
            const totalAmount = Number(order.totalAmount);
            const splitRatio = totalAmount > 0 ? Number(mySplit.splitAmount) / totalAmount : 0;
            revenue = Number(mySplit.splitAmount);

            for (const item of order.items) {
                const itemTotal = Number(item.totalPrice);
                const rate = item.isBelowMin ? 0.01 : 0.018;
                commission += itemTotal * rate;
                bonus += Number(item.saleBonusAmount) * item.quantity;
            }

            commission *= splitRatio;
            bonus *= splitRatio;
        }

        // Delivery fee: if I am the assigned driver in ANY delivery for this order
        const myDelivery = order.deliveries?.find((d: any) => d.driverId === myId);
        const deliveryFee = myDelivery ? Number(myDelivery.deliveryFee) : 0;

        // Revenue recognition logic
        const isInstallment = order.payments?.some((p: any) => p.paymentMethod === 'INSTALLMENT');
        const isRecognized = !isInstallment || order.isPaymentConfirmed;

        return {
            revenue,
            commission,
            bonus,
            deliveryFee,
            total: commission + bonus + deliveryFee,
            recognizedTotal: isRecognized ? (commission + bonus + deliveryFee) : 0,
            isRecognized,
            isInstallment
        };
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );

    if (selectedOrder) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium print:hidden"
                >
                    <ArrowLeft size={18} /> Quay lại danh sách
                </button>
                <OrderInvoiceView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <LoadingBarStyle />
            {/* Header & Stats Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Lịch sử đơn hàng</h1>
                    <p className="text-[11px] text-slate-500">Quản lý và tra cứu các hóa đơn.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShoppingBag size={14} />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Tổng đơn</p>
                            <p className="text-xs font-black text-slate-700 leading-none">{allOrdersCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 space-y-2 overflow-x-auto scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 items-center min-w-max lg:min-w-0">
                    {/* Search Search */}
                    <div className="relative">
                        <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                        <input
                            type="text"
                            placeholder="Tìm khách, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-8 pr-2 py-1 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all text-[10.5px] font-medium ${searchTerm ? 'border-rose-300' : 'border-slate-200'}`}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${statusFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                        <select
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${statusFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">⏳ Chờ giao</option>
                            <option value="assigned">🚗 Đã điều xe</option>
                            <option value="delivered">✅ Đã giao</option>
                        </select>
                    </div>

                    {/* Time Filter & Range */}
                    <div className={`flex items-center gap-1.5 ${timeFilter === 'custom' ? 'lg:col-span-2 xl:col-span-2' : ''}`}>
                        <div className="relative flex-shrink-0 flex-1">
                            <Calendar className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${timeFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={timeFilter}
                                onChange={(e: any) => {
                                    const val = e.target.value;
                                    setTimeFilter(val);
                                    if (val !== 'custom') {
                                        setStartDate('');
                                        setEndDate('');
                                    }
                                }}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${timeFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                            >
                                <option value="all">Thời gian: Tất cả</option>
                                <option value="today">Hôm nay</option>
                                <option value="week">7 ngày qua</option>
                                <option value="month">Tháng này</option>
                                <option value="custom">Tùy chọn...</option>
                            </select>
                        </div>

                        {timeFilter === 'custom' && (
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 h-[28px] flex-1">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-[9px] font-black text-slate-700 outline-none flex-1 px-0"
                                />
                                <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-[9px] font-black text-slate-700 outline-none flex-1 px-0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Payment Method Filter */}
                    <div className="relative">
                        <CreditCard className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${paymentMethodFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                        <select
                            value={paymentMethodFilter}
                            onChange={(e: any) => setPaymentMethodFilter(e.target.value)}
                            className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${paymentMethodFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                        >
                            <option value="all">PTTT: Tất cả</option>
                            <option value="CASH">💵 Tiền mặt</option>
                            <option value="TRANSFER_COMPANY">🏢 CK Công ty</option>
                            <option value="TRANSFER_PERSONAL">👤 CK Cá nhân</option>
                            <option value="CARD">💳 Quẹt thẻ</option>
                            <option value="INSTALLMENT">🏦 Trả góp</option>
                        </select>
                    </div>

                    {/* Accountant Status Filter */}
                    <div className="relative">
                        <ShieldCheck className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${paymentStatusFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                        <select
                            value={paymentStatusFilter}
                            onChange={(e: any) => setPaymentStatusFilter(e.target.value)}
                            className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${paymentStatusFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                        >
                            <option value="all">Giao dịch: Tất cả</option>
                            <option value="pending">⏳ Chờ KT duyệt</option>
                            <option value="confirmed">✅ Đã khớp tiền</option>
                        </select>
                    </div>

                    {/* Invoice Status Filter */}
                    <div className="relative">
                        <ReceiptText className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${invoiceStatusFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                        <select
                            value={invoiceStatusFilter}
                            onChange={(e: any) => setInvoiceStatusFilter(e.target.value)}
                            className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${invoiceStatusFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                        >
                            <option value="all">Hóa đơn: Tất cả</option>
                            <option value="pending">⏳ Chưa xuất HĐ</option>
                            <option value="issued">✅ Đã xuất HĐ</option>
                        </select>
                    </div>

                    {/* Branch Filter (Director Only) */}
                    {isGlobalRole ? (
                        <div className="relative">
                            <MapPin className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${selectedBranchId !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${selectedBranchId !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                            >
                                <option value="all">Tất cả chi nhánh</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowLowPriceOnly(!showLowPriceOnly)}
                                className={cn(
                                    "w-full flex items-center justify-center gap-1.5 px-3 h-[28px] py-0 rounded-lg text-[10.5px] font-bold transition-all border",
                                    showLowPriceOnly
                                        ? "bg-amber-100 text-amber-700 border-amber-300 shadow-sm"
                                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                GIÁ MIN
                            </button>
                        </div>
                    )}

                    {/* Employee Filter (Global Roles) */}
                    {isGlobalRole ? (
                        <div className="relative">
                            <UserIcon className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${selectedEmployeeId !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium ${selectedEmployeeId !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                            >
                                <option value="all">Tất cả nhân viên</option>
                                {employees
                                    .filter(e => selectedBranchId === 'all' || e.branchId === selectedBranchId)
                                    .map(e => (
                                        <option key={e.id} value={e.id}>{e.fullName}</option>
                                    ))
                                }
                            </select>
                        </div>
                    ) : null}

                    {/* Low Price for Admin roles */}
                    {isGlobalRole && (
                        <div className="relative">
                            <button
                                onClick={() => setShowLowPriceOnly(!showLowPriceOnly)}
                                className={cn(
                                    "w-full flex items-center justify-center gap-1.5 px-3 h-[28px] py-0 rounded-lg text-[10.5px] font-bold transition-all border",
                                    showLowPriceOnly
                                        ? "bg-amber-100 text-amber-700 border-amber-300 shadow-sm"
                                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                GIÁ MIN
                            </button>
                        </div>
                    )}

                    {/* Reset Filter Button */}
                    <div className="relative">
                        <button
                            onClick={resetFilters}
                            className="w-full flex items-center justify-center gap-1.5 px-3 h-[28px] py-0 rounded-lg text-[10.5px] font-bold transition-all border bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white"
                            title="Xoá toàn bộ bộ lọc"
                        >
                            ✕ Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-200 w-full overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "flex-1 min-w-0 px-2 py-1.5 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1",
                            activeTab === 'all'
                                ? "text-rose-600 bg-rose-50"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <span className="truncate min-w-0">Tất cả</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-black flex-none",
                            activeTab === 'all' ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {allOrdersCount > 999 ? '999+' : allOrdersCount}
                        </span>
                        {activeTab === 'all' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('created')}
                        className={cn(
                            "flex-1 min-w-0 px-2 py-1.5 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1",
                            activeTab === 'created'
                                ? "text-emerald-600 bg-emerald-50"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <span className="truncate min-w-0">Của tôi</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-black flex-none",
                            activeTab === 'created' ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {createdCount > 999 ? '999+' : createdCount}
                        </span>
                        {activeTab === 'created' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={cn(
                            "flex-1 min-w-0 px-2 py-1.5 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1",
                            activeTab === 'assigned'
                                ? "text-blue-600 bg-blue-50"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <span className="truncate min-w-0">Được chia</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-black flex-none",
                            activeTab === 'assigned' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {assignedCount > 999 ? '999+' : assignedCount}
                        </span>
                        {activeTab === 'assigned' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                    </button>
                    {isGlobalRole && (
                        <>
                            <button
                                onClick={() => setActiveTab('installment')}
                                className={cn(
                                    "flex-1 min-w-0 px-2 py-1.5 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1",
                                    activeTab === 'installment'
                                        ? "text-orange-600 bg-orange-50"
                                        : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span className="truncate min-w-0">Trả góp</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] font-black flex-none",
                                    activeTab === 'installment' ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-600"
                                )}>
                                    {installmentCount > 999 ? '999+' : installmentCount}
                                </span>
                                {activeTab === 'installment' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('invoice')}
                                className={cn(
                                    "flex-1 min-w-0 px-2 py-1.5 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1",
                                    activeTab === 'invoice'
                                        ? "text-indigo-600 bg-indigo-50"
                                        : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span className="truncate min-w-0">Xuất hóa đơn</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] font-black flex-none",
                                    activeTab === 'invoice' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                                )}>
                                    {invoiceCount > 999 ? '999+' : invoiceCount}
                                </span>
                                {activeTab === 'invoice' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Order Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
                {/* Silent Loading Bar */}
                {refreshing && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-100 overflow-hidden z-20">
                        <div className="h-full bg-rose-500 animate-[loading-bar_1.5s_infinite_linear]"></div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ngày tạo</th>
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Khách hàng</th>
                                {isGlobalRole && <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Chi nhánh</th>}
                                {isGlobalRole && <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Nhân viên</th>}
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sản phẩm</th>
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right leading-none">Tổng tiền</th>
                                {(isGlobalRole || isSale) ? <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">PTTT</th> : null}
                                {isGlobalRole && <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Xuất HĐ</th>}
                                {isSale && (
                                    <>
                                        <th className="px-1.5 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap leading-none">Hoa hồng</th>
                                        <th className="px-1.5 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap leading-none">Thưởng</th>
                                        <th className="px-1.5 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap leading-none">Ship</th>
                                        <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap leading-none">Thực nhận</th>
                                    </>
                                )}
                                {isDriver && (
                                    <>
                                        <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap leading-none">Ship</th>
                                        <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap leading-none">Thực nhận</th>
                                    </>
                                )}
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none whitespace-nowrap">Giao hàng</th>
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none whitespace-nowrap">Xác nhận thanh toán</th>
                                <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none whitespace-nowrap">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tabFilteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="px-6 py-12 text-center text-slate-400 italic">
                                        Không tìm thấy đơn hàng nào khớp với điều kiện.
                                    </td>
                                </tr>
                            ) : (
                                tabFilteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-2 py-1.5">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-black text-slate-700 leading-tight">
                                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[9px] text-blue-500 font-black tracking-tighter bg-blue-50 px-1 rounded uppercase">
                                                        #{order.id.split('-')[0]}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[12px] font-black text-slate-800 leading-none whitespace-nowrap">{order.customerName}</span>
                                                    {/* Badges */}
                                                    <div className="flex flex-wrap gap-1">
                                                        {order.items?.some((item: any) => item.isBelowMin) && (
                                                            <span className="px-1 py-[0.5px] rounded text-[8px] font-black bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap" title="Bán dưới giá Min">
                                                                Min
                                                            </span>
                                                        )}
                                                        {isOrderCreatedByUser(order) && (
                                                            <span className="px-1 py-[0.5px] rounded text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
                                                                Tôi
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                                    <span className="text-[10px] text-slate-500 font-black">{order.customerPhone}</span>
                                                    {order.customerAddress && (
                                                        <span className="text-[10px] text-slate-400 font-bold italic" title={order.customerAddress}>
                                                            - {order.customerAddress}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {isGlobalRole && (
                                            <td className="px-2 py-1.5">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-100 leading-tight">
                                                    {order.branch?.name || 'HQ'}
                                                </span>
                                            </td>
                                        )}

                                        {isGlobalRole && (
                                            <td className="px-2 py-1.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-700 leading-tight">
                                                        {order.splits?.map((s: any) => s.employee?.fullName).join(', ') || '---'}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">
                                                        {order.splits?.[0]?.employee?.position || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        <td className="px-2 py-1.5">
                                            <div className="flex flex-wrap gap-1">
                                                {order.items.map((item: any, idx: number) => (
                                                    <span key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                        {item.product?.name || 'SP'} x{item.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            <span className="text-[11px] font-black text-rose-600">
                                                {formatCurrency(Number(order.totalAmount))}
                                            </span>
                                        </td>
                                        {(isGlobalRole || isSale) && (
                                            <td className="px-2 py-1.5 text-center min-w-[70px]">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {order.payments?.map((p: any, i: number) => (
                                                        <span key={i} className={cn(
                                                            "px-1 py-0.5 rounded text-[8px] font-black uppercase border",
                                                            (p.paymentMethod === 'CASH' || p.paymentMethod === 'TRANSFER') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                (p.paymentMethod === 'TRANSFER_COMPANY' || p.paymentMethod === 'TRANSFER_PERSONAL') ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                                    (p.paymentMethod === 'CARD' || p.paymentMethod === 'CREDIT') ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                        p.paymentMethod === 'INSTALLMENT' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                        )}>
                                                            {(p.paymentMethod === 'CASH' || p.paymentMethod === 'TRANSFER') ? 'TM' :
                                                                p.paymentMethod === 'TRANSFER_COMPANY' ? 'CK CT' :
                                                                    p.paymentMethod === 'TRANSFER_PERSONAL' ? 'CK CN' :
                                                                        (p.paymentMethod === 'CARD' || p.paymentMethod === 'CREDIT') ? 'Thẻ' :
                                                                            p.paymentMethod === 'INSTALLMENT' ? 'Góp' : p.paymentMethod}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        )}
                                        {isGlobalRole && (
                                            <td className="px-2 py-1.5 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5">
                                                    {order.isInvoiceIssued ? (
                                                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                                            <div className="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center shadow-sm">
                                                                <CheckCircle size={12} strokeWidth={4} />
                                                            </div>
                                                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Đã xuất</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Non-cash orders that are not issued yet get a RED warning */}
                                                            {order.payments?.some((p: any) => p.paymentMethod !== 'CASH' && p.paymentMethod !== 'TRANSFER') ? (
                                                                <span className="px-1 py-0.5 rounded text-[8px] font-black bg-rose-50 text-rose-600 border border-rose-100 whitespace-nowrap animate-pulse uppercase">
                                                                    GẤP
                                                                </span>
                                                            ) : (
                                                                <span className="px-1 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap italic uppercase">
                                                                    Chờ
                                                                </span>
                                                            )}
                                                            {isAccountant && (
                                                                <button
                                                                    onClick={() => handleConfirmInvoice(order.id)}
                                                                    className="mt-0.5 px-1 py-0.5 bg-blue-600 text-white rounded text-[8px] font-black uppercase hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                                                                >
                                                                    XN HĐ
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {(isSale || isDriver) && (
                                            // Income Breakdown Cells
                                            (() => {
                                                const inc = calculateOrderIncome(order);
                                                return (
                                                    <>
                                                        {isSale && (
                                                            <>
                                                                <td className="px-1.5 py-1.5 text-right">
                                                                    <span className="text-[10px] font-black text-slate-600">
                                                                        {formatCurrency(inc.commission)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-1.5 py-1.5 text-right">
                                                                    <span className="text-[10px] font-black text-slate-600">
                                                                        {formatCurrency(inc.bonus)}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-1.5 py-1.5 text-right">
                                                            <span className="text-[10px] font-black text-slate-600">
                                                                {formatCurrency(inc.deliveryFee)}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-1.5 text-right">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-emerald-600 leading-tight">
                                                                    {formatCurrency(inc.total)}
                                                                </span>
                                                                {isSale && (
                                                                    <span className={cn(
                                                                        "text-[8px] font-black uppercase tracking-tighter leading-none",
                                                                        inc.isRecognized ? "text-slate-400" : "text-amber-500 animate-pulse"
                                                                    )}>
                                                                        DS: {formatCurrency(inc.revenue)} {inc.isRecognized ? '✓' : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                );
                                            })()
                                        )}
                                        <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {order.status === 'delivered' ? (
                                                    <div className="flex flex-col items-center animate-in zoom-in duration-300 gap-1">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                                                <Check size={12} strokeWidth={4} />
                                                            </div>
                                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Đã giao</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs leading-none">🚗</span>
                                                            <span className="text-[7px] text-slate-400 font-bold max-w-[80px] truncate leading-none">
                                                                {order.deliveries?.[0]?.employee?.fullName || order.deliveries?.[0]?.driver?.fullName || ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (order.status === 'assigned' || (order.deliveries && order.deliveries.length > 0)) ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        {(isGlobalRole || isSale || (isDriver && isOrderAssignedToUser(order))) ? (
                                                            <button
                                                                onClick={() => handleConfirmDelivery(order.id)}
                                                                className="px-1 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black uppercase hover:bg-emerald-700 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                                            >
                                                                XÁC NHẬN XONG
                                                            </button>
                                                        ) : (
                                                            <span className="px-1 py-0.5 rounded text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap uppercase">
                                                                ĐANG GIAO
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs leading-none animate-pulse">🚗</span>
                                                            <span className="text-[7px] text-slate-400 font-black uppercase leading-none">
                                                                {order.deliveries?.[0]?.employee?.fullName || order.deliveries?.[0]?.driver?.fullName || 'CHỜ XE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <Clock size={14} className="text-slate-400" />
                                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-400 border border-slate-200 whitespace-nowrap uppercase italic">
                                                            Chờ
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                            <div className="flex flex-col items-center justify-center gap-0.5">
                                                {(() => {
                                                    const isInstallment = order.payments?.some((p: any) => p.paymentMethod === 'INSTALLMENT');
                                                    if (!isInstallment) {
                                                        return (
                                                            <div className="flex flex-col items-center text-slate-300 opacity-50">
                                                                <Check size={12} />
                                                                <span className="text-[7px] font-black uppercase tracking-tighter">Hoàn tất</span>
                                                            </div>
                                                        );
                                                    }

                                                    if (order.isPaymentConfirmed) {
                                                        return (
                                                            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                                                <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                                    <Check size={12} strokeWidth={4} />
                                                                </div>
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Đã xác nhận</span>
                                                            </div>
                                                        );
                                                    }

                                                    if (isGlobalRole) {
                                                        return (
                                                            <button
                                                                onClick={() => handleConfirmPayment(order.id)}
                                                                className="px-1 py-0.5 bg-rose-600 text-white rounded text-[8px] font-black hover:bg-rose-700 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                                            >
                                                                XÁC NHẬN
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap italic uppercase">
                                                            Chờ thanh toán
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1 flex-nowrap">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1 px-1.5 py-1 bg-slate-800 text-white rounded text-[10px] font-black hover:bg-slate-700 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                                >
                                                    <FileText size={12} /> XEM
                                                </button>
                                                {isGlobalRole && (
                                                    <button
                                                        onClick={() => {
                                                            setDeleteOrderId(order.id);
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors whitespace-nowrap"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination UI */}
            {!loading && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2 pb-10">
                    <div className="text-[11px] text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        Hiển thị <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * limit, total)}</span> trong tổng số <span className="font-bold text-rose-600 font-mono">{total}</span> đơn hàng
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ArrowLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 font-mono text-xs">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={cn(
                                            "min-w-[32px] h-8 flex items-center justify-center rounded-lg border transition-all shadow-sm font-bold",
                                            page === pageNum
                                                ? "bg-rose-600 border-rose-600 text-white"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteOrder}
                title="Xác nhận xóa hóa đơn"
                message="Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan."
                confirmLabel="Xác nhận xóa"
                cancelLabel="Hủy"
                isDanger={true}
            />
        </div >
    );
}
