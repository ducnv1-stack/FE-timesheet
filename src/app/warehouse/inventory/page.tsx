"use client";

import { useState, useEffect } from 'react';
import {
    Search,
    Warehouse,
    Package,
    ArrowUpDown,
    Filter,
    ArrowRightLeft,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Building2,
    LayoutGrid,
    Loader2,
    Plus,
    Save,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('ALL');
    const { error: toastError, success: toastSuccess } = useToast();

    // Import Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [importData, setImportData] = useState({
        productId: '',
        branchId: '',
        quantity: 1,
        serials: '',
        note: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, branchRes, productRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/stocks/inventory`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)
            ]);
            
            const invData = await invRes.json();
            const branchData = await branchRes.json();
            const productData = await productRes.json();
            
            setInventory(invData);
            setBranches(branchData);
            setProducts(productData);
        } catch (error) {
            toastError('Không thể tải dữ liệu tồn kho');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setSaving('IMPORT');
        try {
            const serialList = importData.serials.split(',').map(s => s.trim()).filter(s => s);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stocks/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'IMPORT',
                    toBranchId: importData.branchId,
                    productId: importData.productId,
                    quantity: importData.quantity,
                    serialNumbers: serialList,
                    note: importData.note
                })
            });

            if (!response.ok) throw new Error('Failed to import');
            
            toastSuccess('Nhập kho thành công');
            setIsImportModalOpen(false);
            setImportData({ productId: '', branchId: '', quantity: 1, serials: '', note: '' });
            fetchData();
        } catch (error) {
            toastError('Lỗi khi nhập kho');
        } finally {
            setSaving(null);
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBranch = selectedBranch === 'ALL' ? true : item.branch.id === selectedBranch;
        return matchSearch && matchBranch;
    });

    // Group inventory by product for "Total Stock" view if needed
    const totalByProduct = inventory.reduce((acc: any, item: any) => {
        if (!acc[item.product.id]) {
            acc[item.product.id] = { ...item.product, total: 0 };
        }
        acc[item.product.id].total += item.quantity;
        return acc;
    }, {});

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto font-outfit">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-primary-subtle rounded-2xl text-primary">
                            <Warehouse size={28} />
                        </div>
                        Tồn kho chi tiết
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Theo dõi số lượng hàng hóa thực tế tại các chi nhánh và kho tổng</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-light transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên sản phẩm..."
                            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 shadow-sm focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none font-bold text-sm transition-all"
                    >
                        <option value="ALL">Tất cả kho bãi</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.branchType === 'KHO_TONG' ? '📦 ' : '🏢 '} {b.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white rounded-2xl font-bold tracking-tight hover:bg-primary-light transition-all shadow-xl shadow-primary-subtle active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={20} />
                        Nhập kho
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary-subtle text-primary rounded-2xl"><Package size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-none mb-1">Tổng sản phẩm</p>
                        <p className="text-2xl font-bold text-slate-900">{Object.keys(totalByProduct).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-accent rounded-2xl"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-none mb-1">Tổng tồn kho</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary-subtle text-primary rounded-2xl"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-none mb-1">Sắp hết hàng</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {inventory.filter(i => i.quantity <= 2).length}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex items-center gap-4 text-white">
                    <div className="p-3 bg-white/10 rounded-2xl"><Search size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-none mb-1">Đang hiển thị</p>
                        <p className="text-2xl font-bold">{filteredInventory.length} dòng</p>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-left text-xs font-bold text-slate-400 tracking-widest">Sản phẩm</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-slate-400 tracking-widest">Vị trí kho</th>
                                <th className="px-8 py-6 text-center text-xs font-bold text-slate-400 tracking-widest">Số lượng tồn</th>
                                <th className="px-8 py-6 text-left text-xs font-bold text-slate-400 tracking-widest">Trạng thái</th>
                                <th className="px-8 py-6 text-right text-xs font-bold text-slate-400 tracking-widest">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">
                                        Không tìm thấy dữ liệu tồn kho phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4 focus:outline-none">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-subtle group-hover:text-primary transition-all font-bold">
                                                    {item.product.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.product.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">ID: {item.product.id.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    item.branch.branchType === 'KHO_TONG' ? "bg-slate-100 text-slate-600" : "bg-primary-subtle text-primary"
                                                )}>
                                                    {item.branch.branchType === 'KHO_TONG' ? <Warehouse size={16} /> : <Building2 size={16} />}
                                                </div>
                                                <p className="font-bold text-slate-700">{item.branch.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={cn(
                                                "inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full font-bold text-sm transition-all",
                                                item.quantity <= 2 ? "bg-primary-subtle text-primary" : 
                                                item.quantity <= 10 ? "bg-amber-100 text-warning" : 
                                                "bg-emerald-100 text-accent"
                                            )}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {item.quantity <= 2 ? (
                                                <span className="flex items-center gap-1.5 text-primary text-xs font-bold tracking-tight">
                                                    <AlertTriangle size={14} /> Sắp hết hàng
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-accent text-xs font-bold tracking-tight">
                                                    <CheckCircle2 size={14} /> Sẵn sàng
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right font-outfit">
                                            <button className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                                                <ArrowRightLeft size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => setIsImportModalOpen(false)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-10 space-y-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                <Plus className="text-primary" />
                                Nhập kho sản phẩm
                            </h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"><X /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Sản phẩm</label>
                                <select 
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none transition-all"
                                    value={importData.productId}
                                    onChange={e => setImportData({ ...importData, productId: e.target.value })}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Kho nhận</label>
                                <select 
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none transition-all"
                                    value={importData.branchId}
                                    onChange={e => setImportData({ ...importData, branchId: e.target.value })}
                                >
                                    <option value="">-- Chọn kho --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Số lượng</label>
                                <input 
                                    type="number"
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none transition-all"
                                    value={importData.quantity}
                                    onChange={e => setImportData({ ...importData, quantity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Số Serial (Cố định bằng "," nếu có)</label>
                                <input 
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none transition-all"
                                    placeholder="SN123, SN456..."
                                    value={importData.serials}
                                    onChange={e => setImportData({ ...importData, serials: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest px-1">Ghi chú</label>
                            <textarea 
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-primary-light/10 focus:border-primary outline-none transition-all h-24 resize-none"
                                value={importData.note}
                                onChange={e => setImportData({ ...importData, note: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsImportModalOpen(false)} className="flex-1 px-8 py-3 text-slate-500 font-bold tracking-tight hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">Hủy</button>
                            <button 
                                onClick={handleImport}
                                disabled={saving === 'IMPORT' || !importData.productId || !importData.branchId || !importData.quantity}
                                className="flex-[2] px-8 py-3 bg-primary text-white font-bold tracking-tight rounded-2xl shadow-xl shadow-primary-subtle hover:bg-primary-light transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {saving === 'IMPORT' ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                Xác nhận nhập kho
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
