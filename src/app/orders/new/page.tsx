"use client";

import { useState, useEffect } from 'react';
import { Save, ShoppingCart, User, Info, CreditCard, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

import { formatCurrency, cn } from '@/lib/utils';
import ItemGrid from '@/components/orders/ItemGrid';
import SplitManager from '@/components/orders/SplitManager';
import PaymentForm from '@/components/orders/PaymentForm';
import { FullOrder, Product, Employee, Branch } from '@/types/order';



export default function NewOrderPage() {
    const { success, error: toastError } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [driverTab, setDriverTab] = useState<'staff' | 'driver'>('driver');

    const [order, setOrder] = useState<FullOrder>({
        branchId: '',
        staffCode: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        customerCardNumber: '',
        customerCardIssueDate: '',
        orderDate: new Date().toISOString().split('T')[0],
        orderSource: 'HOTLINE',
        giftAmount: 0,
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
        splits: [], // Start with empty splits as requested
        payments: [{ paymentMethod: 'TRANSFER', amount: 0, paidAt: new Date().toISOString().split('T')[0] }],
        driverId: '',
        driverType: 'internal'
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
                const [branchesRes, productsRes, employeesRes] = await Promise.all([
                    fetch(`${apiUrl}/branches`),
                    fetch(`${apiUrl}/products`),
                    fetch(`${apiUrl}/employees`)
                ]);
                const branchesData = await branchesRes.json();
                const productsData = await productsRes.json();
                const employeesData = await employeesRes.json();

                setBranches(branchesData);
                setProducts(productsData);
                setAllEmployees(employeesData);

                // Auto-fill from logged-in user
                const storedUser = localStorage.getItem('user');
                if (!storedUser) {
                    router.push('/login');
                    return;
                }

                const user = JSON.parse(storedUser);
                const userRole = typeof user.role === 'object' ? (user.role.code || user.role.name) : user.role;
                if (userRole === 'DRIVER') {
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

    const headerEmployees = allEmployees.filter(e => e.branchId === order.branchId);

    const totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = totalAmount - paidAmount;

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
        if (!order.customerAddress) {
            toastError('Vui lòng nhập địa chỉ khách hàng');
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
            // Prepare payload with only valid items
            const payload: any = {
                ...order,
                items: validItems
            };

            // Clean up optional fields that might be empty strings
            if (!payload.staffCode) delete payload.staffCode;
            if (!payload.note) delete payload.note;
            if (!payload.customerAddress) delete payload.customerAddress;
            if (!payload.customerCardNumber) delete payload.customerCardNumber;
            if (!payload.customerCardIssueDate) delete payload.customerCardIssueDate;
            if (!payload.driverId) delete payload.driverId;

            // Calculate total again from valid items for safety
            const finalTotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            // Auto-calculate equal splits
            const totalPeople = order.splits.length + 1;
            const splitPercent = 100 / totalPeople;
            const splitAmount = finalTotal / totalPeople;

            const creatorSplit = {
                employeeId: order.staffCode || '',
                branchId: order.branchId,
                splitPercent,
                splitAmount
            };

            // Ensure creatorSplit has valid IDs before proceeding
            if (!creatorSplit.employeeId) {
                toastError('Không xác định được nhân viên tạo đơn. Vui lòng chọn nhân viên.');
                setLoading(false);
                return;
            }

            const otherSplits = order.splits.map(s => ({
                ...s,
                splitPercent,
                splitAmount
            }));

            // Add createdBy from logged-in user
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                payload.createdBy = user.id;
            }

            payload.splits = [creatorSplit, ...otherSplits];

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
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 pb-24 print:pb-0 print:px-0 print:max-w-none">
            <div className="flex items-center justify-end mb-6">
                <div className="flex gap-3 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-slate-800 rounded font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        In hóa đơn
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-lg shadow-rose-200 transition-all active:scale-95 cursor-pointer"
                    >
                        {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu Đơn</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 xl:gap-8 print:block">
                {/* Main Invoice Section */}
                <div id="invoice-paper" className="bg-white border-2 border-slate-800 p-5 md:p-8 shadow-2xl relative print:p-0 print:border-none print:shadow-none print:w-full">
                    {/* Top decoration line: Absolute for UI, Static for Print to ensure no overlap */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-700 print:hidden"></div>
                    <div className="hidden print:block w-full h-3 bg-rose-700 mb-8"></div>

                    {/* Brand Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-4">
                            <img src="/logo.png" alt="Ohari Logo" className="h-12 w-auto object-contain" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Công ty TNHH OHARI Việt Nam</p>
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

                    <div className="w-full h-0.5 bg-slate-100 mb-8"></div>

                    <h1 className="text-xl md:text-2xl font-black text-center text-slate-900 border-b-2 border-slate-800 pb-3 mb-6 md:mb-8 uppercase tracking-[0.2em] print:mt-4">
                        Hóa đơn bán hàng
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm">
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Chi nhánh:</span>
                            <select
                                value={order.branchId}
                                onChange={(e) => setOrder({ ...order, branchId: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nhân viên:</span>
                            <select
                                value={order.staffCode || ''}
                                onChange={(e) => setOrder({ ...order, staffCode: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
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
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
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
                            <input
                                type="text"
                                value={order.customerAddress || ''}
                                onChange={(e) => setOrder({ ...order, customerAddress: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                                placeholder="Số nhà, đường, phường/xã..."
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
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                            />
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center border-b border-slate-100 py-1">
                            <span className="font-bold text-slate-600">Nguồn đơn:</span>
                            <select
                                value={order.orderSource}
                                onChange={(e) => setOrder({ ...order, orderSource: e.target.value })}
                                className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900"
                            >
                                <option value="HOTLINE">HOTLINE</option>
                                <option value="FACEBOOK">FACEBOOK</option>
                                <option value="WEBSITE">WEBSITE</option>
                                <option value="ZALO">ZALO</option>
                                <option value="WALKIN">Vãng lai</option>
                                <option value="REFERRAL">Giới thiệu</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-start border-b border-slate-100 py-2">
                            <span className="font-bold text-slate-600 mt-1">Giao hàng:</span>
                            <div className="space-y-2">
                                <div className="flex gap-1 p-0.5 bg-slate-100 rounded-md w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setDriverTab('driver')}
                                        className={cn(
                                            "px-3 py-1 text-[10px] font-bold rounded transition-all",
                                            driverTab === 'driver' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Lái xe (+50k)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDriverTab('staff')}
                                        className={cn(
                                            "px-3 py-1 text-[10px] font-bold rounded transition-all",
                                            driverTab === 'staff' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Nhân viên (+100k)
                                    </button>
                                </div>
                                <select
                                    value={order.driverId || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setOrder({
                                            ...order,
                                            driverId: val,
                                            driverType: driverTab === 'staff' ? 'sale' : 'internal'
                                        });
                                    }}
                                    className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 w-full"
                                >
                                    <option value="">-- Chọn người giao --</option>
                                    {allEmployees
                                        .filter(e => {
                                            const isDriver = e.department === 'Lái xe' || e.position === 'driver' || e.isInternalDriver;
                                            return driverTab === 'driver' ? isDriver : !isDriver;
                                        })
                                        .map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <ItemGrid
                            items={order.items}
                            products={products}
                            onChange={(items) => setOrder({ ...order, items })}
                        />
                    </div>

                    <div className="flex flex-col items-end space-y-2 text-sm">
                        <div className="grid grid-cols-[150px_200px] border-b border-slate-200 py-1">
                            <span className="font-bold text-slate-600">Tổng cộng:</span>
                            <span className="text-right font-black text-lg text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[150px_200px] border-b border-slate-200 py-1 text-emerald-600">
                            <span className="font-bold">Đã thanh toán:</span>
                            <span className="text-right font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paidAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[150px_200px] py-1 text-red-600">
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
                                                    Doanh số: {formatCurrency(totalAmount / (order.splits.length + 1))}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-8 flex justify-between items-start italic text-[10px] text-slate-400 border-t border-slate-100">
                            <div>
                                * Ngày in: {isMounted ? `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}` : '...'}
                            </div>
                            <div className="text-right">Hệ thống quản lý Ohari</div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Secondary Controls */}
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
                                    {formatCurrency(totalAmount / (order.splits.length + 1))}
                                </span>
                            </div>
                            {/* Commission Row */}
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-[11px] uppercase tracking-tight">{commissionLabel}</span>
                                <span className="font-black text-lg text-emerald-600">
                                    {formatCurrency(order.items.reduce((sum, item) => {
                                        const p = products.find(prod => prod.id === item.productId);
                                        if (!p) return sum;
                                        const rate = item.unitPrice < p.minPrice ? 0.01 : 0.018;
                                        return sum + (item.quantity * item.unitPrice * rate);
                                    }, 0) / (order.splits.length + 1))}
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
                                        <div className="flex justify-between items-center bg-indigo-50 p-2 rounded border border-indigo-100">
                                            <span className="text-indigo-700 font-black uppercase text-[11px] tracking-tight">Thưởng nóng</span>
                                            <span className="font-black text-xl text-indigo-800">{formatCurrency(sharedBonus)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-0.5 text-center">Sale (70%)</div>
                                                <div className="text-sm font-black text-slate-800 text-center">{formatCurrency(sharedBonus * 0.7)}</div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-0.5 text-center">Quản lý (30%)</div>
                                                <div className="text-sm font-black text-slate-800 text-center">{formatCurrency(sharedBonus * 0.3)}</div>
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
