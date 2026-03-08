"use client";

import { useState, useEffect } from 'react';
import { Save, ShoppingCart, User, Info, CreditCard, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

import { formatCurrency, cn, formatDateTime } from '@/lib/utils';
import ItemGrid from '@/components/orders/ItemGrid';
import GiftGrid from '@/components/orders/GiftGrid';
import SplitManager from '@/components/orders/SplitManager';
import PaymentForm from '@/components/orders/PaymentForm';
import AddressSelector from '@/components/orders/AddressSelector';
import EmployeeSearchSelector from '@/components/orders/EmployeeSearchSelector';
import { FullOrder, Product, Employee, Branch, Gift } from '@/types/order';



export default function NewOrderPage() {
    const { success, error: toastError } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [allGifts, setAllGifts] = useState<Gift[]>([]);
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
        splits: [], // Start with empty splits as requested
        payments: [{ paymentMethod: 'CASH', amount: 0, paidAt: new Date().toISOString().split('T')[0] }],
        deliveries: []
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
                const [branchesRes, productsRes, employeesRes, giftsRes] = await Promise.all([
                    fetch(`${apiUrl}/branches`),
                    fetch(`${apiUrl}/products`),
                    fetch(`${apiUrl}/employees`),
                    fetch(`${apiUrl}/gifts`)
                ]);
                const branchesData = await branchesRes.json();
                const productsData = await productsRes.json();
                const employeesData = await employeesRes.json();
                const giftsData = await giftsRes.json();

                setBranches(branchesData);
                setProducts(productsData);
                setAllEmployees(employeesData);
                setAllGifts(giftsData);

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
                    setOrder(prev => ({
                        ...prev,
                        branchId: user.employee.branchId || (branchesData.length > 0 ? branchesData[0].id : ''),
                        staffCode: user.employee.id || '',
                    }));
                } else if (branchesData.length > 0) {
                    setOrder(prev => ({ ...prev, branchId: branchesData[0].id }));
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchInitialData();
        setIsMounted(true);
    }, [router]);

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
            const minPrice = Number(p.minPrice || (p as any).min_price || 0);
            return item.unitPrice < minPrice ? 1 : 1.8;
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

        // Check for empty product selection
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
            // Prepare payload with clean data
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
                }))
            };

            // Clean up optional fields that might be empty strings
            if (!payload.staffCode) delete payload.staffCode;
            if (!payload.note) delete payload.note;
            if (!payload.customerAddress) delete payload.customerAddress;
            if (!payload.customerCardNumber) delete payload.customerCardNumber;
            if (!payload.customerCardIssueDate) delete payload.customerCardIssueDate;
            // Clean deliveries to only send DTO-compatible fields
            if (payload.deliveries && payload.deliveries.length > 0) {
                payload.deliveries = payload.deliveries.map((d: any) => ({
                    category: d.category,
                    ...(d.driverId ? { driverId: d.driverId } : {}),
                }));
            } else {
                delete payload.deliveries;
            }

            // Calculate total again from valid items for safety
            const finalTotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const finalGiftAmount = payload.gifts.reduce((sum: number, g: any) => {
                const giftInfo = allGifts.find(gift => gift.id === g.giftId);
                return sum + (g.quantity * (giftInfo?.price || 0));
            }, 0);

            payload.giftAmount = finalGiftAmount;
            payload.totalAmount = finalTotal;

            // Method 2: Manual amounts for splits, rest for creator
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

            // Ensure creatorSplit has valid IDs before proceeding
            if (!creatorSplit.employeeId) {
                toastError('Không xác định được nhân viên tạo đơn. Vui lòng chọn nhân viên.');
                setLoading(false);
                return;
            }

            // Other splits are already cleaned in SplitManager, just ensure they are sent as is
            const otherSplits = order.splits;

            // Add createdBy from logged-in user
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                payload.createdBy = user.id;
            }

            payload.splits = [creatorSplit, ...otherSplits];

            // Omit province and ward objects from the payload if they exist
            delete payload.province;
            delete payload.ward;

            const res = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save order');

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
                        className="flex items-center gap-2 px-6 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white rounded font-bold shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer text-sm"
                    >
                        {loading ? 'Đang lưu...' : <><Save size={16} /> Lưu Đơn</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 xl:gap-4 print:block">
                {/* Main Invoice Section */}
                <div id="invoice-paper" className="w-full max-w-[210mm] bg-white border-2 p-4 md:p-6 shadow-2xl relative overflow-hidden print:shadow-none print:p-[10mm] print:border-none print:m-auto transition-all">
                    {/* Top decoration line: Absolute for UI, Static for Print to ensure no overlap */}
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
                        Hóa đơn bán hàng
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 mb-6 text-sm">
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Chi nhánh:</span>
                            <select
                                value={order.branchId}
                                onChange={(e) => setOrder({ ...order, branchId: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 appearance-none print:appearance-none cursor-pointer"
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nhân viên:</span>
                            <select
                                value={order.staffCode || ''}
                                onChange={(e) => setOrder({ ...order, staffCode: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 appearance-none print:appearance-none cursor-pointer"
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
                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 w-full outline-none focus:ring-1 focus:ring-rose-200 appearance-none print:appearance-none print:bg-transparent print:border-none print:p-0 print:text-[11px] cursor-pointer"
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
                                                {p.paymentMethod === 'CASH' ? '💰 Tiền mặt' : p.paymentMethod === 'TRANSFER' ? '🏦 Chuyển khoản' : '💳 Quẹt thẻ'} ({p.paidAt})
                                            </span>
                                            <span className="text-sm font-black">{formatCurrency(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
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

                {/* Right Column - Secondary Controls */}
                <div className="space-y-8 print:hidden">
                    {/* Clean Rewards Summary Card */}
                    <div className="bg-white rounded-xl shadow-md border-2 border-slate-800 overflow-hidden">
                        <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-2">
                            <CreditCard size={14} className="text-white" />
                            <h3 className="font-bold text-[10px] uppercase tracking-wider text-white">Tổng kết thu nhập</h3>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Revenue Share Row */}
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[9px] uppercase tracking-tight">Doanh số ghi nhận</span>
                                <span className="font-black text-base text-slate-700">
                                    {formatCurrency(totalProductAmount - order.splits.reduce((sum, s) => sum + s.splitAmount, 0))}
                                </span>
                            </div>
                            {/* Commission Row */}
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[9px] uppercase tracking-tight">{commissionLabel}</span>
                                <span className="font-black text-base text-emerald-600">
                                    {formatCurrency(order.items.reduce((sum, item) => {
                                        const p = products.find(prod => prod.id === item.productId);
                                        if (!p) return sum;
                                        const rate = item.unitPrice < p.minPrice ? 0.01 : 0.018;
                                        const itemTotal = item.quantity * item.unitPrice;
                                        // Calculate share of this item for creator
                                        const creatorShare = totalProductAmount > 0 ? (totalProductAmount - order.splits.reduce((sSum, s) => sSum + s.splitAmount, 0)) / totalProductAmount : 1;
                                        const commissionFactor = totalProductAmount > 0 ? (netRevenue / totalProductAmount) : 1;
                                        return sum + (itemTotal * rate * creatorShare * commissionFactor);
                                    }, 0))}
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

                                const creatorShare = totalProductAmount > 0 ? (totalProductAmount - order.splits.reduce((sSum, s) => sSum + s.splitAmount, 0)) / totalProductAmount : 1;
                                const sharedBonus = totalBonus * creatorShare;

                                return (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-rose-50 p-1.5 rounded border border-rose-100">
                                            <span className="text-rose-700 font-black uppercase text-[9px] tracking-tight">Thưởng nóng</span>
                                            <span className="font-black text-base text-rose-800">{formatCurrency(sharedBonus)}</span>
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

                    {/* Note Info */}
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
        </div >
    );
}
