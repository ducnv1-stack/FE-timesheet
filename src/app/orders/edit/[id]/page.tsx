"use client";

import { useState, useEffect } from 'react';
import { Save, ChevronLeft, ShoppingCart, User, Info, CreditCard, Users } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

import { formatCurrency, cn, formatDate, formatDateTime } from '@/lib/utils';
import ItemGrid from '@/components/orders/ItemGrid';
import GiftGrid from '@/components/orders/GiftGrid';
import SplitManager from '@/components/orders/SplitManager';
import PaymentForm from '@/components/orders/PaymentForm';
import AddressSelector from '@/components/orders/AddressSelector';
import EmployeeSearchSelector from '@/components/orders/EmployeeSearchSelector';
import { FullOrder, Product, Employee, Branch } from '@/types/order';

export default function EditOrderPage() {
    const { success, error: toastError } = useToast();
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [allGifts, setAllGifts] = useState<any[]>([]);
    const [driverTab, setDriverTab] = useState<'staff' | 'driver'>('driver');
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [systemImages, setSystemImages] = useState<string[]>([]);

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
        items: [],
        splits: [],
        payments: [],
        deliveries: [],
        images: []
    });

    // Fetch initial data and order details
    useEffect(() => {
        const fetchData = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
                // 1. Fetch reference data
                const [branchesRes, productsRes, employeesRes, giftsRes, orderRes, systemImagesRes] = await Promise.all([
                    fetch(`${apiUrl}/branches`),
                    fetch(`${apiUrl}/products`),
                    fetch(`${apiUrl}/employees`),
                    fetch(`${apiUrl}/gifts`),
                    fetch(`${apiUrl}/orders/${orderId}`),
                    fetch(`${apiUrl}/orders/${orderId}/system-images`).catch(() => ({ json: () => [] }))
                ]);

                const branchesData = await branchesRes.json();
                const productsData = await productsRes.json();
                const employeesData = await employeesRes.json();
                const giftsData = await giftsRes.json();
                const orderData = await orderRes.json();
                const sysImagesData = await systemImagesRes.json();

                setBranches(branchesData);
                setProducts(productsData);
                setAllEmployees(employeesData);
                setAllGifts(giftsData);
                if (Array.isArray(sysImagesData)) {
                    setSystemImages(sysImagesData);
                }

                // 2. Map order data to state
                if (orderData) {
                    // Extract items, splits (excluding creator), and payments with date formatting
                    const formattedOrder: FullOrder = {
                        branchId: orderData.branchId,
                        staffCode: orderData.staffCode || orderData.createdBy, // Fallback if staffCode missing
                        customerName: orderData.customerName,
                        customerPhone: orderData.customerPhone,
                        customerAddress: orderData.customerAddress || '',
                        provinceId: orderData.provinceId || '',
                        wardId: orderData.wardId || '',
                        province: orderData.province,
                        ward: orderData.ward,
                        customerCardNumber: orderData.customerCardNumber || '',
                        customerCardIssueDate: orderData.customerCardIssueDate ? orderData.customerCardIssueDate.split('T')[0] : '',
                        orderDate: orderData.orderDate.split('T')[0],
                        orderSource: orderData.orderSource,
                        deliveries: orderData.deliveries || [],
                        giftAmount: Number(orderData.giftAmount || 0),
                        gifts: (orderData.gifts || []).map((og: any) => {
                            const giftInfo = giftsData.find((g: any) => g.id === og.giftId);
                            return {
                                ...og,
                                name: giftInfo?.name || og.name || '',
                                price: giftInfo?.price || og.price || 0
                            };
                        }),
                        items: orderData.items.map((i: any) => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: Number(i.unitPrice),
                        })),
                        // Split logic in creation was: splits = [creatorSplit, ...otherSplits]
                        // So we skip the first split if it matches the creator/staffCode for editing convenience
                        splits: orderData.splits.slice(1).map((s: any) => ({
                            employeeId: s.employeeId,
                            branchId: s.branchId,
                            splitPercent: Number(s.splitPercent),
                            splitAmount: Number(s.splitAmount),
                        })),
                        payments: orderData.payments.map((p: any, index: number) => ({
                            paymentMethod: p.paymentMethod,
                            amount: Number(p.amount),
                            paidAt: p.paidAt.split('T')[0],
                            existingImages: index === 0 ? orderData.images : []
                        })),
                        isPaymentConfirmed: orderData.isPaymentConfirmed,
                        confirmedAt: orderData.confirmedAt,
                        confirmer: orderData.confirmer,
                        note: orderData.note || '',
                        images: orderData.images || []
                    };
                    setOrder(formattedOrder);
                }

                // Check auth
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
            } catch (error) {
                console.error('Error fetching data:', error);
                toastError('Không thể tải thông tin hóa đơn');
            } finally {
                setFetching(false);
            }
        };

        if (orderId) fetchData();
        setIsMounted(true);
    }, [orderId, router]);

    const headerEmployees = allEmployees.filter(e => e.branchId === order.branchId && e.status !== 'Nghỉ việc');
    const totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalGiftAmount = order.gifts.reduce((sum, g) => sum + (g.quantity * (g.price || 0)), 0);
    const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = totalAmount - paidAmount;
    const isInstallment = order.payments?.some((p: any) => p.paymentMethod === 'INSTALLMENT');

    // Calculate dynamic commission label
    let commissionLabel = "Hoa hồng (1.8%)";
    const validRateItems = order.items.filter(i => i.productId && i.unitPrice > 0);
    if (validRateItems.length > 0) {
        const rates = new Set(validRateItems.map(item => {
            const p = products.find(prod => prod.id === item.productId);
            if (!p) return 1.8;
            return item.unitPrice < Number(p.minPrice) ? 1 : 1.8;
        }));

        if (rates.has(1) && rates.has(1.8)) commissionLabel = "Hoa hồng (1% - 1.8%)";
        else if (rates.has(1)) commissionLabel = "Hoa hồng (1%)";
    }

    const handleSave = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Validation (same as create)
        if (!order.customerName) { toastError('Vui lòng nhập tên khách hàng'); return; }
        if (!order.customerPhone) { toastError('Vui lòng nhập số điện thoại khách hàng'); return; }
        if (!order.customerAddress || !order.provinceId || !order.wardId) {
            toastError('Vui lòng nhập đầy đủ địa chỉ (Tỉnh, Xã, Số nhà)');
            return;
        }
        if (!order.customerCardNumber) { toastError('Vui lòng nhập số căn cước công dân (CCCD)'); return; }

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
            const storedUser = localStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const currentUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

            const payload: any = { ...order, items: validItems };

            // Calculate exact images in use
            const currentPaymentImages = new Set<string>();
            order.payments.forEach(p => {
                if (p.existingImages) {
                    p.existingImages.forEach(url => currentPaymentImages.add(url));
                }
            });

            // Clean up and set final images
            payload.images = Array.from(currentPaymentImages);
            if (payload.payments) {
                payload.payments = payload.payments.map((p: any) => ({
                    paymentMethod: p.paymentMethod,
                    amount: p.amount,
                    paidAt: p.paidAt
                }));
            }

            if (!payload.staffCode) delete payload.staffCode;
            if (!payload.note) delete payload.note;
            if (!payload.customerAddress) delete payload.customerAddress;
            if (!payload.customerCardNumber) delete payload.customerCardNumber;
            if (payload.customerCardIssueDate === "") {
                payload.customerCardIssueDate = null;
            } else if (!payload.customerCardIssueDate) {
                delete payload.customerCardIssueDate;
            }
            // Clean deliveries to only send DTO-compatible fields
            if (payload.deliveries && payload.deliveries.length > 0) {
                payload.deliveries = payload.deliveries.map((d: any) => ({
                    category: d.category,
                    ...(d.driverId ? { driverId: d.driverId } : {}),
                }));
            } else {
                delete payload.deliveries;
            }

            // Clean and recalculate gifts
            const finalGiftAmount = (order.gifts || [])
                .filter(g => g.giftId)
                .reduce((sum, g) => sum + (g.quantity * (g.price || 0)), 0);

            payload.gifts = (order.gifts || [])
                .filter(g => g.giftId)
                .map(g => ({
                    giftId: g.giftId,
                    quantity: g.quantity
                }));

            payload.giftAmount = finalGiftAmount;

            // Remove confirmation fields as they are handled by separate API
            delete payload.isPaymentConfirmed;
            delete payload.confirmedAt;
            delete payload.confirmer;
            delete payload.province;
            delete payload.ward;
            delete payload.id; // Also remove id if present in state

            const finalTotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            // Method 2: Manual amounts for splits, rest for creator
            const othersTotalAmount = (order.splits || []).reduce((sum, s) => sum + s.splitAmount, 0);

            if (othersTotalAmount > finalTotal) {
                toastError('Tổng số tiền chia phối hợp vượt quá tổng đơn hàng.');
                setLoading(false);
                return;
            }

            const creatorAmount = finalTotal - othersTotalAmount;
            const creatorPercent = finalTotal > 0 ? (creatorAmount / finalTotal) * 100 : 100;

            const creatorSplit = {
                employeeId: order.staffCode || currentUserId,
                branchId: order.branchId,
                splitPercent: Number(creatorPercent.toFixed(2)),
                splitAmount: creatorAmount
            };

            if (!creatorSplit.employeeId) {
                toastError('Không xác định được nhân viên tạo đơn.');
                setLoading(false); return;
            }

            payload.splits = [creatorSplit, ...(order.splits || [])];

            const res = await fetch(`${apiUrl}/orders/${orderId}?userId=${currentUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Update Order Error:', errorData);
                throw new Error(errorData.message || 'Failed to update order');
            }

            // Images array is already synced via payload.images during the PATCH request.

            // Handle new image uploads
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

                const uploadRes = await fetch(`${apiUrl}/orders/${orderId}/images?userId=${currentUserId}`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    console.error('Failed to upload some images');
                    toastError('Cập nhật đơn thành công nhưng lỗi tải ảnh lên!');
                }
            }

            success('Cập nhật hóa đơn thành công!');
            router.push('/orders');
        } catch (error) {
            toastError('Có lỗi xảy ra khi cập nhật hóa đơn');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-700"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto px-2 md:px-4 pb-20 print:pb-0 print:px-0 print:max-w-none">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium print:hidden cursor-pointer"
                >
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <div className="flex gap-3 print:hidden">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer text-sm"
                    >
                        {loading ? 'Đang cập nhật...' : <><Save size={16} /> Lưu Thay Đổi</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 xl:gap-4 print:block">
                <div id="invoice-paper" className="bg-white border-2 border-slate-800 p-4 md:p-6 shadow-2xl relative print:p-[10mm] print:shadow-none transition-all">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-700 print:hidden"></div>
                    <div className="hidden print:block w-full h-3 bg-rose-700 mb-8"></div>

                    {/* Brand Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-4">
                            <img src="/logo.png" alt="Ohari Logo" className="h-12 w-auto object-contain" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Công ty TNHH Tập đoàn OHARI</p>
                                <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                                    {(() => {
                                        const b = branches.find(b => b.id === order.branchId);
                                        return b?.address || b?.name || 'Chi nhánh Ohari';
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">Ohari</h1>
                            <p className="text-emerald-600 font-black text-sm uppercase tracking-widest">Hệ thống ERP</p>
                        </div>
                    </div>

                    <div className="w-full h-0.5 bg-slate-100 mb-6"></div>

                    <h1 className="text-lg md:text-xl font-black text-center text-slate-900 border-b-2 border-slate-800 pb-2.5 mb-5 md:mb-6 uppercase tracking-[0.2em] print:mt-4">
                        Sửa hóa đơn bán hàng
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mb-6 text-xs">
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Chi nhánh:</span>
                            <select
                                value={order.branchId}
                                onChange={(e) => setOrder({ ...order, branchId: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 line-clamp-1 cursor-pointer"
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nhân viên:</span>
                            <select
                                value={order.staffCode || ''}
                                onChange={(e) => setOrder({ ...order, staffCode: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 cursor-pointer"
                            >
                                <option value="">Chọn NV...</option>
                                {headerEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Ngày tháng:</span>
                            <input
                                type="date"
                                value={order.orderDate}
                                onChange={(e) => setOrder({ ...order, orderDate: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 cursor-pointer"
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Họ tên khách:</span>
                            <input
                                type="text"
                                value={order.customerName}
                                onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1 md:col-span-2">
                            <span className="font-bold text-slate-600">Địa chỉ:</span>
                            <AddressSelector
                                provinceId={order.provinceId}
                                wardId={order.wardId}
                                customerAddress={order.customerAddress}
                                initialProvince={order.province}
                                initialWard={order.ward}
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
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Số CCCD:</span>
                            <input
                                type="text"
                                value={order.customerCardNumber || ''}
                                onChange={(e) => setOrder({ ...order, customerCardNumber: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Ngày cấp:</span>
                            <input
                                type="date"
                                value={order.customerCardIssueDate || ''}
                                onChange={(e) => setOrder({ ...order, customerCardIssueDate: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 cursor-pointer"
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
                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 w-full outline-none focus:ring-1 focus:ring-rose-200 cursor-pointer"
                                >
                                    <option value="none">-- Không --</option>
                                    <option value="external">🚚 Lái xe ngoài (+0k)</option>
                                    <option value="company">🏢 Lái xe công ty (+50k)</option>
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
                                        className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 w-full text-[11px] cursor-pointer"
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
                        />

                        <div className="mt-4 no-print print:hidden">
                            <GiftGrid
                                orderGifts={order.gifts}
                                allGifts={allGifts}
                                onChange={(gifts) => setOrder({ ...order, gifts })}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1 text-xs">
                        <div className="grid grid-cols-[120px_160px] border-b border-slate-200 py-1">
                            <span className="font-bold text-slate-600">Tổng cộng:</span>
                            <span className="text-right font-black text-sm text-slate-900">{formatCurrency(totalAmount)}</span>
                        </div>
                        {totalGiftAmount > 0 && (
                            <div className="grid grid-cols-[120px_160px] border-b border-slate-200 py-1 text-rose-600 font-bold italic">
                                <span className="text-slate-600">Quà tặng:</span>
                                <span className="text-right">{formatCurrency(totalGiftAmount)}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-[120px_160px] border-b border-slate-200 py-1 text-emerald-600">
                            <span className="font-bold">Đã thanh toán:</span>
                            <span className="text-right font-bold">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[120px_160px] py-1 text-red-600">
                            <span className="font-bold">Còn lại:</span>
                            <span className="text-right font-bold">{formatCurrency(totalAmount - paidAmount)}</span>
                        </div>
                    </div>

                    <div className="mt-8 border-t-2 border-slate-800 pt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">Ghi chú đơn hàng:</span>
                        <textarea
                            value={order.note || ''}
                            onChange={(e) => setOrder({ ...order, note: e.target.value })}
                            placeholder="Nhập ghi chú chi tiết về đơn hàng, vận chuyển..."
                            className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm min-h-[100px] focus:ring-0 print:hidden cursor-pointer"
                        />
                        <div className="hidden print:block text-sm text-slate-800 italic p-3 bg-slate-50 rounded-lg">
                            {order.note || 'Không có ghi chú.'}
                        </div>
                    </div>

                    {/* Print Only Sections: Payments & Splits */}
                    <div className="hidden print:block mt-8 space-y-6">
                        {/* Payments Section */}
                        {order.payments.length > 0 && (
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Thông tin thanh toán</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    {order.payments.map((p, i) => (
                                        <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                                            <span className="text-sm font-medium text-slate-600">
                                                {p.paymentMethod === 'CASH' ? '💰 Tiền mặt' :
                                                    p.paymentMethod === 'TRANSFER_COMPANY' ? '🏦 CK Công ty' :
                                                        p.paymentMethod === 'TRANSFER_PERSONAL' ? '🏠 CK Cá nhân' :
                                                            p.paymentMethod === 'CREDIT' ? '💳 Quẹt thẻ' :
                                                                p.paymentMethod === 'INSTALLMENT' ? '📈 Trả góp' : '🏦 Chuyển khoản'} ({p.paidAt})
                                            </span>
                                            <span className="text-sm font-black">{formatCurrency(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                {isInstallment && order.isPaymentConfirmed && (
                                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded flex justify-between items-center">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase">✓ Kế toán xác nhận:</span>
                                        <span className="text-[10px] font-bold text-emerald-800 italic">
                                            {order.confirmer?.fullName || 'Hệ thống'} - {order.confirmedAt ? formatDate(order.confirmedAt) : '---'}
                                        </span>
                                    </div>
                                )}
                                {!isInstallment && (
                                    <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hệ thống ghi nhận:</span>
                                        <span className="text-[10px] font-bold text-slate-500 italic">
                                            Tự động (Ngày tạo {formatDate(order.orderDate)})
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Splits Section */}
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
                            <div className="text-right">Hệ thống quản lý Ohari</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 print:hidden">
                    {/* Clean Rewards Summary Card */}
                    <div className="bg-white rounded-xl shadow-md border-2 border-slate-800 overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                            <CreditCard size={16} className="text-white" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-white">Tổng kết thu nhập</h3>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Revenue Share Row */}
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[11px] uppercase tracking-tight">Doanh số ghi nhận</span>
                                <span className="font-black text-lg text-slate-700">
                                    {(() => {
                                        const othersTotal = order.splits.reduce((sum, s) => sum + s.splitAmount, 0);
                                        return formatCurrency(totalAmount - othersTotal);
                                    })()}
                                </span>
                            </div>
                            {/* Commission Row */}
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[11px] uppercase tracking-tight">{commissionLabel}</span>
                                <span className="font-black text-lg text-emerald-600">
                                    {(() => {
                                        const totalComm = order.items.reduce((sum, item) => {
                                            const p = products.find(prod => prod.id === item.productId);
                                            if (!p) return sum;
                                            const rate = item.unitPrice < Number(p.minPrice) ? 0.01 : 0.018;
                                            return sum + (item.quantity * item.unitPrice * rate);
                                        }, 0);
                                        const othersTotal = order.splits.reduce((sum, s) => sum + s.splitAmount, 0);
                                        const myPercent = totalAmount > 0 ? (totalAmount - othersTotal) / totalAmount : 1;
                                        return formatCurrency(totalComm * myPercent);
                                    })()}
                                </span>
                            </div>

                            {/* Bonus Section */}
                            {(() => {
                                const totalBonus = order.items.reduce((sum, item) => {
                                    const p = products.find(prod => prod.id === item.productId);
                                    if (!p) return sum;

                                    const isHighEnd = p.isHighEnd || (p as any).is_high_end;
                                    const bonusRules = p.bonusRules || (p as any).bonus_rules;

                                    if (!isHighEnd || !bonusRules) return sum;

                                    const rule = (bonusRules as any[])
                                        .filter(r => Number(item.unitPrice) >= Number(r.minSellPrice || r.min_sell_price))
                                        .sort((a, b) => Number(b.minSellPrice || b.min_sell_price) - Number(a.minSellPrice || a.min_sell_price))[0];
                                    return sum + (rule ? Number(rule.bonusAmount || rule.bonus_amount) : 0) * item.quantity;
                                }, 0);

                                if (totalBonus === 0) return (
                                    <div className="py-1">
                                        <span className="text-[10px] text-slate-400 font-medium italic px-1">Chưa có thưởng nóng...</span>
                                    </div>
                                );

                                const sharedBonus = totalBonus / (order.splits.length + 1);

                                return (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-rose-50 p-1.5 rounded border border-rose-100">
                                            <span className="text-rose-700 font-black uppercase text-[9px] tracking-tight">Thưởng nóng</span>
                                            <span className="font-black text-base text-rose-800">
                                                {(() => {
                                                    const othersTotal = order.splits.reduce((sum, s) => sum + s.splitAmount, 0);
                                                    const myPercent = totalAmount > 0 ? (totalAmount - othersTotal) / totalAmount : 1;
                                                    return formatCurrency(totalBonus * myPercent);
                                                })()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                                <div className="text-[8px] text-slate-500 uppercase font-black mb-0.5 text-center">Sale (70%)</div>
                                                <div className="text-xs font-black text-slate-800 text-center">
                                                    {(() => {
                                                        const othersTotal = order.splits.reduce((sum, s) => sum + s.splitAmount, 0);
                                                        const myPercent = totalAmount > 0 ? (totalAmount - othersTotal) / totalAmount : 1;
                                                        return formatCurrency(totalBonus * myPercent * 0.7);
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                                <div className="text-[8px] text-slate-500 uppercase font-black mb-0.5 text-center">Quản lý (30%)</div>
                                                <div className="text-xs font-black text-slate-800 text-center">
                                                    {(() => {
                                                        const othersTotal = order.splits.reduce((sum, s) => sum + s.splitAmount, 0);
                                                        const myPercent = totalAmount > 0 ? (totalAmount - othersTotal) / totalAmount : 1;
                                                        return formatCurrency(totalBonus * myPercent * 0.3);
                                                    })()}
                                                </div>
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
                        totalOrderAmount={totalAmount}
                        onChange={(splits) => setOrder({ ...order, splits })}
                    />

                    <PaymentForm
                        payments={order.payments}
                        totalOrderAmount={totalAmount}
                        onChange={(payments) => setOrder({ ...order, payments })}
                        availableSystemImages={systemImages.filter(url => !order.payments.some(p => p.existingImages?.includes(url)))}
                        onAddSystemImage={(paymentIndex, url) => {
                            const newPayments = [...order.payments];
                            const existing = newPayments[paymentIndex].existingImages || [];
                            newPayments[paymentIndex] = { ...newPayments[paymentIndex], existingImages: [...existing, url] };
                            setOrder({ ...order, payments: newPayments });
                        }}
                    />

                    {/* Instructions Section */}
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                        <h4 className="font-bold text-rose-900 text-sm mb-2 flex items-center gap-2">
                            <Info size={16} /> Hướng dẫn
                        </h4>
                        <p className="text-xs text-rose-800 leading-relaxed">
                            Nhập thông tin khách hàng và sản phẩm vào hóa đơn.
                            Sử dụng các mục Chia doanh số và Thanh toán để hoàn tất nghiệp vụ.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
