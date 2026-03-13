"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
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
    Car,
    History,
    FileSpreadsheet,
    Image as ImageIcon,
    RefreshCw,
    ArrowUpRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, cn, formatDate, formatDateTime } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';
import { useToast } from '@/components/ui/toast';
import OrderInvoiceView from '../../components/orders/OrderInvoiceView';
import InsufficientPaymentModal from '../../components/orders/InsufficientPaymentModal';
import OrderAuditLogModal from '../../components/orders/OrderAuditLogModal';
import OrderImagesModal from '../../components/orders/OrderImagesModal';
import ConfirmModal from '@/components/ui/confirm-modal';
import SearchableSelect from '@/components/ui/SearchableSelect';
import FixedDatePicker from '@/components/ui/FixedDatePicker';

const LoadingBarStyle = () => (
    <style jsx global>{`
        @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `}</style>
);

function OrdersPageContent() {
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
    const [viewingImagesOrder, setViewingImagesOrder] = useState<any>(null);
    const [showLowPriceOnly, setShowLowPriceOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'delivered'>('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [insufficientPaymentOrder, setInsufficientPaymentOrder] = useState<any>(null);
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'pending' | 'issued'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [excludeInstallment, setExcludeInstallment] = useState(false);
    const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'company' | 'external'>('all');
    const [editTimeFilter, setEditTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [editStartDate, setEditStartDate] = useState<string>('');
    const [editEndDate, setEditEndDate] = useState<string>('');
    const [confirmedTimeFilter, setConfirmedTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [confirmedStartDate, setConfirmedStartDate] = useState<string>('');
    const [confirmedEndDate, setConfirmedEndDate] = useState<string>('');

    // Pagination States
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [tabCounts, setTabCounts] = useState<any>({ all: 0, created: 0, assigned: 0, installment: 0, invoice: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewingHistoryOrderId, setViewingHistoryOrderId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const lastRequestId = useRef(0);

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
        const excludeInstallmentParam = searchParams.get('excludeInstallment');
        const employeeParam = searchParams.get('employeeId');

        // Reset to default if param is missing (prevent sticky filters)
        setPaymentStatusFilter(paymentParam === 'pending' ? 'pending' : (paymentParam === 'confirmed' ? 'confirmed' : 'all'));
        setInvoiceStatusFilter(invoiceParam === 'pending' ? 'pending' : (invoiceParam === 'issued' ? 'issued' : 'all'));
        setSelectedBranchId(branchParam || 'all');
        setSelectedEmployeeId(employeeParam || 'all');
        setActiveTab((tabParam as any) || 'all');
        setExcludeInstallment(excludeInstallmentParam === 'true');

        if (startParam && endParam) {
            setStartDate(startParam);
            setEndDate(endParam);
            setTimeFilter('custom');
        } else {
            // Only reset time filter if it came from a dashboard drill-down that *should* have had dates
            // or if we want to be strict. Let's be strict for consistency.
            if (!startParam && !endParam && (paymentParam || invoiceParam || branchParam || tabParam)) {
                setStartDate('');
                setEndDate('');
                setTimeFilter('all');
            }
        }

        // Logic for Manager: Auto-select branch if not provided in URL
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            const userRole = typeof userData.role === 'object' ? (userData.role.code || userData.role.name) : userData.role;
            const userBranchId = userData.employee?.branchId;
            if (userRole === 'MANAGER' && userBranchId && !branchParam) {
                setSelectedBranchId(userBranchId);
            }
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

        // Validation: Check if payment is balanced
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
            const totalAmount = Number(order.totalAmount);
            if (totalPaid < totalAmount) {
                setInsufficientPaymentOrder(order);
                return;
            }
        }

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

    const handleExportExcel = async () => {
        if (!user || isExporting) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        try {
            setIsExporting(true);
            const userRole = typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role;
            const userBranchId = user.employee?.branchId;
            const GLOBAL_ROLES = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MARKETING', 'ADMIN'];

            const params = new URLSearchParams();
            params.append('userId', user.id);
            if (userRole) params.append('roleCode', userRole);

            // Filters
            if (selectedBranchId !== 'all') {
                params.append('branchId', selectedBranchId);
            } else if (userBranchId && !GLOBAL_ROLES.includes(userRole)) {
                params.append('branchId', userBranchId);
            }

            if (selectedEmployeeId !== 'all') params.append('employeeId', selectedEmployeeId);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (paymentStatusFilter && paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);
            if (paymentMethodFilter !== 'all') params.append('paymentMethod', paymentMethodFilter);
            if (invoiceStatusFilter && invoiceStatusFilter !== 'all') params.append('invoiceStatus', invoiceStatusFilter);
            if (excludeInstallment) params.append('excludeInstallment', 'true');

            if (startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            } else if (timeFilter !== 'all' && timeFilter !== 'custom') {
                params.append('timeFilter', timeFilter);
            }

            if (activeTab !== 'all') params.append('tab', activeTab);
            if (showLowPriceOnly) params.append('lowPrice', 'true');
            if (deliveryTypeFilter !== 'all') params.append('deliveryType', deliveryTypeFilter);

            // Edit Date filters
            if (editStartDate && editEndDate) {
                params.append('editStartDate', editStartDate);
                params.append('editEndDate', editEndDate);
            } else if (editTimeFilter !== 'all' && editTimeFilter !== 'custom') {
                params.append('editTimeFilter', editTimeFilter);
            }

            // Confirmed Date filters
            if (confirmedStartDate && confirmedEndDate) {
                params.append('confirmedStartDate', confirmedStartDate);
                params.append('confirmedEndDate', confirmedEndDate);
            } else if (confirmedTimeFilter !== 'all' && confirmedTimeFilter !== 'custom') {
                params.append('confirmedTimeFilter', confirmedTimeFilter);
            }

            // High limit to fetch all filtered records
            params.append('page', '1');
            params.append('limit', '5000');
            if (debouncedSearch) params.append('search', debouncedSearch);

            const res = await fetch(`${apiUrl}/orders?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch data for export');
            const result = await res.json();
            const rawOrders = result.data || [];

            if (rawOrders.length === 0) {
                toastError('Không có dữ liệu để xuất');
                return;
            }

            // Flat data for Excel
            const exportData = rawOrders.flatMap((o: any) => {
                const totalPaid = o.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                const remaining = Number(o.totalAmount) - totalPaid;

                // Combine products and gifts
                const allItems = [
                    ...(o.items || []).map((i: any) => ({
                        name: i.product?.name || 'SP',
                        quantity: i.quantity,
                        unitPrice: Number(i.unitPrice),
                        minPrice: Number(i.minPriceAtSale),
                        isBelowMin: i.isBelowMin,
                        type: 'PRODUCT'
                    })),
                    ...(o.gifts || []).map((g: any) => ({
                        name: g.gift?.name || 'Quà',
                        quantity: g.quantity,
                        unitPrice: 0,
                        minPrice: 0,
                        isBelowMin: false,
                        type: 'GIFT'
                    }))
                ];

                // Address
                const fullAddress = [
                    o.customerAddress,
                    o.ward?.name,
                    o.province?.name
                ].filter(Boolean).join(', ');

                // Status mapping
                const statusMap: any = {
                    'pending': 'Chờ giao',
                    'assigned': 'Đã điều xe',
                    'delivered': 'Đã giao',
                    'canceled': 'Đã hủy',
                    'rejected': 'Từ chối'
                };

                // Payment method mapping
                const paymentMethodMap: any = {
                    'CASH': 'Tiền mặt',
                    'TRANSFER': 'Chuyển khoản',
                    'INSTALLMENT': 'Trả góp',
                    'CARD': 'Thẻ',
                    'TRANSFER_COMPANY': 'Chuyển khoản công ty',
                    'TRANSFER_PERSONAL': 'Chuyển khoản cá nhân'
                };

                // Delivery category mapping
                const deliveryCategoryMap: any = {
                    'COMPANY_DRIVER': 'Tài xế công ty',
                    'EXTERNAL_DRIVER': 'Tài xế ngoài',
                    'STAFF_DELIVERER': 'Nhân viên giao',
                    'SELLING_SALE': 'Sale tự giao',
                    'OTHER_SALE': 'Sale khác',
                };

                // Separate driver deliveries vs staff deliveries
                const driverDeliveries = o.deliveries?.filter((d: any) => d.role === 'DRIVER' || d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER') || [];
                const staffDeliveries = o.deliveries?.filter((d: any) => d.role === 'STAFF' || d.category === 'STAFF_DELIVERER' || d.category === 'SELLING_SALE' || d.category === 'OTHER_SALE') || [];

                // Driver info
                const driverNames = driverDeliveries.map((d: any) => d.driver?.fullName || 'N/A').join(', ');
                const driverFees = driverDeliveries.reduce((sum: number, d: any) => sum + Number(d.deliveryFee), 0);

                // Staff delivery info
                const staffDeliveryNames = staffDeliveries.map((d: any) => {
                    const name = d.driver?.fullName || 'N/A';
                    const roleLabel = d.category === 'SELLING_SALE' || d.category === 'OTHER_SALE' ? 'Sale' : 'NVGH';
                    return `${name} [${roleLabel}]`;
                }).join(', ');
                const staffDeliveryFees = staffDeliveries.reduce((sum: number, d: any) => sum + Number(d.deliveryFee), 0);

                // Total shipping fee
                const totalShipFee = o.deliveries?.reduce((sum: number, d: any) => sum + Number(d.deliveryFee), 0) || 0;

                // Delivery categories in Vietnamese
                const deliveryCategories = Array.from(new Set(o.deliveries?.map((d: any) => deliveryCategoryMap[d.category] || d.category))).join(', ');

                // Payment methods in Vietnamese
                const paymentMethods = Array.from(new Set(o.payments?.map((p: any) => paymentMethodMap[p.paymentMethod] || p.paymentMethod))).join(', ');

                // Create rows for each item and split
                const rows: any[] = [];
                const creatorEmployeeId = o.creator?.employee?.id;
                const splits = o.splits?.length > 0 ? o.splits : [{ employee: o.creator?.employee, splitPercent: 100 }];
                let isFirstRow = true;

                allItems.forEach((item: any) => {
                    // Gifts only for creator
                    if (item.type === 'GIFT') {
                        const weightedUnitPrice = 0;
                        const weightedMinPrice = 0;
                        
                        rows.push({
                            'Mã đơn hàng': o.id,
                            'Ngày đơn hàng': formatDate(o.orderDate),
                            'Ngày cập nhật': formatDateTime(o.updatedAt),
                            'Họ tên khách hàng': o.customerName,
                            'Số điện thoại': o.customerPhone,
                            'Địa chỉ chi tiết': o.customerAddress || '',
                            'Xã/Phường': o.ward?.name || '',
                            'Tỉnh/Thành phố': o.province?.name || '',
                            'CCCD/CMND khách': o.customerCardNumber || '',
                            'Ngày cấp CCCD': o.customerCardIssueDate ? formatDate(o.customerCardIssueDate) : '',
                            'Đơn giá dưới Min': 'Không',
                            'Người tạo đơn': `${o.creator?.employee?.fullName || 'N/A'} [${o.creator?.employee?.position || ''}]`,
                            'Nhân viên được chia': `${o.creator?.employee?.fullName || 'N/A'} (Quà tặng)`,
                            'Danh sách sản phẩm': item.name,
                            'Số lượng': isFirstRow ? 1 : 0,
                            'Đơn giá bán': weightedUnitPrice,
                            'Giá bán tối thiểu (Min)': weightedMinPrice,
                            'Ghi chú': o.note || '',
                            'Tổng tiền đơn': isFirstRow ? Number(o.totalAmount) : 0,
                            'Đã thanh toán': isFirstRow ? totalPaid : 0,
                            'Còn nợ': isFirstRow ? remaining : 0,
                            'Phương thức thanh toán': paymentMethods,
                            'Xác nhận tiền': o.isPaymentConfirmed ? 'Đã xác nhận' : 'Chưa',
                            'Hóa đơn VAT': o.isInvoiceIssued ? 'Đã xuất' : 'Chưa',
                            'Hình thức giao': deliveryCategories,
                            'Tài xế': driverNames,
                            'Chi phí tài xế': driverFees,
                            'Nhân viên giao': staffDeliveryNames,
                            'Phí ship nhân viên': staffDeliveryFees,
                            'Tổng phí ship': totalShipFee,
                            'Trạng thái đơn hàng': statusMap[o.status] || o.status
                        });
                        isFirstRow = false;
                        return;
                    }

                    // Products split among employees
                    splits.forEach((split: any) => {
                        const splitPercent = Number(split.splitPercent) || 0;
                        const weightedUnitPrice = (item.unitPrice * splitPercent) / 100;
                        const weightedMinPrice = (item.minPrice * splitPercent) / 100;

                        rows.push({
                            'Mã đơn hàng': o.id,
                            'Ngày đơn hàng': formatDate(o.orderDate),
                            'Ngày cập nhật': formatDateTime(o.updatedAt),
                            'Họ tên khách hàng': o.customerName,
                            'Số điện thoại': o.customerPhone,
                            'Địa chỉ chi tiết': o.customerAddress || '',
                            'Xã/Phường': o.ward?.name || '',
                            'Tỉnh/Thành phố': o.province?.name || '',
                            'CCCD/CMND khách': o.customerCardNumber || '',
                            'Ngày cấp CCCD': o.customerCardIssueDate ? formatDate(o.customerCardIssueDate) : '',
                            'Đơn giá dưới Min': item.isBelowMin ? 'CÓ' : 'Không',
                            'Người tạo đơn': `${o.creator?.employee?.fullName || 'N/A'} [${o.creator?.employee?.position || ''}]`,
                            'Nhân viên được chia': `${split.employee?.fullName || 'N/A'} (${splitPercent}%)`,
                            'Danh sách sản phẩm': `${item.name} (SL: ${item.quantity})`,
                            'Số lượng': isFirstRow ? 1 : 0,
                            'Đơn giá bán': weightedUnitPrice,
                            'Giá bán tối thiểu (Min)': weightedMinPrice,
                            'Ghi chú': o.note || '',
                            'Tổng tiền đơn': isFirstRow ? Number(o.totalAmount) : 0,
                            'Đã thanh toán': isFirstRow ? totalPaid : 0,
                            'Còn nợ': isFirstRow ? remaining : 0,
                            'Phương thức thanh toán': paymentMethods,
                            'Xác nhận tiền': o.isPaymentConfirmed ? 'Đã xác nhận' : 'Chưa',
                            'Hóa đơn VAT': o.isInvoiceIssued ? 'Đã xuất' : 'Chưa',
                            'Hình thức giao': deliveryCategories,
                            'Tài xế': driverNames,
                            'Chi phí tài xế': driverFees,
                            'Nhân viên giao': staffDeliveryNames,
                            'Phí ship nhân viên': staffDeliveryFees,
                            'Tổng phí ship': totalShipFee,
                            'Trạng thái đơn hàng': statusMap[o.status] || o.status
                        });
                        isFirstRow = false;
                    });
                });

                // If no items/gifts, create at least one row for order info
                if (rows.length === 0) {
                     splits.forEach((split: any) => {
                        const currentIsFirstRow = isFirstRow;
                        rows.push({
                            'Mã đơn hàng': o.id,
                            'Ngày đơn hàng': formatDate(o.orderDate),
                            'Ngày cập nhật': formatDateTime(o.updatedAt),
                            'Họ tên khách hàng': o.customerName,
                            'Số điện thoại': o.customerPhone,
                            'Địa chỉ chi tiết': o.customerAddress || '',
                            'Xã/Phường': o.ward?.name || '',
                            'Tỉnh/Thành phố': o.province?.name || '',
                            'Người tạo đơn': `${o.creator?.employee?.fullName || 'N/A'} [${o.creator?.employee?.position || ''}]`,
                            'Nhân viên được chia': `${split.employee?.fullName || 'N/A'} (${split.splitPercent}%)`,
                            'Số lượng': currentIsFirstRow ? 1 : 0,
                            'Tổng tiền đơn': currentIsFirstRow ? Number(o.totalAmount) : 0,
                            'Đã thanh toán': currentIsFirstRow ? totalPaid : 0,
                            'Còn nợ': currentIsFirstRow ? remaining : 0,
                            'Trạng thái đơn hàng': statusMap[o.status] || o.status
                        });
                        isFirstRow = false;
                    });
                }

                return rows;
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Orders");
            XLSX.writeFile(wb, `Bao_cao_don_hang_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`);

            success('Xuất file Excel thành công');
        } catch (err: any) {
            toastError('Lỗi khi xuất file: ' + err.message);
        } finally {
            setIsExporting(false);
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
        const requestId = ++lastRequestId.current;
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
            const GLOBAL_ROLES = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MARKETING', 'ADMIN'];

            const orderParams = new URLSearchParams();
            orderParams.append('userId', userData.id);
            if (userRole) orderParams.append('roleCode', userRole);

            // Read filters: use states directly (URL params are consumed by useEffect)
            const effectivePaymentStatus = paymentStatusFilter;
            const effectiveInvoiceStatus = invoiceStatusFilter;
            const effectiveTab = activeTab;
            const effectiveBranchId = selectedBranchId;
            const effectiveStartDate = startDate;
            const effectiveEndDate = endDate;

            // Scalability: Add Pagination & Filter Params
            orderParams.append('page', page.toString());
            orderParams.append('limit', limit.toString());
            if (debouncedSearch) orderParams.append('search', debouncedSearch);

            // Consolidate branchId: Prioritize effectiveBranchId, fallback to user's branch if restricted
            if (effectiveBranchId !== 'all') {
                orderParams.append('branchId', effectiveBranchId);
            } else if (userBranchId && !GLOBAL_ROLES.includes(userRole)) {
                orderParams.append('branchId', userBranchId);
            }

            if (selectedEmployeeId !== 'all') orderParams.append('employeeId', selectedEmployeeId);
            if (statusFilter !== 'all') orderParams.append('status', statusFilter);
            if (effectivePaymentStatus && effectivePaymentStatus !== 'all') orderParams.append('paymentStatus', effectivePaymentStatus);
            if (paymentMethodFilter !== 'all') orderParams.append('paymentMethod', paymentMethodFilter);
            if (effectiveInvoiceStatus && effectiveInvoiceStatus !== 'all') orderParams.append('invoiceStatus', effectiveInvoiceStatus);

            // Pass excludeInstallment if active
            if (excludeInstallment) {
                orderParams.append('excludeInstallment', 'true');
            }

            // Date / time filter
            if (effectiveStartDate && effectiveEndDate) {
                orderParams.append('startDate', effectiveStartDate);
                orderParams.append('endDate', effectiveEndDate);
            } else if (timeFilter !== 'all' && timeFilter !== 'custom') {
                orderParams.append('timeFilter', timeFilter);
            }

            if (effectiveTab !== 'all') orderParams.append('tab', effectiveTab);
            if (showLowPriceOnly) orderParams.append('lowPrice', 'true');
            if (deliveryTypeFilter !== 'all') orderParams.append('deliveryType', deliveryTypeFilter);

            // Edit Date filters
            if (editStartDate && editEndDate) {
                orderParams.append('editStartDate', editStartDate);
                orderParams.append('editEndDate', editEndDate);
            } else if (editTimeFilter !== 'all' && editTimeFilter !== 'custom') {
                orderParams.append('editTimeFilter', editTimeFilter);
            }

            // Confirmed Date filters
            if (confirmedStartDate && confirmedEndDate) {
                orderParams.append('confirmedStartDate', confirmedStartDate);
                orderParams.append('confirmedEndDate', confirmedEndDate);
            } else if (confirmedTimeFilter !== 'all' && confirmedTimeFilter !== 'custom') {
                orderParams.append('confirmedTimeFilter', confirmedTimeFilter);
            }

            const orderUrl = `${apiUrl}/orders?${orderParams.toString()}`;

            const orderRes = await fetch(orderUrl);
            if (!orderRes.ok) throw new Error('Failed to fetch orders');
            const result = await orderRes.json();

            if (requestId !== lastRequestId.current) {
                return;
            }
            setOrders(result.data || []);
            setTotal(result.meta?.total || 0);
            setTotalPages(result.meta?.totalPages || 0);
            if (result.meta?.counts) {
                setTabCounts(result.meta.counts);
            }

            if ((GLOBAL_ROLES.includes(userRole) || userRole === 'MANAGER') && branches.length === 0) {
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

    // Bỏ tự động reset bằng useEffect để tránh xung đột với URL parameters
    // Thay vào đó việc reset được gọi ở sự kiện onChange của select branch

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
        excludeInstallment,
        deliveryTypeFilter,
        editTimeFilter,
        editStartDate,
        editEndDate,
        confirmedTimeFilter,
        confirmedStartDate,
        confirmedEndDate,
        // Removed searchParams to avoid stale fetch. 
        // State updates from searchParams sync already trigger fetch via dependencies above.
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

        const userBranchId = user?.employee?.branchId;
        if (isManager && userBranchId) {
            setSelectedBranchId(userBranchId);
        } else {
            setSelectedBranchId('all');
        }

        setSelectedEmployeeId('all');
        setActiveTab('all');
        setShowLowPriceOnly(false);
        setExcludeInstallment(false);
        setDeliveryTypeFilter('all');
        setEditTimeFilter('all');
        setEditStartDate('');
        setEditEndDate('');
        setConfirmedTimeFilter('all');
        setConfirmedStartDate('');
        setConfirmedEndDate('');
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
    const GLOBAL_ROLES = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MARKETING', 'ADMIN'];
    const isGlobalRole = GLOBAL_ROLES.includes(userRole);
    const isManager = userRole === 'MANAGER';
    const isDirector = userRole === 'DIRECTOR';
    const isAccountant = userRole === 'ACCOUNTANT' || userRole === 'CHIEF_ACCOUNTANT';
    const isSale = userRole === 'SALE' || userRole === 'TELESALE';
    const isDriver = userRole === 'DRIVER' || userRole === 'DELIVERY_STAFF';

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
            const giftAmount = Number(order.giftAmount || 0);
            const netRevenueForCommission = totalAmount - giftAmount;

            // Commission factor ensures that commission is calculated on (Gross - Gift) 
            // even though it's calculated item by item.
            const commissionFactor = totalAmount > 0 ? netRevenueForCommission / totalAmount : 0;

            const splitRatio = totalAmount > 0 ? Number(mySplit.splitAmount) / totalAmount : 0;
            revenue = Number(mySplit.splitAmount);

            for (const item of order.items) {
                const itemTotal = Number(item.totalPrice);
                const rate = item.isBelowMin ? 0.01 : 0.018;
                commission += itemTotal * rate * commissionFactor;
                bonus += Number(item.saleBonusAmount) * item.quantity;
            }

            commission *= splitRatio;
            bonus *= splitRatio;
        }

        // Delivery fee: sum of all deliveries where I am assigned for this order
        const myDeliveries = order.deliveries?.filter((d: any) => d.driverId === myId) || [];
        const deliveryFee = myDeliveries.reduce((sum: number, d: any) => sum + Number(d.deliveryFee), 0);

        // Revenue recognition logic (Now all orders must be confirmed)
        const isRecognized = !!order.isPaymentConfirmed;

        return {
            revenue,
            commission,
            bonus,
            deliveryFee,
            total: commission + bonus + deliveryFee,
            recognizedTotal: isRecognized ? (commission + bonus + deliveryFee) : 0,
            isRecognized,
            isInstallment: order.payments?.some((p: any) => p.paymentMethod === 'INSTALLMENT')
        };
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <LoadingBarStyle />
            <div className={selectedOrder ? "print:hidden" : "space-y-3"}>
                {/* Header & Stats Summary */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Lịch sử đơn hàng</h1>
                        <p className="text-[11px] text-slate-500">Quản lý và tra cứu các hóa đơn.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {user && ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'ADMIN'].includes(typeof user.role === 'object' ? user.role.code : user.role) && (
                            <button
                                onClick={handleExportExcel}
                                disabled={isExporting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                            >
                                <FileSpreadsheet size={14} className={isExporting ? "animate-bounce" : ""} />
                                {isExporting ? "ĐANG XUẤT..." : "Xuất Excel"}
                            </button>
                        )}
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
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 space-y-2">
                    {/* Mobile Toggle & Search */}
                    <div className="flex lg:hidden items-center gap-2">
                        <div className="relative flex-1">
                            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <input
                                type="text"
                                placeholder="Tìm khách, SĐT, mã đơn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-8 pr-2 py-1.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all text-[11px] font-bold cursor-text ${searchTerm ? 'border-rose-300' : 'border-slate-200'}`}
                            />
                        </div>
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer",
                                showMobileFilters || statusFilter !== 'all' || timeFilter !== 'all' || paymentMethodFilter !== 'all' || paymentStatusFilter !== 'all' || invoiceStatusFilter !== 'all' || deliveryTypeFilter !== 'all' || selectedBranchId !== 'all' || selectedEmployeeId !== 'all' || editTimeFilter !== 'all' || confirmedTimeFilter !== 'all'
                                    ? "bg-rose-600 text-white border-rose-600 shadow-md scale-105"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <Filter size={14} className={cn(showMobileFilters ? "animate-pulse" : "")} />
                            {showMobileFilters ? "Đóng" : "Bộ lọc"}
                        </button>
                    </div>

                    <div className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 items-center transition-[max-height,opacity] duration-300 lg:min-w-0 lg:opacity-100 lg:max-h-none lg:overflow-visible",
                        showMobileFilters ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0 overflow-hidden lg:max-h-none lg:opacity-100 lg:overflow-visible"
                    )}>
                        {/* Search Search (Desktop Only) */}
                        <div className="relative hidden lg:block">
                            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <input
                                type="text"
                                placeholder="Tìm khách, SĐT, mã đơn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-8 pr-2 py-1 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all text-[10.5px] font-medium cursor-text ${searchTerm ? 'border-rose-300' : 'border-slate-200'}`}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${statusFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={statusFilter}
                                onChange={(e: any) => setStatusFilter(e.target.value)}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${statusFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
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
                                    className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${timeFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
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
                                    <FixedDatePicker
                                        value={startDate}
                                        onChange={setStartDate}
                                        className="h-full border-none !bg-transparent !p-0 text-[10px]"
                                    />
                                    <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                                    <FixedDatePicker
                                        value={endDate}
                                        onChange={setEndDate}
                                        className="h-full border-none !bg-transparent !p-0 text-[10px]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Payment Method Filter */}
                        <div className="relative">
                            <CreditCard className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${paymentMethodFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={paymentMethodFilter}
                                onChange={(e: any) => {
                                    setPaymentMethodFilter(e.target.value);
                                    setExcludeInstallment(false);
                                }}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${paymentMethodFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
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
                                onChange={(e: any) => {
                                    setPaymentStatusFilter(e.target.value);
                                    setExcludeInstallment(false);
                                }}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${paymentStatusFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                            >
                                <option value="all">Thanh toán: Tất cả</option>
                                <option value="confirmed">✅ Đã thanh toán đủ</option>
                                <option value="pending">⏳ Còn nợ / Chờ TT</option>
                            </select>
                        </div>

                        {/* Invoice Status Filter */}
                        <div className="relative">
                            <ReceiptText className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${invoiceStatusFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={invoiceStatusFilter}
                                onChange={(e: any) => setInvoiceStatusFilter(e.target.value)}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${invoiceStatusFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                            >
                                <option value="all">Hóa đơn: Tất cả</option>
                                <option value="pending">⏳ Chưa xuất HĐ</option>
                                <option value="issued">✅ Đã xuất HĐ</option>
                            </select>
                        </div>

                        {/* Order Edit Date Filter */}
                        <div className={`flex items-center gap-1.5 ${editTimeFilter === 'custom' ? 'lg:col-span-2 xl:col-span-2' : ''}`}>
                            <div className="relative flex-shrink-0 flex-1">
                                <History className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${editTimeFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                                <select
                                    value={editTimeFilter}
                                    onChange={(e: any) => {
                                        const val = e.target.value;
                                        setEditTimeFilter(val);
                                        if (val !== 'custom') {
                                            setEditStartDate('');
                                            setEditEndDate('');
                                        }
                                    }}
                                    className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${editTimeFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                                >
                                    <option value="all">Sửa gần nhất: Tất cả</option>
                                    <option value="today">Sửa: Hôm nay</option>
                                    <option value="week">Sửa: 7 ngày qua</option>
                                    <option value="month">Sửa: Tháng này</option>
                                    <option value="custom">Sửa: Tùy chọn...</option>
                                </select>
                            </div>

                            {editTimeFilter === 'custom' && (
                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 h-[28px] flex-1">
                                    <FixedDatePicker
                                        value={editStartDate}
                                        onChange={setEditStartDate}
                                        className="h-full border-none !bg-transparent !p-0 text-[10px]"
                                    />
                                    <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                                    <FixedDatePicker
                                        value={editEndDate}
                                        onChange={setEditEndDate}
                                        className="h-full border-none !bg-transparent !p-0 text-[10px]"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Order Confirmation Date Filter */}
                        <div className={`flex items-center gap-1.5 ${confirmedTimeFilter === 'custom' ? 'lg:col-span-2 xl:col-span-2' : ''}`}>
                            <div className="relative flex-shrink-0 flex-1">
                                <CheckCircle className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${confirmedTimeFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                                <select
                                    value={confirmedTimeFilter}
                                    onChange={(e: any) => {
                                        const val = e.target.value;
                                        setConfirmedTimeFilter(val);
                                        if (val !== 'custom') {
                                            setConfirmedStartDate('');
                                            setConfirmedEndDate('');
                                        }
                                    }}
                                    className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${confirmedTimeFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                                >
                                    <option value="all">Xác nhận: Tất cả</option>
                                    <option value="today">XN: Hôm nay</option>
                                    <option value="week">XN: 7 ngày qua</option>
                                    <option value="month">XN: Tháng này</option>
                                    <option value="custom">XN: Tùy chọn...</option>
                                </select>
                            </div>

                            {confirmedTimeFilter === 'custom' && (
                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 h-[28px] flex-1">
                                    <FixedDatePicker
                                        value={confirmedStartDate}
                                        onChange={setConfirmedStartDate}
                                        className="h-full border-none !bg-transparent !p-0 text-[10px]"
                                    />
                                    <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                                    <FixedDatePicker
                                        value={confirmedEndDate}
                                        onChange={(val) => setConfirmedEndDate(val)}
                                        className="h-full border-none !bg-transparent !p-0 text-[10px]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Delivery Type Filter */}
                        <div className="relative">
                            <Truck className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${deliveryTypeFilter !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                            <select
                                value={deliveryTypeFilter}
                                onChange={(e: any) => setDeliveryTypeFilter(e.target.value)}
                                className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${deliveryTypeFilter !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'}`}
                            >
                                <option value="all">Lái xe: Tất cả</option>
                                <option value="company">🏢 Xe công ty</option>
                                <option value="external">🚚 Xe ngoài</option>
                            </select>
                        </div>

                        {/* Branch Filter (Director & Manager) */}
                        {(isGlobalRole || isManager) ? (
                            <div className="relative">
                                <MapPin className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${selectedBranchId !== 'all' ? 'text-rose-500' : 'text-slate-400'}`} size={14} />
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => {
                                        setSelectedBranchId(e.target.value);
                                        setSelectedEmployeeId('all');
                                    }}
                                    disabled={isManager}
                                    className={`w-full pl-8 pr-2 h-[28px] py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none transition-all text-[10.5px] font-medium cursor-pointer ${selectedBranchId !== 'all' ? 'border-rose-300 font-bold' : 'border-slate-200'} ${isManager ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                                >
                                    {isGlobalRole && <option value="all">Tất cả chi nhánh</option>}
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
                                            ? "bg-amber-100 text-amber-700 border-amber-300 shadow-sm cursor-pointer"
                                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 cursor-pointer"
                                    )}
                                >
                                    GIÁ MIN
                                </button>
                            </div>
                        )}

                        {/* Employee Filter (Global Roles & Manager) */}
                        {(isGlobalRole || isManager) ? (
                            <SearchableSelect
                                options={employees
                                    .filter(e => (selectedBranchId === 'all' || e.branchId === selectedBranchId) && e.status !== 'Nghỉ việc')
                                    .map(e => ({ label: e.fullName, value: e.id }))
                                }
                                value={selectedEmployeeId}
                                onSelect={(val) => setSelectedEmployeeId(val)}
                                placeholder="Chọn nhân viên..."
                                allOption={{ label: 'Tất cả nhân viên', value: 'all' }}
                                icon={<UserIcon />}
                                className="relative w-full"
                            />
                        ) : null}

                        {/* Low Price for Admin roles */}
                        {isGlobalRole && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowLowPriceOnly(!showLowPriceOnly)}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-1.5 px-3 h-[28px] py-0 rounded-lg text-[10.5px] font-bold transition-all border",
                                        showLowPriceOnly
                                            ? "bg-amber-100 text-amber-700 border-amber-300 shadow-sm cursor-pointer"
                                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 cursor-pointer"
                                    )}
                                >
                                    GIÁ MIN
                                </button>
                            </div>
                        )}

                        {/* Reset Filter Button (Inside Mobile Menu) */}
                        <div className="relative lg:hidden">
                            <button
                                onClick={resetFilters}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white cursor-pointer"
                                title="Xoá toàn bộ bộ lọc"
                            >
                                ✕ Reset
                            </button>
                        </div>

                        {/* Reset Filter Button (Desktop Only) */}
                        <div className="relative hidden lg:block">
                            <button
                                onClick={resetFilters}
                                className="w-full flex items-center justify-center gap-1.5 px-3 h-[28px] py-0 rounded-lg text-[10.5px] font-bold transition-all border bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white cursor-pointer"
                                title="Xoá toàn bộ bộ lọc"
                            >
                                ✕ Reset
                            </button>
                        </div>
                    </div>
                </div >

                {/* Tabs Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex border-b border-slate-200 w-full overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => { setActiveTab('all'); setExcludeInstallment(false); }}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'all'
                                    ? "text-rose-600 bg-rose-50 cursor-pointer"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
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
                            onClick={() => { setActiveTab('created'); setExcludeInstallment(false); }}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'created'
                                    ? "text-emerald-600 bg-emerald-50 cursor-pointer"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
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
                            onClick={() => { setActiveTab('assigned'); setExcludeInstallment(false); }}
                            className={cn(
                                "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                activeTab === 'assigned'
                                    ? "text-blue-600 bg-blue-50 cursor-pointer"
                                    : "text-slate-600 hover:bg-slate-50 cursor-pointer"
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
                        {
                            (isGlobalRole || isManager) && (
                                <>
                                    <button
                                        onClick={() => { setActiveTab('installment'); setExcludeInstallment(false); }}
                                        className={cn(
                                            "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                            activeTab === 'installment'
                                                ? "text-orange-600 bg-orange-50 cursor-pointer"
                                                : "text-slate-600 hover:bg-slate-50 cursor-pointer"
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
                                    </button >
                                    <button
                                        onClick={() => { setActiveTab('invoice'); setExcludeInstallment(false); }}
                                        className={cn(
                                            "flex-1 px-4 py-2 text-[11px] font-bold transition-all relative flex items-center justify-center gap-1.5",
                                            activeTab === 'invoice'
                                                ? "text-indigo-600 bg-indigo-50 cursor-pointer"
                                                : "text-slate-600 hover:bg-slate-50 cursor-pointer"
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
                            )
                        }
                    </div >
                </div >

                {/* Order Table */}
                < div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative" >
                    {/* Silent Loading Bar */}
                    {
                        refreshing && (
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-100 overflow-hidden z-20">
                                <div className="h-full bg-rose-500 animate-[loading-bar_1.5s_infinite_linear]"></div>
                            </div>
                        )
                    }
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Ngày tạo</th>
                                    <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Ngày lên đơn</th>
                                    <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Khách hàng</th>
                                    {isGlobalRole && <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Chi nhánh</th>}
                                    {(isGlobalRole || isManager) && <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Nhân viên</th>}
                                    <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Sản phẩm</th>
                                    <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right leading-none whitespace-nowrap">Tổng tiền</th>
                                    {(isGlobalRole || isManager || isSale) ? <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none whitespace-nowrap">PTTT</th> : null}
                                    {(isGlobalRole || isManager) && <th className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none whitespace-nowrap">Xuất HĐ</th>}
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
                                    tabFilteredOrders.map((order) => {
                                        const created = new Date(order.createdAt);
                                        const updated = order.updatedAt ? new Date(order.updatedAt) : null;
                                        const isSignificantlyUpdated = updated && (updated.getTime() - created.getTime() > 60000); // 1 minute threshold

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-2 py-1.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-black text-slate-700 leading-tight">
                                                            {formatDate(created)}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                                {formatDateFns(created, 'HH:mm')}
                                                            </span>
                                                            <span className="text-[9px] text-blue-500 font-black tracking-tighter bg-blue-50 px-1 rounded uppercase">
                                                                #{order.id.split('-')[0]}
                                                            </span>
                                                        </div>
                                                        {isSignificantlyUpdated && (
                                                            <span className="text-[8.5px] font-bold text-slate-400 mt-0.5 whitespace-nowrap italic">
                                                                🕒Sửa: {formatDateTime(updated)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <span className="text-[12px] font-bold text-slate-700 leading-tight whitespace-nowrap">
                                                        {formatDate(order.orderDate)}
                                                    </span>
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
                                                                {order.isUpgrade && (
                                                                    <span className="px-1.5 py-[1px] rounded text-[9px] font-semibold bg-rose-50/80 text-rose-600 border border-rose-200 whitespace-nowrap flex items-center gap-1 shadow-sm" title={`Nâng cấp từ đơn: ${order.oldOrderCode || order.oldOrderId?.split('-')[0] || '...'}`}>
                                                                        <RefreshCw size={10} className="text-rose-500" />
                                                                        Nâng cấp từ { (order.oldOrderCode || order.oldOrderId?.split('-')[0]) ? `#${order.oldOrderCode || order.oldOrderId?.split('-')[0]}` : ''}
                                                                    </span>
                                                                )}
                                                                {order.upgradedFrom && order.upgradedFrom.length > 0 && (
                                                                    <span className="px-1.5 py-[1px] rounded text-[9px] font-semibold bg-purple-50/80 text-purple-600 border border-purple-200 whitespace-nowrap flex items-center gap-1 shadow-sm" title={`Đã nâng cấp lên đơn: ${order.upgradedFrom[0].orderCode || order.upgradedFrom[0].id.split('-')[0]}`}>
                                                                        <ArrowUpRight size={10} className="text-purple-500" />
                                                                        Đã lên { (order.upgradedFrom[0].orderCode || order.upgradedFrom[0].id.split('-')[0]) ? `#${order.upgradedFrom[0].orderCode || order.upgradedFrom[0].id.split('-')[0]}` : ''}
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
                                                    <td className="px-2 py-1.5 align-top">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {Array.from(new Set([
                                                                order.branch?.name || 'HQ',
                                                                ...(order.splits?.map((s: any) => s.branch?.name).filter((name: any) => name) || [])
                                                            ])).map((bName: any, i: number) => (
                                                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-100 leading-tight whitespace-nowrap">
                                                                    {bName}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                )}

                                                {(isGlobalRole || isManager) && (
                                                    <td className="px-2 py-1.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-700 leading-tight whitespace-nowrap">
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
                                                        {order.isUpgrade && (
                                                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded whitespace-nowrap italic italic-faint">
                                                                Từ: {order.oldOrderProductName || 'SP cũ'}
                                                            </span>
                                                        )}
                                                        {order.items?.map((item: any, idx: number) => (
                                                            <span key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                                {item.product?.name || 'SP'} x{item.quantity}
                                                            </span>
                                                        ))}
                                                        {order.gifts?.map((og: any, idx: number) => (
                                                            <span key={`gift-${idx}`} className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded whitespace-nowrap border border-rose-100">
                                                                🎁 {og.gift?.name || og.name || 'Quà'} x{og.quantity}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 text-right">
                                                    <span className="text-[11px] font-black text-rose-600">
                                                        {formatCurrency(Number(order.totalAmount))}
                                                    </span>
                                                </td>
                                                {(isGlobalRole || isManager || isSale) && (
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
                                                {(isGlobalRole || isManager) && (
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
                                                                    {order.payments?.some((p: any) => p.paymentMethod !== 'CASH' && p.paymentMethod !== 'TRANSFER' && p.paymentMethod !== 'TRANSFER_PERSONAL') ? (
                                                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-rose-50 text-rose-600 border border-rose-100 whitespace-nowrap animate-pulse uppercase">
                                                                            GẤP
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap italic uppercase">
                                                                            Chờ
                                                                        </span>
                                                                    )}
                                                                    {(isAccountant && order.payments?.some((p: any) => ['TRANSFER_COMPANY', 'CARD', 'CREDIT', 'INSTALLMENT'].includes(p.paymentMethod))) && (
                                                                        <button
                                                                            onClick={() => handleConfirmInvoice(order.id)}
                                                                            className="mt-0.5 px-1 py-0.5 bg-blue-600 text-white rounded text-[8px] font-black uppercase hover:bg-blue-700 transition-all active:scale-95 shadow-sm cursor-pointer"
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
                                                                                inc.isRecognized ? "text-slate-400" : "text-amber-500"
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
                                                                    {(() => {
                                                                        const delivery = order.deliveries?.find((d: any) => d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER');
                                                                        const isExternal = delivery?.category === 'EXTERNAL_DRIVER';
                                                                        return (
                                                                            <span className={cn(
                                                                                "text-[9px] font-black uppercase leading-none",
                                                                                isExternal ? "text-slate-400" : "text-blue-600"
                                                                            )}>
                                                                                {isExternal ? 'Lái xe ngoài' : (delivery?.driver?.fullName || '---')}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        ) : (order.status === 'assigned' || (order.deliveries && order.deliveries.length > 0)) ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                {((isGlobalRole && !isDirector) || isManager) ? (
                                                                    <button
                                                                        onClick={() => handleConfirmDelivery(order.id)}
                                                                        className="px-1 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black uppercase hover:bg-emerald-700 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                                                                    >
                                                                        XÁC NHẬN XONG
                                                                    </button>
                                                                ) : (
                                                                    <span className="px-1 py-0.5 rounded text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap uppercase">
                                                                        ĐANG GIAO
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs leading-none">🚗</span>
                                                                    {(() => {
                                                                        const delivery = order.deliveries?.find((d: any) => d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER');
                                                                        const isExternal = delivery?.category === 'EXTERNAL_DRIVER';
                                                                        return (
                                                                            <span className={cn(
                                                                                "text-[9px] font-black uppercase leading-none",
                                                                                isExternal ? "text-slate-400" : "text-blue-600"
                                                                            )}>
                                                                                {isExternal ? 'Lái xe ngoài' : (delivery?.driver?.fullName || 'CHỜ XE')}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <Clock size={14} className="text-slate-400 cursor-pointer" />
                                                                <span className="px-1 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-400 border border-slate-200 whitespace-nowrap uppercase italic cursor-pointer">
                                                                    Chờ
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                                        {(() => {
                                                            const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                                                            const remaining = Number(order.totalAmount) - totalPaid;

                                                            if (order.isPaymentConfirmed) {
                                                                return (
                                                                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                                                        <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                                            <Check size={12} strokeWidth={4} />
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Đã xác nhận</span>
                                                                        {order.confirmedAt && (
                                                                            <span className="text-[7px] text-slate-400 font-bold whitespace-nowrap leading-none mt-0.5">
                                                                                {formatDateTime(new Date(order.confirmedAt))}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-[7px] font-black text-amber-600 bg-amber-50 px-1 py-[0.5px] rounded border border-amber-200 uppercase">
                                                                            {totalPaid > 0 ? `Đã trả: ${formatCurrency(totalPaid)}` : 'Chưa thu tiền'}
                                                                        </span>
                                                                        {remaining > 0 && (
                                                                            <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-1 rounded mt-0.5 border border-rose-100">
                                                                                Còn nợ: {formatCurrency(remaining)}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {(isGlobalRole && !isDirector) ? (
                                                                        <button
                                                                            onClick={() => handleConfirmPayment(order.id)}
                                                                            className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-black hover:bg-rose-700 transition-all active:scale-95 shadow-sm whitespace-nowrap uppercase cursor-pointer"
                                                                        >
                                                                            Xác nhận đủ
                                                                        </button>
                                                                    ) : (
                                                                        <span className="px-1 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap italic uppercase">
                                                                            Chờ kế toán
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1 flex-nowrap">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="inline-flex items-center gap-1 px-1.5 py-1 bg-slate-800 text-white rounded text-[10px] font-black hover:bg-slate-700 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                                                        >
                                                            <FileText size={12} /> XEM
                                                        </button>

                                                        <button
                                                            onClick={() => setViewingImagesOrder(order)}
                                                            className="inline-flex items-center gap-1 px-1.5 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black hover:bg-indigo-100 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                                                            title="Đính kèm/Xem hóa đơn"
                                                        >
                                                            <ImageIcon size={12} /> ({order.images?.length || 0})
                                                        </button>

                                                        {isGlobalRole && (
                                                            <button
                                                                onClick={() => setViewingHistoryOrderId(order.id)}
                                                                className="p-1 px-1.5 flex items-center justify-center bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                                title="Lịch sử chỉnh sửa"
                                                            >
                                                                <History size={14} />
                                                            </button>
                                                        )}

                                                        {(isGlobalRole && !isDirector) && (
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteOrderId(order.id);
                                                                    setShowDeleteConfirm(true);
                                                                }}
                                                                className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors whitespace-nowrap cursor-pointer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div >

                {/* Pagination UI */}
                {
                    !loading && totalPages > 1 && (
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
                                                        ? "bg-rose-600 border-rose-600 text-white cursor-pointer"
                                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
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
                    )
                }
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

            {selectedOrder && (
                <div
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-white print:p-0 print:block"
                    onClick={() => {
                        setSelectedOrder(null);
                        fetchOrders();
                    }}
                >
                    <div
                        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <OrderInvoiceView
                            order={selectedOrder}
                            onBack={() => {
                                setSelectedOrder(null);
                                fetchOrders();
                            }}
                        />
                    </div>
                </div>
            )}

            <InsufficientPaymentModal
                isOpen={!!insufficientPaymentOrder}
                order={insufficientPaymentOrder}
                onClose={() => setInsufficientPaymentOrder(null)}
                onViewDetails={() => {
                    setSelectedOrder(insufficientPaymentOrder);
                    setInsufficientPaymentOrder(null);
                }}
            />

            {viewingHistoryOrderId && (
                <OrderAuditLogModal
                    orderId={viewingHistoryOrderId}
                    onClose={() => setViewingHistoryOrderId(null)}
                />
            )}

            {viewingImagesOrder && (
                <OrderImagesModal
                    order={viewingImagesOrder}
                    onClose={() => setViewingImagesOrder(null)}
                    onRefresh={() => {
                        fetchOrders();
                    }}
                />
            )}
        </div >
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
            </div>
        }>
            <OrdersPageContent />
        </Suspense>
    );
}
