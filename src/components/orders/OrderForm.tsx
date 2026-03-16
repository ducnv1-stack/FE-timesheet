"use client";

import { useState, useEffect } from 'react';
import { Save, ShoppingCart, User, Info, CreditCard, Users, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

import { formatCurrency, cn, formatDateTime } from '@/lib/utils';
import ItemGrid from '@/components/orders/ItemGrid';
import GiftGrid from '@/components/orders/GiftGrid';
import SplitManager from '@/components/orders/SplitManager';
import PaymentForm from '@/components/orders/PaymentForm';
import AddressSelector from '@/components/orders/AddressSelector';
import EmployeeSearchSelector from '@/components/orders/EmployeeSearchSelector';
import FixedDatePicker from '@/components/ui/FixedDatePicker';
import { FullOrder, Product, Employee, Branch, Gift } from '@/types/order';

interface OrderFormProps {
    initialIsUpgrade: boolean;
    title: string;
    upgradeFromId?: string;
}

export default function OrderForm({ initialIsUpgrade, title, upgradeFromId }: OrderFormProps) {
    const { success, error: toastError } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [allGifts, setAllGifts] = useState<Gift[]>([]);
    const [deliveryFeeRules, setDeliveryFeeRules] = useState<any[]>([]);
    const [driverTab, setDriverTab] = useState<'staff' | 'driver'>('driver');

    const [order, setOrder] = useState<FullOrder>({
        branchId: '',
        staffCode: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        provinceId: '',
        wardId: '',
        customerCardNumber: '',
        customerCardIssueDate: '',
        orderDate: new Date().toISOString().split('T')[0],
        orderSource: '',
        giftAmount: 0,
        gifts: [],
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
        splits: [],
        payments: [{ paymentMethod: 'CASH', amount: 0, paidAt: new Date().toISOString().split('T')[0] }],
        deliveries: [],
        isUpgrade: initialIsUpgrade,
        oldOrderCustomerName: '',
        oldOrderCustomerPhone: '',
        oldOrderCustomerAddress: '',
        oldOrderProvinceId: '',
        oldOrderWardId: '',
        oldOrderCustomerCardNumber: '',
        oldOrderCustomerCardIssueDate: '',
        oldOrderId: '',
        oldOrderCode: ''
    });

    const [oldOrderAmountDisplay, setOldOrderAmountDisplay] = useState('');
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearchOrders = async (term: string) => {
        setSearching(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const limit = term ? 10 : 20;
            const url = term 
                ? `${apiUrl}/orders?search=${term}&limit=${limit}`
                : `${apiUrl}/orders?limit=${limit}`;
            
            const res = await fetch(url);
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Search error:', error);
            // Don't show toast for auto-search failures to avoid spam
            if (term) toastError('Lỗi khi tìm kiếm đơn hàng');
        } finally {
            setSearching(false);
        }
    };

    // Auto-load and Debounce search
    useEffect(() => {
        if (!searchModalOpen) return;

        // Initial load
        if (!searchTerm) {
            handleSearchOrders('');
            return;
        }

        // Debounce search
        const timeoutId = setTimeout(() => {
            handleSearchOrders(searchTerm);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchModalOpen, searchTerm]);

    const selectOldOrder = (oldOrder: any) => {
        const formattedAmount = new Intl.NumberFormat('vi-VN').format(Number(oldOrder.totalAmount));
        setOldOrderAmountDisplay(formattedAmount);

        setOrder(prev => ({
            ...prev,
            oldOrderProductName: oldOrder.items?.[0]?.product?.name || '',
            oldOrderAmount: Number(oldOrder.totalAmount),
            oldOrderDate: oldOrder.orderDate ? oldOrder.orderDate.split('T')[0] : '',
            oldOrderCustomerName: oldOrder.customerName,
            oldOrderCustomerPhone: oldOrder.customerPhone,
            oldOrderCustomerAddress: oldOrder.customerAddress,
            oldOrderProvinceId: oldOrder.provinceId,
            oldOrderWardId: oldOrder.wardId,
            oldOrderCustomerCardNumber: oldOrder.customerCardNumber,
            oldOrderCustomerCardIssueDate: oldOrder.customerCardIssueDate ? oldOrder.customerCardIssueDate.split('T')[0] : '',
            oldOrderId: oldOrder.id,
            oldOrderCode: oldOrder.id?.split('-')[0] || '',
            // One-way sync to new order fields
            customerName: oldOrder.customerName,
            customerPhone: oldOrder.customerPhone,
            customerAddress: oldOrder.customerAddress,
            provinceId: oldOrder.provinceId,
            wardId: oldOrder.wardId,
            customerCardNumber: oldOrder.customerCardNumber,
            customerCardIssueDate: oldOrder.customerCardIssueDate ? oldOrder.customerCardIssueDate.split('T')[0] : '',
        }));
        setSearchModalOpen(false);
        success('Đã lấy thông tin từ đơn hàng cũ!');
    };

    const formatNumber = (val: string) => {
        if (!val) return '';
        const num = val.replace(/\D/g, '');
        return new Intl.NumberFormat('vi-VN').format(Number(num));
    };

    const parseNumber = (val: string) => {
        return Number(val.replace(/\D/g, ''));
    };

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
                const [branchesRes, productsRes, employeesRes, giftsRes, feeRulesRes] = await Promise.all([
                    fetch(`${apiUrl}/branches`),
                    fetch(`${apiUrl}/products`),
                    fetch(`${apiUrl}/employees`),
                    fetch(`${apiUrl}/gifts`),
                    fetch(`${apiUrl}/delivery-fee-rules`)
                ]);
                const branchesData = await branchesRes.json();
                const productsData = await productsRes.json();
                const employeesData = await employeesRes.json();
                const giftsData = await giftsRes.json();
                const feeRulesData = await feeRulesRes.json();

                setBranches(branchesData);
                setProducts(productsData);
                setAllEmployees(employeesData);
                setAllGifts(giftsData);
                if (Array.isArray(feeRulesData)) setDeliveryFeeRules(feeRulesData);

                // Auto-fill from logged-in user
                const storedUser = localStorage.getItem('user');
                if (!storedUser) {
                    router.push('/login');
                    return;
                }

                const user = JSON.parse(storedUser);
                const userRole = typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role;
                if (userRole === 'DRIVER' || userRole === 'DELIVERY_STAFF') {
                    router.push('/orders');
                    return;
                }

                if (user.employee) {
                    const userBranchId = user.employee.branchId || user.employee.branch?.id;
                    setOrder(prev => ({
                        ...prev,
                        branchId: userBranchId || (branchesData.length > 0 ? branchesData[0].id : ''),
                        staffCode: user.employee.id || '',
                    }));
                } else if (branchesData.length > 0) {
                    setOrder(prev => ({ ...prev, branchId: branchesData[0].id }));
                }

                // Auto-fill from upgradeFromId
                if (upgradeFromId) {
                    try {
                        const res = await fetch(`${apiUrl}/orders/${upgradeFromId}`);
                        const oldOrder = await res.json();
                        if (oldOrder && oldOrder.id) {
                            selectOldOrder(oldOrder);
                        }
                    } catch (err) {
                        console.error('Error fetching upgradeFromId:', err);
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchInitialData();
        setIsMounted(true);
    }, [router, upgradeFromId]);

    const headerEmployees = allEmployees.filter(e => e.branchId === order.branchId && e.status !== 'Nghỉ việc');

    const totalProductAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalGiftAmount = order.gifts.reduce((sum, g) => sum + (g.quantity * (g.price || 0)), 0);
    const netRevenue = totalProductAmount - totalGiftAmount;

    const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = totalProductAmount - paidAmount;

    // Calculate dynamic commission label
    let commissionLabel = "Hoa hồng (1.8%)";
    const validRateItems = order.items.filter(i => i.productId && i.unitPrice > 0);
    if (validRateItems.length > 0) {
        const rates = new Set(validRateItems.map(item => {
            const p = products.find(prod => prod.id === item.productId);
            if (!p) return 1.8;
            
            // 🆕 Use dynamic min price helper logic (matching ItemGrid)
            let effectiveMinPrice = p.minPrice;
            if (order.orderDate && p.minPricePolicies && p.minPricePolicies.length > 0) {
                const dateObj = new Date(order.orderDate);
                const applicablePolicies = [...p.minPricePolicies]
                    .filter(pol => {
                        const start = new Date(pol.startDate);
                        const end = pol.endDate ? new Date(pol.endDate) : null;
                        return dateObj >= start && (!end || dateObj <= end);
                    })
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                
                if (applicablePolicies.length > 0) {
                    effectiveMinPrice = applicablePolicies[0].minPrice;
                }
            }

            const effectivePrice = Number(item.unitPrice) + (order.isUpgrade ? Number(order.oldOrderAmount || 0) : 0);
            return effectivePrice < effectiveMinPrice ? 1 : 1.8;
        }));

        if (rates.has(1) && rates.has(1.8)) commissionLabel = "Hoa hồng (1% - 1.8%)";
        else if (rates.has(1)) commissionLabel = "Hoa hồng (1%)";
    }

    const handleSave = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        // Validation
        if (!order.customerName) {
            toastError('Vui lòng nhập tên khách hàng');
            return;
        }
        if (!order.customerPhone) {
            toastError('Vui lòng nhập số điện thoại khách hàng');
            return;
        }
        if (!order.customerAddress || !order.provinceId || !order.wardId) {
            toastError('Vui lòng nhập đầy đủ địa chỉ (Tỉnh, Xã, Số nhà)');
            return;
        }
        if (!order.customerCardNumber) {
            toastError('Vui lòng nhập số căn cước công dân (CCCD)');
            return;
        }

        const hasEmptyProduct = order.items.some(i => !i.productId && (i.unitPrice > 0 || i.quantity > 0));
        if (hasEmptyProduct) {
            toastError('Có dòng sản phẩm chưa được chọn. Vui lòng chọn sản phẩm hoặc xóa dòng trống.');
            return;
        }

        const validItems = order.items.filter(i => i.productId && i.unitPrice > 0 && i.quantity > 0);
        if (validItems.length === 0) {
            toastError('Vui lòng chọn ít nhất một sản phẩm và nhập đơn giá');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                ...order,
                items: validItems.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice
                })),
                gifts: order.gifts
                    .filter(g => g.giftId)
                    .map(g => ({
                        giftId: g.giftId,
                        quantity: g.quantity
                    })),
                orderDate: order.orderDate || new Date().toISOString().split('T')[0],
                customerCardIssueDate: (order.customerCardIssueDate && order.customerCardIssueDate.trim() !== '')
                    ? order.customerCardIssueDate
                    : undefined,
                payments: order.payments.map(p => ({
                    paymentMethod: p.paymentMethod,
                    amount: p.amount,
                    paidAt: p.paidAt || new Date().toISOString().split('T')[0]
                })),
                isUpgrade: order.isUpgrade || false,
                oldOrderProductName: order.oldOrderProductName || undefined,
                oldOrderAmount: order.oldOrderAmount || undefined,
                oldOrderDate: order.oldOrderDate || undefined,
                oldOrderCustomerName: order.oldOrderCustomerName || undefined,
                oldOrderCustomerPhone: order.oldOrderCustomerPhone || undefined,
                oldOrderCustomerAddress: order.oldOrderCustomerAddress || undefined,
                oldOrderProvinceId: order.oldOrderProvinceId || undefined,
                oldOrderWardId: order.oldOrderWardId || undefined,
                oldOrderCustomerCardNumber: order.oldOrderCustomerCardNumber || undefined,
                oldOrderCustomerCardIssueDate: order.oldOrderCustomerCardIssueDate || undefined,
                oldOrderId: order.oldOrderId || undefined,
                oldOrderCode: order.oldOrderCode || undefined,
            };

            if (!payload.staffCode) delete payload.staffCode;
            if (!payload.note) delete payload.note;
            if (!payload.customerAddress) delete payload.customerAddress;
            if (!payload.customerCardNumber) delete payload.customerCardNumber;
            if (!payload.customerCardIssueDate) delete payload.customerCardIssueDate;
            
            if (payload.deliveries && payload.deliveries.length > 0) {
                payload.deliveries = payload.deliveries.map((d: any) => ({
                    category: d.category,
                    ...(d.driverId ? { driverId: d.driverId } : {}),
                }));
            } else {
                delete payload.deliveries;
            }

            const finalTotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const finalGiftAmount = payload.gifts.reduce((sum: number, g: any) => {
                const giftInfo = allGifts.find(gift => gift.id === g.giftId);
                return sum + (g.quantity * (giftInfo?.price || 0));
            }, 0);

            payload.giftAmount = finalGiftAmount;
            payload.totalAmount = finalTotal;

            const othersTotalAmount = order.splits.reduce((sum, s) => sum + s.splitAmount, 0);

            if (othersTotalAmount > finalTotal) {
                toastError('Tổng số tiền chia phối hợp vượt quá doanh số ghi nhận.');
                setLoading(false);
                return;
            }

            const creatorAmount = finalTotal - othersTotalAmount;
            const creatorPercent = finalTotal > 0 ? (creatorAmount / finalTotal) * 100 : 100;

            const creatorSplit = {
                employeeId: order.staffCode || '',
                branchId: order.branchId,
                splitPercent: Number(creatorPercent.toFixed(2)),
                splitAmount: creatorAmount
            };

            if (!creatorSplit.employeeId) {
                toastError('Không xác định được nhân viên tạo đơn. Vui lòng chọn nhân viên.');
                setLoading(false);
                return;
            }

            const otherSplits = order.splits;
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                payload.createdBy = user.id;
            }

            payload.splits = [creatorSplit, ...otherSplits];
            delete payload.province;
            delete payload.ward;

            const res = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Lỗi lưu đơn hàng';
                throw new Error(errorMessage);
            }

            const createdOrder = await res.json();

            const allFiles: File[] = [];
            order.payments.forEach(p => {
                if (p.files && p.files.length > 0) {
                    allFiles.push(...p.files);
                }
            });

            if (allFiles.length > 0) {
                const formData = new FormData();
                allFiles.forEach(file => {
                    formData.append('files', file);
                });
                const storedUser = localStorage.getItem('user');
                const currentUser = storedUser ? JSON.parse(storedUser) : null;
                const currentUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

                const uploadRes = await fetch(`${apiUrl}/orders/${createdOrder.id}/images?userId=${currentUserId}`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    console.error('Failed to upload some images');
                    toastError('Tạo đơn thành công nhưng lỗi tải ảnh lên!');
                }
            }

            success('Lưu đơn hàng thành công!');
            router.push('/orders');
        } catch (error) {
            toastError('Có lỗi xảy ra khi lưu đơn hàng');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto px-2 md:px-4 pb-20 print:pb-0 print:px-0 print:max-w-none">
            <div className="flex items-center justify-end mb-6">
                <div className="flex gap-3 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 rounded font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        In hóa đơn
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-light disabled:bg-slate-300 text-white rounded font-bold shadow-md shadow-primary-subtle transition-all active:scale-95 cursor-pointer text-sm"
                    >
                        {loading ? 'Đang lưu...' : <><Save size={16} /> Lưu Đơn</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 xl:gap-4 print:block">
                <div id="invoice-paper" className="w-full max-w-[210mm] bg-white border-2 p-4 md:p-6 shadow-xl shadow-slate-200/50 relative overflow-hidden print:shadow-none print:p-[10mm] print:border-none print:m-auto transition-all text-slate-900">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary print:hidden"></div>
                    <div className="hidden print:block w-full h-3 bg-primary mb-8"></div>

                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-4">
                            <img src="/logo.png" alt="Superb AI Logo" className="h-12 w-auto object-contain" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Công ty TNHH Tập đoàn Superb AI</p>
                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                                    {(() => {
                                        const b = branches.find(b => b.id === order.branchId);
                                        return b?.address || b?.name || 'Chi nhánh Superb AI';
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">Superb AI</h1>
                            <p className="text-emerald-600 font-black text-sm uppercase tracking-widest">Hệ thống ERP</p>
                        </div>
                    </div>

                    <div className="w-full h-0.5 bg-slate-100 mb-6"></div>

                    <h1 className="text-lg md:text-xl font-black text-center text-slate-900 border-b-2 border-slate-800 pb-2.5 mb-5 md:mb-6 uppercase tracking-[0.2em] print:mt-4">
                        {title}
                    </h1>

                    {/* Old Order Info Section */}
                    {(order.isUpgrade) && (
                        <div className="mb-6 p-4 border-2 border-dashed border-primary-subtle rounded-xl bg-primary-subtle/30 no-print print:hidden">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                                <h3 className="text-xs font-black uppercase text-primary flex items-center gap-2">
                                    <Info size={14} className="shrink-0" /> Thông tin đơn cũ (Pre-system)
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    {order.oldOrderCode && (
                                        <span className="px-2 py-0.5 bg-primary-subtle text-primary text-[10px] font-black rounded-full border border-primary-light whitespace-nowrap">
                                            #{order.oldOrderCode}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSearchModalOpen(true)}
                                        className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary-light transition-all flex items-center gap-1 shrink-0 whitespace-nowrap"
                                    >
                                        <ShoppingCart size={12} className="shrink-0" /> Tìm đơn cũ
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Tên sản phẩm cũ</label>
                                    <select
                                        value={order.oldOrderProductName || ''}
                                        onChange={(e) => setOrder({ ...order, oldOrderProductName: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-primary-subtle text-sm"
                                    >
                                        <option value="">-- Chọn sản phẩm cũ --</option>
                                        {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Giá trị đơn cũ (VNĐ)</label>
                                    <input
                                        type="text"
                                        value={oldOrderAmountDisplay}
                                        onChange={(e) => {
                                            const formatted = formatNumber(e.target.value);
                                            setOldOrderAmountDisplay(formatted);
                                            setOrder({ ...order, oldOrderAmount: parseNumber(formatted) });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-primary-subtle"
                                        placeholder="Ví dụ: 12.000.000"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Ngày đơn cũ</label>
                                    <FixedDatePicker
                                        value={order.oldOrderDate}
                                        onChange={(val) => setOrder({ ...order, oldOrderDate: val })}
                                    />
                                </div>
                                <div className="md:col-span-2 mt-2 pt-2 border-t border-primary-subtle">
                                    <p className="text-[10px] text-primary-light font-bold italic mb-3">* Nhập thông tin khách hàng từ đơn cũ để tự động điền sang đơn mới</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Họ tên khách</label>
                                            <input
                                                type="text"
                                                value={order.oldOrderCustomerName || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setOrder({ 
                                                        ...order, 
                                                        oldOrderCustomerName: val,
                                                        customerName: val // One-way sync
                                                    });
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-primary-subtle"
                                                placeholder="Nguyễn Văn A"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Số điện thoại</label>
                                            <input
                                                type="tel"
                                                value={order.oldOrderCustomerPhone || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setOrder({ 
                                                        ...order, 
                                                        oldOrderCustomerPhone: val,
                                                        customerPhone: val // One-way sync
                                                    });
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-primary-subtle"
                                                placeholder="098..."
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Địa chỉ khách hàng</label>
                                            <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                                <AddressSelector
                                                    provinceId={order.oldOrderProvinceId}
                                                    wardId={order.oldOrderWardId}
                                                    customerAddress={order.oldOrderCustomerAddress}
                                                    onChange={(data) => {
                                                        setOrder({ 
                                                            ...order, 
                                                            oldOrderProvinceId: data.provinceId,
                                                            oldOrderWardId: data.wardId,
                                                            oldOrderCustomerAddress: data.customerAddress,
                                                            // One-way sync
                                                            provinceId: data.provinceId,
                                                            wardId: data.wardId,
                                                            customerAddress: data.customerAddress
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Số CCCD</label>
                                            <input
                                                type="text"
                                                value={order.oldOrderCustomerCardNumber || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setOrder({ 
                                                        ...order, 
                                                        oldOrderCustomerCardNumber: val,
                                                        customerCardNumber: val // One-way sync
                                                    });
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-primary-subtle"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Ngày cấp CCCD</label>
                                            <FixedDatePicker
                                                value={order.oldOrderCustomerCardIssueDate}
                                                onChange={(val) => {
                                                    setOrder({ 
                                                        ...order, 
                                                        oldOrderCustomerCardIssueDate: val,
                                                        customerCardIssueDate: val // One-way sync
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 mb-6 text-sm">
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Chi nhánh:</span>
                            <select
                                value={order.branchId}
                                onChange={(e) => setOrder({ ...order, branchId: e.target.value })}
                                disabled={order.isUpgrade}
                                className={cn(
                                    "bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 appearance-none print:appearance-none cursor-pointer",
                                    order.isUpgrade && "cursor-not-allowed opacity-100" // Opacity-100 to keep text dark for viewing
                                )}
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nhân viên:</span>
                            <select
                                value={order.staffCode || ''}
                                onChange={(e) => setOrder({ ...order, staffCode: e.target.value })}
                                disabled={order.isUpgrade}
                                className={cn(
                                    "bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 appearance-none print:appearance-none cursor-pointer",
                                    order.isUpgrade && "cursor-not-allowed opacity-100"
                                )}
                            >
                                <option value="">Chọn NV...</option>
                                {headerEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Ngày tháng:</span>
                            <FixedDatePicker
                                value={order.orderDate}
                                onChange={(val) => setOrder({ ...order, orderDate: val })}
                                className="border-none !p-0"
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Họ tên khách:</span>
                            <input
                                type="text"
                                value={order.customerName || ''}
                                onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                                placeholder="Nguyễn Văn A..."
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1 md:col-span-2">
                            <span className="font-bold text-slate-600">Địa chỉ:</span>
                            <AddressSelector
                                provinceId={order.provinceId}
                                wardId={order.wardId}
                                customerAddress={order.customerAddress}
                                onChange={(data) => setOrder({ ...order, ...data })}
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Số điện thoại:</span>
                            <input
                                type="tel"
                                value={order.customerPhone}
                                onChange={(e) => setOrder({ ...order, customerPhone: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                                placeholder="09xxx..."
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Số CCCD:</span>
                            <input
                                type="text"
                                value={order.customerCardNumber || ''}
                                onChange={(e) => setOrder({ ...order, customerCardNumber: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                                placeholder="Số CCCD khách hàng..."
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Ngày cấp:</span>
                            <FixedDatePicker
                                value={order.customerCardIssueDate}
                                onChange={(val) => setOrder({ ...order, customerCardIssueDate: val })}
                                className="border-none !p-0"
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-start border-b border-slate-100 py-2">
                            <span className="font-bold text-slate-600 mt-1">Lái xe:</span>
                            <div className="space-y-1.5">
                                <select
                                    value={(() => {
                                        const d = order.deliveries?.find(d => d.category === 'COMPANY_DRIVER' || d.category === 'EXTERNAL_DRIVER');
                                        if (!d) return 'none';
                                        return d.category === 'EXTERNAL_DRIVER' ? 'external' : 'company';
                                    })()}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const otherDeliveries = order.deliveries?.filter(d => d.category !== 'COMPANY_DRIVER' && d.category !== 'EXTERNAL_DRIVER') || [];

                                        if (val === 'none') {
                                            setOrder({ ...order, deliveries: otherDeliveries });
                                        } else if (val === 'external') {
                                            setOrder({
                                                ...order,
                                                deliveries: [...otherDeliveries, { category: 'EXTERNAL_DRIVER', driverId: null, role: 'DRIVER' }]
                                            });
                                        } else {
                                            setOrder({
                                                ...order,
                                                deliveries: [...otherDeliveries, { category: 'COMPANY_DRIVER', driverId: '', role: 'DRIVER' }]
                                            });
                                        }
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 w-full outline-none focus:ring-1 focus:ring-primary-subtle appearance-none print:appearance-none print:bg-transparent print:border-none print:p-0 print:text-[11px] cursor-pointer"
                                >
                                    <option value="none">-- Không --</option>
                                    <option value="external">🚚 Lái xe ngoài (+{(() => {
                                        const rule = deliveryFeeRules.find(r => r.deliveryCategory === 'EXTERNAL_DRIVER' && (r.branchId === order.branchId || !r.branchId) && r.isActive);
                                        return rule ? new Intl.NumberFormat('vi-VN').format(Number(rule.feeAmount)) : '0';
                                    })()}đ)</option>
                                    <option value="company">🏢 Lái xe công ty (+{(() => {
                                        const rule = deliveryFeeRules.find(r => r.deliveryCategory === 'COMPANY_DRIVER' && (r.branchId === order.branchId || !r.branchId) && r.isActive);
                                        return rule ? new Intl.NumberFormat('vi-VN').format(Number(rule.feeAmount)) : '0';
                                    })()}đ)</option>
                                </select>

                                {order.deliveries?.some(d => d.category === 'COMPANY_DRIVER') && (
                                    <select
                                        value={order.deliveries?.find(d => d.category === 'COMPANY_DRIVER')?.driverId || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const newDeliveries = order.deliveries?.map(d =>
                                                d.category === 'COMPANY_DRIVER' ? { ...d, driverId: val } : d
                                            ) || [];
                                            setOrder({ ...order, deliveries: newDeliveries });
                                        }}
                                        className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 w-full text-[11px] appearance-none print:appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Chọn lái xe --</option>
                                        {allEmployees
                                            .filter(e => (e.department === 'Lái xe' || e.position === 'driver' || e.isInternalDriver) && e.status !== 'Nghỉ việc')
                                            .map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                            ))
                                        }
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-[120px_1fr] items-start border-b border-slate-100 py-2">
                            <span className="font-bold text-slate-600 mt-1">Người giao:</span>
                            <div className="space-y-1.5">
                                <EmployeeSearchSelector
                                    employees={allEmployees}
                                    selectedId={order.deliveries?.find(d => d.role === 'STAFF')?.driverId || ''}
                                    staffCode={order.staffCode || ''}
                                    onSelect={(val, tab) => {
                                        const otherDeliveries = order.deliveries?.filter(d => d.role !== 'STAFF') || [];

                                        if (!val) {
                                            setOrder({ ...order, deliveries: otherDeliveries });
                                            return;
                                        }

                                        const emp = allEmployees.find(e => e.id === val);
                                        let category: any = 'STAFF_DELIVERER';

                                        if (emp) {
                                            if (tab === 'deliverer') {
                                                category = 'STAFF_DELIVERER';
                                            } else {
                                                if (val === order.staffCode) {
                                                    category = 'SELLING_SALE';
                                                } else if (emp.position === 'sale' || emp.position === 'NVBH' || emp.department === 'Phòng KD') {
                                                    category = 'OTHER_SALE';
                                                }
                                            }
                                        }

                                        setOrder({
                                            ...order,
                                            deliveries: [...otherDeliveries, { category, driverId: val, role: 'STAFF' }]
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <ItemGrid
                            items={order.items}
                            products={products}
                            onChange={(items) => setOrder({ ...order, items })}
                            isUpgrade={order.isUpgrade}
                            oldOrderAmount={order.oldOrderAmount}
                            orderDate={order.orderDate}
                        />

                        <div className="mt-4 no-print print:hidden">
                            <GiftGrid
                                orderGifts={order.gifts}
                                allGifts={allGifts}
                                onChange={(gifts) => setOrder({ ...order, gifts })}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1 text-sm print:break-inside-avoid">
                        <div className="grid grid-cols-[120px_160px] print:grid-cols-[140px_180px] border-b border-slate-200 py-1">
                            <span className="font-bold text-slate-600">Tổng cộng:</span>
                            <span className="text-right font-black text-sm text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalProductAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[120px_160px] print:grid-cols-[140px_180px] border-b border-slate-200 py-1 text-emerald-600">
                            <span className="font-bold">Đã thanh toán:</span>
                            <span className="text-right font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paidAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[120px_160px] print:grid-cols-[140px_180px] py-1 text-red-600">
                            <span className="font-bold">Còn lại:</span>
                            <span className="text-right font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount)}</span>
                        </div>
                    </div>

                    <div className="mt-8 border-t-2 border-slate-800 pt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">Ghi chú đơn hàng:</span>
                        <textarea
                            value={order.note || ''}
                            onChange={(e) => setOrder({ ...order, note: e.target.value })}
                            placeholder="Nhập ghi chú chi tiết về đơn hàng, vận chuyển..."
                            className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm min-h-[100px] focus:ring-0 print:hidden"
                        />
                        <div className="hidden print:block text-sm text-slate-800 italic p-3 bg-white border border-slate-100 rounded-lg">
                            {order.note || 'Không có ghi chú.'}
                        </div>
                    </div>

                    <div className="hidden print:block mt-8 space-y-6">
                        {order.payments.length > 0 && (
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Thông tin thanh toán</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    {order.payments.map((p, i) => (
                                        <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                                            <span className="text-sm font-medium text-slate-600">
                                                {p.paymentMethod === 'CASH' ? '💰 Tiền mặt' : p.paymentMethod === 'TRANSFER' ? '🏦 Chuyển khoản' : '💳 Quẹt thẻ'} ({p.paidAt})
                                            </span>
                                            <span className="text-sm font-black">{formatCurrency(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {order.splits.length > 0 && (
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Danh sách nhân viên chia đơn</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    {order.splits.map((s, i) => {
                                        const emp = allEmployees.find((e: Employee) => e.id === s.employeeId);
                                        const branch = branches.find((b: Branch) => b.id === s.branchId);
                                        return (
                                            <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{emp?.fullName || 'N/A'}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{branch?.name || 'N/A'}</span>
                                                </div>
                                                <span className="text-sm font-medium italic text-slate-600">
                                                    Doanh số: {formatCurrency(s.splitAmount)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-8 flex justify-between items-start italic text-[10px] text-slate-400 border-t border-slate-100">
                            <div>
                                * Ngày in: {isMounted ? formatDateTime(new Date()) : '...'}
                            </div>
                            <div className="text-right">Hệ thống quản lý Superb AI</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 print:hidden">
                    <div className="bg-white rounded-xl shadow-md border-2 border-slate-800 overflow-hidden">
                        <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-2">
                            <CreditCard size={14} className="text-white" />
                            <h3 className="font-bold text-[10px] uppercase tracking-wider text-white">Tổng kết thu nhập</h3>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[9px] uppercase tracking-tight">Doanh số ghi nhận</span>
                                <span className="font-black text-base text-slate-700">
                                    {formatCurrency(totalProductAmount - order.splits.reduce((sum, s) => sum + s.splitAmount, 0))}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[9px] uppercase tracking-tight">{commissionLabel}</span>
                                <span className="font-black text-base text-emerald-600">
                                    {formatCurrency(order.items.reduce((sum, item) => {
                                        const p = products.find(prod => prod.id === item.productId);
                                        if (!p) return sum;

                                        // 🆕 Use dynamic min price
                                        let effectiveMinPrice = p.minPrice;
                                        if (order.orderDate && p.minPricePolicies && p.minPricePolicies.length > 0) {
                                            const dateObj = new Date(order.orderDate);
                                            const applicablePolicies = [...p.minPricePolicies]
                                                .filter(pol => {
                                                    const start = new Date(pol.startDate);
                                                    const end = pol.endDate ? new Date(pol.endDate) : null;
                                                    return dateObj >= start && (!end || dateObj <= end);
                                                })
                                                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                                            
                                            if (applicablePolicies.length > 0) {
                                                effectiveMinPrice = applicablePolicies[0].minPrice;
                                            }
                                        }

                                        const effectivePrice = Number(item.unitPrice) + (order.isUpgrade ? Number(order.oldOrderAmount || 0) : 0);
                                        const rate = effectivePrice < effectiveMinPrice ? 0.01 : 0.018;
                                        const itemTotal = item.quantity * item.unitPrice;
                                        const creatorShare = totalProductAmount > 0 ? (totalProductAmount - order.splits.reduce((sSum, s) => sSum + s.splitAmount, 0)) / totalProductAmount : 1;
                                        const commissionFactor = totalProductAmount > 0 ? (netRevenue / totalProductAmount) : 1;
                                        return sum + (itemTotal * rate * creatorShare * commissionFactor);
                                    }, 0))}
                                </span>
                            </div>

                            {(() => {
                                const totalBonus = order.items.reduce((sum, item) => {
                                    const p = products.find(prod => prod.id === item.productId);
                                    if (!p) return sum;

                                    const isHighEnd = p.isHighEnd || (p as any).is_high_end;
                                    if (!isHighEnd || !p.bonusPolicies || p.bonusPolicies.length === 0) return sum;

                                    // 🆕 Find effective bonus policy based on orderDate
                                    const dateObj = order.orderDate ? new Date(order.orderDate) : new Date();
                                    const applicablePolicy = [...p.bonusPolicies]
                                        .filter(pol => {
                                            const start = new Date(pol.startDate);
                                            const end = pol.endDate ? new Date(pol.endDate) : null;
                                            return dateObj >= start && (!end || dateObj <= end);
                                        })
                                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

                                    if (!applicablePolicy?.rules) return sum;

                                    const effectivePrice = Number(item.unitPrice) + (order.isUpgrade ? Number(order.oldOrderAmount || 0) : 0);
                                    const rule = [...applicablePolicy.rules]
                                        .filter(r => Number(effectivePrice) >= Number(r.minSellPrice))
                                        .sort((a, b) => Number(b.minSellPrice) - Number(a.minSellPrice))[0];
                                    return sum + (rule ? Number(rule.bonusAmount) : 0) * item.quantity;
                                }, 0);

                                if (totalBonus === 0) return (
                                    <div className="py-1">
                                        <span className="text-[10px] text-slate-400 font-medium italic px-1">Chưa có thưởng nóng...</span>
                                    </div>
                                );

                                const creatorShare = totalProductAmount > 0 ? (totalProductAmount - order.splits.reduce((sSum, s) => sSum + s.splitAmount, 0)) / totalProductAmount : 1;
                                const sharedBonus = totalBonus * creatorShare;

                                return (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-primary-subtle p-1.5 rounded border border-primary-subtle">
                                            <span className="text-primary-light font-black uppercase text-[9px] tracking-tight">Thưởng nóng</span>
                                            <span className="font-black text-base text-primary">{formatCurrency(sharedBonus)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                                <div className="text-[8px] text-slate-500 uppercase font-black mb-0.5 text-center">Sale (70%)</div>
                                                <div className="text-xs font-black text-slate-800 text-center">{formatCurrency(sharedBonus * 0.7)}</div>
                                            </div>
                                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                                <div className="text-[8px] text-slate-500 uppercase font-black mb-0.5 text-center">Quản lý (30%)</div>
                                                <div className="text-xs font-black text-slate-800 text-center">{formatCurrency(sharedBonus * 0.3)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <SplitManager
                        splits={order.splits}
                        employees={allEmployees}
                        branches={branches}
                        totalOrderAmount={totalProductAmount}
                        onChange={(splits) => setOrder({ ...order, splits })}
                    />

                    <PaymentForm
                        payments={order.payments}
                        totalOrderAmount={totalProductAmount}
                        onChange={(payments) => setOrder({ ...order, payments })}
                    />

                    <div className="bg-primary-subtle border border-primary-subtle rounded-xl p-4">
                        <h4 className="font-bold text-primary text-sm mb-2 flex items-center gap-2">
                            <Info size={16} /> Hướng dẫn
                        </h4>
                        <p className="text-xs text-primary leading-relaxed">
                            Nhập thông tin khách hàng và sản phẩm vào hóa đơn.
                            Sử dụng các mục Chia doanh số và Thanh toán để hoàn tất nghiệp vụ.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Modal */}
            {searchModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-primary-light p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <ShoppingCart size={20} /> Tìm kiếm đơn hàng cũ
                            </h3>
                            <button 
                                onClick={() => setSearchModalOpen(false)}
                                className="text-white hover:bg-primary p-1 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên khách, SĐT, hoặc mã đơn..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-subtle text-sm"
                                />
                                {searching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-primary-light border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {searchResults.length > 0 ? (
                                    searchResults.map((res: any) => (
                                        <div 
                                            key={res.id}
                                            onClick={() => selectOldOrder(res)}
                                            className="p-3 border border-slate-100 rounded-xl hover:border-primary hover:bg-primary-subtle/50 cursor-pointer transition-all group"
                                        >
                                            {/* Dòng 1: Tên khách, Sản phẩm, Tổng tiền, Mã đơn */}
                                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 text-sm">
                                                {/* Mobile top row: Customer & Order info */}
                                                <div className="flex items-start justify-between md:hidden">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="font-bold text-slate-800 group-hover:text-primary-light truncate">{res.customerName}</div>
                                                        <div className="text-[10px] text-slate-500 font-medium">{res.customerPhone}</div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{res.orderCode || `HĐ-${res.id?.substring(0, 4).toUpperCase()}`}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold">{new Date(res.orderDate).toLocaleDateString('vi-VN')}</div>
                                                    </div>
                                                </div>

                                                {/* Desktop Customer Info */}
                                                <div className="hidden md:block flex-1 min-w-0">
                                                    <div className="font-bold text-slate-800 group-hover:text-primary-light truncate">{res.customerName}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{res.customerPhone}</div>
                                                </div>
                                                
                                                {/* Products and Total */}
                                                <div className="flex items-center justify-between md:flex-1 md:min-w-0 mt-1 md:mt-0 bg-slate-50 md:bg-transparent p-1.5 md:p-0 rounded-lg md:rounded-none">
                                                    <div className="text-xs text-slate-600 truncate font-medium flex-1">
                                                        📦 {res.items?.[0]?.product?.name || 'N/A'}
                                                        {res.items?.length > 1 && <span className="text-[10px] text-slate-400 ml-1 font-bold bg-slate-200 px-1 rounded-sm">+{res.items.length - 1}</span>}
                                                    </div>
                                                    <div className="w-auto md:w-28 text-right shrink-0 pl-2">
                                                        <div className="text-xs font-black text-primary">{formatCurrency(res.totalAmount)}</div>
                                                    </div>
                                                </div>

                                                {/* Desktop Order Info */}
                                                <div className="hidden md:block w-24 text-right border-l border-slate-100 pl-3">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{res.orderCode || `HĐ-${res.id?.substring(0, 4).toUpperCase()}`}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold">{new Date(res.orderDate).toLocaleDateString('vi-VN')}</div>
                                                </div>
                                            </div>
                                            {/* Dòng 2: Chi nhánh, Nhân viên, Trạng thái */}
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2 md:mt-1.5 pt-2 md:pt-1.5 border-t border-dashed border-slate-100 text-[10px] text-slate-400 font-medium">
                                                {res.branch?.name && (
                                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] md:max-w-[150px]">🏢 {res.branch.name}</span>
                                                )}
                                                {res.splits?.[0]?.employee?.fullName && (
                                                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-[150px]">👤 {res.splits[0].employee.fullName}</span>
                                                )}
                                                <span className={`px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex-shrink-0 ${res.isPaymentConfirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {res.isPaymentConfirmed ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                                </span>
                                                {res.status === 'canceled' && (
                                                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">❌ Đã hủy</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : searchTerm && !searching ? (
                                    <div className="text-center py-10 text-slate-400 italic text-sm">
                                        Không tìm thấy kết quả nào...
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-200 italic text-sm">
                                        Nhập nội dung để bắt đầu tìm kiếm...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
