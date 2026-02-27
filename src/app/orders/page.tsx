"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Check
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import OrderInvoiceView from '../../components/orders/OrderInvoiceView';
import ConfirmModal from '@/components/ui/confirm-modal';

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
    const [activeTab, setActiveTab] = useState<'all' | 'created' | 'assigned'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
    const [showLowPriceOnly, setShowLowPriceOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'delivered'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    const { error: toastError, success } = useToast();
    const router = useRouter();

    const handleConfirmDelivery = async (orderId: string) => {
        if (!user) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${apiUrl}/orders/${orderId}/confirm-delivery?userId=${user.id}`, {
                method: 'PATCH',
            });

            if (!res.ok) throw new Error('Failed to confirm delivery');

            success('Đã xác nhận giao hàng thành công');
            // Refresh orders
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
            const userRole = typeof userData.role === 'object' ? (userData.role.code || userData.role.name) : userData.role;
            const userBranchId = userData.employee?.branchId;

            const orderParams = new URLSearchParams();
            orderParams.append('userId', userData.id);
            if (userRole) orderParams.append('roleCode', userRole);
            if (userBranchId) orderParams.append('branchId', userBranchId);

            const orderUrl = `${apiUrl}/orders?${orderParams.toString()}`;

            const orderRes = await fetch(orderUrl);
            if (!orderRes.ok) throw new Error('Failed to fetch orders');
            const orderData = await orderRes.json();
            setOrders(orderData);

            if (userRole === 'DIRECTOR') {
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
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [router]);

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

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerPhone.includes(searchTerm);

        const matchesBranch = selectedBranchId === 'all' || order.branchId === selectedBranchId;
        const matchesEmployee = selectedEmployeeId === 'all' ||
            order.splits?.some((s: any) => s.employeeId === selectedEmployeeId);

        const hasLowPrice = order.items?.some((item: any) => item.isBelowMin);
        const matchesLowPrice = !showLowPriceOnly || hasLowPrice;

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        let matchesTime = true;
        if (timeFilter !== 'all') {
            const now = new Date();
            const orderDate = new Date(order.createdAt);
            if (timeFilter === 'today') {
                matchesTime = orderDate.toDateString() === now.toDateString();
            } else if (timeFilter === 'week') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                matchesTime = orderDate >= weekAgo;
            } else if (timeFilter === 'month') {
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                matchesTime = orderDate >= monthAgo;
            }
        }

        return matchesSearch && matchesBranch && matchesEmployee && matchesLowPrice && matchesStatus && matchesTime;
    });

    // Helper: Check if order is created by current user
    const isOrderCreatedByUser = (order: any) => {
        return user && order.createdBy === user.id;
    };

    // Helper: Check if order is assigned to current user
    const isOrderAssignedToUser = (order: any) => {
        if (!user?.employee?.id) return false;
        return order.splits?.some((split: any) => split.employeeId === user.employee.id);
    };

    // Filter by tab
    const tabFilteredOrders = filteredOrders.filter(order => {
        const isCreated = isOrderCreatedByUser(order);

        if (activeTab === 'created') {
            return isCreated;
        } else if (activeTab === 'assigned') {
            // Only show assigned orders if NOT created by user (to avoid duplicates/confusion)
            return isOrderAssignedToUser(order) && !isCreated;
        }
        return true; // 'all' tab
    });

    // Count orders by type
    const createdCount = filteredOrders.filter(isOrderCreatedByUser).length;
    const assignedCount = filteredOrders.filter(o => isOrderAssignedToUser(o) && !isOrderCreatedByUser(o)).length;

    const userRole = user ? (typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role) : '';
    const isDirector = userRole === 'DIRECTOR';
    const isSale = userRole === 'SALE';
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
            const splitPercent = Number(mySplit.splitPercent) / 100;
            revenue = Number(mySplit.splitAmount);

            for (const item of order.items) {
                const itemTotal = Number(item.totalPrice);
                const rate = item.isBelowMin ? 0.01 : 0.018;
                commission += itemTotal * rate;
                bonus += Number(item.saleBonusAmount) * item.quantity;
            }

            commission *= splitPercent;
            bonus *= splitPercent;
        }

        // Delivery fee: if I am the assigned driver in ANY delivery for this order
        const myDelivery = order.deliveries?.find((d: any) => d.driverId === myId);
        const deliveryFee = myDelivery ? Number(myDelivery.deliveryFee) : 0;

        return {
            revenue,
            commission,
            bonus,
            deliveryFee,
            total: commission + bonus + deliveryFee
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Stats Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lịch sử đơn hàng</h1>
                    <p className="text-sm text-slate-500">Quản lý và tra cứu các hóa đơn đã tạo.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng đơn</p>
                            <p className="text-sm font-black text-slate-700">{filteredOrders.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm khách, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all text-xs font-medium"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-xs font-medium"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">⏳ Chờ giao</option>
                            <option value="assigned">🚗 Đã điều xe</option>
                            <option value="delivered">✅ Đã giao</option>
                        </select>
                    </div>

                    {/* Time Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={timeFilter}
                            onChange={(e: any) => setTimeFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-xs font-medium"
                        >
                            <option value="all">Tất cả thời gian</option>
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                        </select>
                    </div>

                    {/* Branch Filter (Director Only) */}
                    {isDirector ? (
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-xs font-medium"
                            >
                                <option value="all">Tất cả chi nhánh</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-1">
                            <button
                                onClick={() => setShowLowPriceOnly(!showLowPriceOnly)}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                    showLowPriceOnly
                                        ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm"
                                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                <Filter size={14} />
                                Đơn giá Min
                            </button>
                        </div>
                    )}

                    {/* Employee Filter or Low Price (Director) */}
                    {isDirector ? (
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-xs font-medium"
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

                    {/* Low Price for Director */}
                    {isDirector && (
                        <div className="flex items-center gap-2 px-1">
                            <button
                                onClick={() => setShowLowPriceOnly(!showLowPriceOnly)}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                    showLowPriceOnly
                                        ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm"
                                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                <Filter size={14} />
                                Đơn giá Min
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "flex-1 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === 'all'
                                ? "text-rose-600 bg-rose-50"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        Tất cả
                        <span className={cn(
                            "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                            activeTab === 'all' ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {filteredOrders.length}
                        </span>
                        {activeTab === 'all' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('created')}
                        className={cn(
                            "flex-1 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === 'created'
                                ? "text-emerald-600 bg-emerald-50"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        Đơn của tôi
                        <span className={cn(
                            "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                            activeTab === 'created' ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {createdCount}
                        </span>
                        {activeTab === 'created' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={cn(
                            "flex-1 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === 'assigned'
                                ? "text-blue-600 bg-blue-50"
                                : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        Được chia
                        <span className={cn(
                            "ml-2 px-2 py-0.5 rounded-full text-xs font-black",
                            activeTab === 'assigned' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {assignedCount}
                        </span>
                        {activeTab === 'assigned' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Order Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                                {isDirector && <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi nhánh</th>}
                                {isDirector && <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>}
                                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tổng tiền</th>
                                {isSale && (
                                    <>
                                        <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Hoa hồng</th>
                                        <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Thưởng nóng</th>
                                        <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Ship</th>
                                        <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Thực nhận</th>
                                    </>
                                )}
                                {isDriver && (
                                    <>
                                        <th className="px-2 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Ship</th>
                                        <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Thực nhận</th>
                                    </>
                                )}
                                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
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
                                        <td className="px-3 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800">{order.customerName}</span>
                                                    {/* Price Violation Badge */}
                                                    {order.items?.some((item: any) => item.isBelowMin) && (
                                                        <span className="px-1 py-[1px] rounded-[4px] text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap" title="Đơn hàng có sản phẩm bán dưới giá Min">
                                                            Dưới giá Min
                                                        </span>
                                                    )}
                                                    {/* Badges for Order Type */}
                                                    {isOrderCreatedByUser(order) && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
                                                            Của tôi
                                                        </span>
                                                    )}
                                                    {isOrderAssignedToUser(order) && !isOrderCreatedByUser(order) && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
                                                            Được chia
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">{order.customerPhone}</span>
                                            </div>
                                        </td>

                                        {isDirector && (
                                            <td className="px-3 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                    {order.branch?.name || 'HQ'}
                                                </span>
                                            </td>
                                        )}

                                        {isDirector && (
                                            <td className="px-3 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {order.splits?.map((s: any) => s.employee?.fullName).join(', ') || '---'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black">
                                                        {order.splits?.[0]?.employee?.position || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        <td className="px-3 py-4">
                                            <div className="flex flex-col gap-1">
                                                {order.items.slice(0, 2).map((item: any, idx: number) => (
                                                    <span key={idx} className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full w-fit max-w-[150px] truncate">
                                                        {item.product?.name || 'Sản phẩm'} x{item.quantity}
                                                    </span>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <span className="text-[10px] text-slate-400 font-bold pl-1">+ {order.items.length - 2} sản phẩm khác</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <span className="text-sm font-black text-rose-600">
                                                {formatCurrency(Number(order.totalAmount))}
                                            </span>
                                        </td>
                                        {(isSale || isDriver) && (
                                            // Income Breakdown Cells
                                            (() => {
                                                const inc = calculateOrderIncome(order);
                                                return (
                                                    <>
                                                        {isSale && (
                                                            <>
                                                                <td className="px-2 py-4 text-right">
                                                                    <span className="text-xs font-bold text-slate-600">
                                                                        {formatCurrency(inc.commission)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-4 text-right">
                                                                    <span className="text-xs font-bold text-slate-600">
                                                                        {formatCurrency(inc.bonus)}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-2 py-4 text-right">
                                                            <span className="text-xs font-bold text-slate-600">
                                                                {formatCurrency(inc.deliveryFee)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-right">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-emerald-600">
                                                                    {formatCurrency(inc.total)}
                                                                </span>
                                                                {isSale && (
                                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                        DS: {formatCurrency(inc.revenue)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                );
                                            })()
                                        )}
                                        <td className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                {order.status === 'delivered' ? (
                                                    <div className="flex flex-col items-center gap-0.5 animate-in zoom-in duration-300">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-100">
                                                            <Check size={14} strokeWidth={4} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Đã giao</span>
                                                    </div>
                                                ) : (order.status === 'assigned' || (order.deliveries && order.deliveries.length > 0)) ? (
                                                    // Only show button if user has permission (Director/Sale or the assigned Driver)
                                                    (isDirector || isSale || (isDriver && isOrderAssignedToUser(order))) ? (
                                                        <button
                                                            onClick={() => handleConfirmDelivery(order.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-200 whitespace-nowrap"
                                                            title="Xác nhận khách đã nhận hàng"
                                                        >
                                                            <CheckCircle size={12} /> Giao xong
                                                        </button>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
                                                            🚗 Đang giao
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-200 whitespace-nowrap">
                                                        ⏳ Chờ giao
                                                    </span>
                                                )}
                                                {order.status !== 'delivered' && order.deliveries && order.deliveries.length > 0 && (
                                                    <span className="text-[8px] text-slate-400 font-bold truncate max-w-[80px]" title={`Người giao: ${order.deliveries[0].driver?.fullName || '---'}`}>
                                                        🚗 {order.deliveries[0].driver?.fullName || '---'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm shadow-slate-200"
                                                >
                                                    <FileText size={14} /> Chi tiết
                                                </button>
                                                {(userRole === 'DIRECTOR' || userRole === 'CHIEF_ACCOUNTANT') && (
                                                    <button
                                                        onClick={() => {
                                                            setDeleteOrderId(order.id);
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Xóa đơn hàng"
                                                    >
                                                        <Trash2 size={16} />
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
