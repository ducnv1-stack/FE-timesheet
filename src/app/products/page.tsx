'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package,
    Gift as GiftIcon,
    TrendingUp,
    Plus,
    Search,
    Edit2,
    Trash2,
    ChevronRight,
    Star,
    AlertCircle,
    X,
    Save,
    Check
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// --- Types ---
interface Product {
    id: string;
    name: string;
    minPrice: number;
    isHighEnd: boolean;
    hotBonus: number;
    bonusRules: BonusRule[];
}

interface BonusRule {
    id?: string;
    minSellPrice: number;
    bonusAmount: number;
}

interface Gift {
    id: string;
    name: string;
    price: number;
}

export default function ProductsPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'gifts' | 'premium'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { success, error: toastError } = useToast();

    // Modal states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingGift, setEditingGift] = useState<Gift | null>(null);
    const [selectedProductForBonus, setSelectedProductForBonus] = useState<Product | null>(null);

    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, giftsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/gifts`)
            ]);
            const productsData = await productsRes.json();
            const giftsData = await giftsRes.json();
            setProducts(productsData);
            setGifts(giftsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toastError('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(user);
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'];
        if (!allowedRoles.includes(parsedUser.role?.code)) {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, []);

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                success('Xoá sản phẩm thành công');
                fetchData();
            }
        } catch (err) {
            toastError('Lỗi khi xoá sản phẩm');
        }
    };

    const handleDeleteGift = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xoá quà tặng này?')) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gifts/${id}`, { method: 'DELETE' });
            if (res.ok) {
                success('Xoá quà tặng thành công');
                fetchData();
            }
        } catch (err) {
            toastError('Lỗi khi xoá quà tặng');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredGifts = gifts.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const highEndProducts = products.filter(p => p.isHighEnd);

    return (
        <div className="min-h-screen bg-slate-50 p-3 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-600 rounded-xl shadow-lg shadow-rose-200">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-tight">Quản Lý Sản Phẩm</h1>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-none mt-1">Sản phẩm, quà tặng và chính sách thưởng</p>
                        </div>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {[
                            { id: 'products', label: 'Sản phẩm', icon: Package },
                            { id: 'gifts', label: 'Quà tặng', icon: GiftIcon },
                            { id: 'premium', label: 'Thưởng cao cấp', icon: TrendingUp }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-rose-600 text-white shadow-md scale-105'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Filters & Actions */}
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                            />
                        </div>
                        {activeTab !== 'premium' && (
                            <button
                                onClick={() => activeTab === 'products' ? setIsProductModalOpen(true) : setIsGiftModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 w-full md:w-auto justify-center active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm {activeTab === 'products' ? 'sản phẩm' : 'quà tặng'}
                            </button>
                        )}
                    </div>

                    {/* Content Views */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 gap-3">
                                <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Đang đồng bộ dữ liệu</p>
                            </div>
                        ) : activeTab === 'products' ? (
                            <ProductTable
                                products={filteredProducts}
                                onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
                                onDelete={handleDeleteProduct}
                            />
                        ) : activeTab === 'gifts' ? (
                            <GiftTable
                                gifts={filteredGifts}
                                onEdit={(g) => { setEditingGift(g); setIsGiftModalOpen(true); }}
                                onDelete={handleDeleteGift}
                            />
                        ) : (
                            <PremiumBonusView
                                products={highEndProducts}
                                onUpdateBonus={(p) => { setSelectedProductForBonus(p); setIsBonusModalOpen(true); }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modals --- */}
            {isProductModalOpen && (
                <ProductModal
                    isOpen={isProductModalOpen}
                    onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                    onSuccess={() => { setIsProductModalOpen(false); setEditingProduct(null); fetchData(); }}
                    product={editingProduct}
                />
            )}

            {isGiftModalOpen && (
                <GiftModal
                    isOpen={isGiftModalOpen}
                    onClose={() => { setIsGiftModalOpen(false); setEditingGift(null); }}
                    onSuccess={() => { setIsGiftModalOpen(false); setEditingGift(null); fetchData(); }}
                    gift={editingGift}
                />
            )}

            {isBonusModalOpen && selectedProductForBonus && (
                <BonusModal
                    product={selectedProductForBonus}
                    onClose={() => { setIsBonusModalOpen(false); setSelectedProductForBonus(null); }}
                    onSuccess={() => { setIsBonusModalOpen(false); setSelectedProductForBonus(null); fetchData(); }}
                />
            )}
        </div>
    );
}

// --- Helpers ---
const formatNumber = (val: number | null | undefined) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(val);
};

const parseNumber = (val: string) => {
    return Number(val.replace(/\D/g, '')) || 0;
};

// --- Sub-components ---

function ProductTable({ products, onEdit, onDelete }: { products: Product[], onEdit: (p: Product) => void, onDelete: (id: string) => void }) {
    if (products.length === 0) return <EmptyState label="sản phẩm" />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên sản phẩm</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá tối thiểu</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại hàng</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Thưởng nóng</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {products.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-800">{product.name}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-rose-600">
                                {new Intl.NumberFormat('vi-VN').format(product.minPrice)}đ
                            </td>
                            <td className="px-6 py-4">
                                {product.isHighEnd ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100 uppercase tracking-wider">
                                        <Star className="w-3 h-3 fill-current" /> Cao cấp
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black border border-slate-200 uppercase tracking-wider">Phổ thông</span>
                                )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-rose-500">
                                {product.hotBonus > 0 ? `${new Intl.NumberFormat('vi-VN').format(product.hotBonus)}đ` : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button onClick={() => onEdit(product)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function GiftTable({ gifts, onEdit, onDelete }: { gifts: Gift[], onEdit: (g: Gift) => void, onDelete: (id: string) => void }) {
    if (gifts.length === 0) return <EmptyState label="quà tặng" icon={<GiftIcon className="w-12 h-12 text-slate-200" />} />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên quà tặng</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá quy đổi</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {gifts.map(gift => (
                        <tr key={gift.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-800">{gift.name}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600">
                                {new Intl.NumberFormat('vi-VN').format(gift.price)}đ
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                    <button onClick={() => onEdit(gift)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDelete(gift.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PremiumBonusView({ products, onUpdateBonus }: { products: Product[], onUpdateBonus: (p: Product) => void }) {
    if (products.length === 0) return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300 ring-4 ring-white shadow-inner">
                <Star className="w-10 h-10" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">Chưa có sản phẩm cao cấp</h3>
            <p className="text-slate-500 text-xs max-w-xs leading-relaxed">Hãy đánh dấu "Cao cấp" cho một vài sản phẩm để bắt đầu thiết lập các quy tắc thưởng bậc thang.</p>
        </div>
    );

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-3xl border border-slate-100 p-5 hover:border-rose-100 transition-all hover:shadow-xl group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-colors" />

                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 group-hover:border-rose-200 group-hover:scale-110 transition-all shadow-sm">
                                    <TrendingUp className="w-4 h-4 text-rose-600" />
                                </div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{product.name}</h3>
                            </div>
                            <button
                                onClick={() => onUpdateBonus(product)}
                                className="text-[10px] font-black text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 px-4 py-2 rounded-xl uppercase tracking-widest transition-all active:scale-90"
                            >
                                + Thiết lập
                            </button>
                        </div>

                        <div className="space-y-2 relative z-10">
                            {product.bonusRules.length > 0 ? (
                                product.bonusRules.sort((a, b) => a.minSellPrice - b.minSellPrice).map((rule, idx) => (
                                    <div key={rule.id || idx} className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white shadow-sm transition-all hover:scale-[1.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Giá ≥</span>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {new Intl.NumberFormat('vi-VN').format(rule.minSellPrice)}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-slate-300" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-tight">Thưởng</span>
                                                <span className="text-xs font-black text-rose-600">
                                                    {new Intl.NumberFormat('vi-VN').format(rule.bonusAmount)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center bg-white/40 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Chưa có quy tắc</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Modals implementation ---

function ProductModal({ isOpen, onClose, onSuccess, product }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, product?: Product | null }) {
    const [name, setName] = useState(product?.name || '');
    const [minPrice, setMinPrice] = useState(product?.minPrice || 0);
    const [isHighEnd, setIsHighEnd] = useState(product?.isHighEnd || false);
    const [hotBonus, setHotBonus] = useState(product?.hotBonus || 0);
    const [submitting, setSubmitting] = useState(false);
    const { success, error } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = product
                ? `${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/products`;
            const method = product ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    minPrice: Number(minPrice),
                    isHighEnd: Boolean(isHighEnd),
                    hotBonus: Number(hotBonus)
                })
            });

            if (res.ok) {
                success(`${product ? 'Cập nhật' : 'Thêm'} sản phẩm thành công`);
                onSuccess();
            } else {
                error('Có lỗi xảy ra');
            }
        } catch (err) {
            error('Lỗi kết nối server');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-widest">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên sản phẩm</label>
                        <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-500 font-bold text-sm" placeholder="VD: Khóa vân tay Ohari S1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Giá tối thiểu</label>
                            <input type="text" required value={formatNumber(minPrice)} onChange={e => setMinPrice(parseNumber(e.target.value))} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-500 font-mono text-sm font-bold" placeholder="Nhập giá..." />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Thưởng nóng (nếu có)</label>
                            <input type="text" value={formatNumber(hotBonus)} onChange={e => setHotBonus(parseNumber(e.target.value))} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-500 font-mono text-sm font-bold" placeholder="Nhập mức thưởng..." />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                        <input type="checkbox" id="highend" checked={isHighEnd} onChange={e => setIsHighEnd(e.target.checked)} className="w-5 h-5 rounded-lg border-rose-200 text-rose-600 focus:ring-rose-500 transition-all cursor-pointer" />
                        <label htmlFor="highend" className="text-xs font-black text-rose-700 cursor-pointer select-none uppercase tracking-widest">Sản phẩm cao cấp</label>
                        <Star className={`w-4 h-4 ml-auto ${isHighEnd ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                    </div>
                    <div className="pt-2">
                        <button disabled={submitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-100 hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            {product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function GiftModal({ isOpen, onClose, onSuccess, gift }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, gift?: Gift | null }) {
    const [name, setName] = useState(gift?.name || '');
    const [price, setPrice] = useState(gift?.price || 0);
    const [submitting, setSubmitting] = useState(false);
    const { success, error } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = gift
                ? `${process.env.NEXT_PUBLIC_API_URL}/gifts/${gift.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/gifts`;
            const method = gift ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    price: Number(price)
                })
            });

            if (res.ok) {
                success(`${gift ? 'Cập nhật' : 'Thêm'} quà tặng thành công`);
                onSuccess();
            } else {
                error('Có lỗi xảy ra');
            }
        } catch (err) {
            error('Lỗi kết nối server');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-widest">{gift ? 'Sửa quà tặng' : 'Thêm quà tặng mới'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên quà tặng</label>
                        <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-500 font-bold text-sm" placeholder="VD: Mũ bảo hiểm Ohari" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Giá trị quy đổi</label>
                        <input type="text" required value={formatNumber(price)} onChange={e => setPrice(parseNumber(e.target.value))} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-500 font-mono text-sm font-bold" placeholder="Nhập giá trị..." />
                    </div>
                    <div className="pt-2">
                        <button disabled={submitting} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            {gift ? 'Lưu thay đổi' : 'Thêm quà tặng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BonusModal({ product, onClose, onSuccess }: { product: Product, onClose: () => void, onSuccess: () => void }) {
    const [rules, setRules] = useState<BonusRule[]>(product.bonusRules || []);
    const [submitting, setSubmitting] = useState(false);
    const { success, error } = useToast();

    const addRule = () => {
        setRules([...rules, { minSellPrice: 0, bonusAmount: 0 }]);
    };

    const removeRule = (idx: number) => {
        setRules(rules.filter((_, i) => i !== idx));
    };

    const updateRule = (idx: number, field: keyof BonusRule, value: number) => {
        const newRules = [...rules];
        newRules[idx] = { ...newRules[idx], [field]: value };
        setRules(newRules);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bonusRules: rules.map(rule => ({
                        minSellPrice: Number(rule.minSellPrice),
                        bonusAmount: Number(rule.bonusAmount),
                        salePercent: Number((rule as any).salePercent || 0),
                        managerPercent: Number((rule as any).managerPercent || 0)
                    }))
                })
            });

            if (res.ok) {
                success('Cập nhật quy tắc thưởng thành công');
                onSuccess();
            } else {
                error('Có lỗi xảy ra');
            }
        } catch (err) {
            error('Lỗi kết nối server');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Thiết lập thưởng nóng</h2>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Sản phẩm: {product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 mb-6 scrollbar-thin scrollbar-thumb-slate-200">
                        {rules.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa có quy tắc nào</p>
                            </div>
                        ) : (
                            rules.sort((a, b) => a.minSellPrice - b.minSellPrice).map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                    <div className="flex-1">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Giá bán từ (đ)</label>
                                        <input type="text" value={formatNumber(rule.minSellPrice)} onChange={e => updateRule(idx, 'minSellPrice', parseNumber(e.target.value))} className="w-full px-3 py-2 bg-white rounded-xl border-none focus:ring-1 focus:ring-rose-500 font-mono text-xs font-bold shadow-sm" placeholder="Nhập giá..." />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1 ml-1">Mức thưởng (đ)</label>
                                        <input type="text" value={formatNumber(rule.bonusAmount)} onChange={e => updateRule(idx, 'bonusAmount', parseNumber(e.target.value))} className="w-full px-3 py-2 bg-rose-50/30 rounded-xl border-none focus:ring-1 focus:ring-rose-500 font-mono text-xs font-black text-rose-600 shadow-sm" placeholder="Nhập thưởng..." />
                                    </div>
                                    <button type="button" onClick={() => removeRule(idx)} className="mt-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button type="button" onClick={addRule} className="flex-1 py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50/30 transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Thêm mức mới
                        </button>
                        <button disabled={submitting} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                            {submitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            Lưu tất cả
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EmptyState({ label, icon }: { label: string, icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center h-[500px] gap-4 bg-slate-50/30">
            {icon || <Package className="w-16 h-16 text-slate-100" />}
            <div className="text-center">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic leading-none mb-1">Dễ thở nào!</p>
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Chưa có {label} nào được thiết lập</p>
            </div>
        </div>
    );
}
