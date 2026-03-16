"use client";

import { useState, useEffect } from 'react';
import {
    History,
    Search,
    Filter,
    ArrowUpCircle,
    ArrowDownCircle,
    ArrowRightLeft,
    RefreshCw,
    Calendar,
    ArrowRight,
    Loader2,
    Package,
    Building2,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('ALL');
    const [selectedType, setSelectedType] = useState('ALL');
    const { error: toastError } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transRes, branchRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stocks/transactions`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/branches`)
                ]);
                
                const transData = await transRes.json();
                const branchData = await branchRes.json();
                
                setTransactions(transData);
                setBranches(branchData);
            } catch (error) {
                toastError('Không thể tải lịch sử giao dịch');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        const matchSearch = (t.product.name + (t.orderId || '') + (t.serialNumber || '')).toLowerCase().includes(searchTerm.toLowerCase());
        const matchBranch = selectedBranch === 'ALL' ? true : t.branch.id === selectedBranch;
        const matchType = selectedType === 'ALL' ? true : t.type === selectedType;
        return matchSearch && matchBranch && matchType;
    });

    const getTransactionStyle = (type: string) => {
        switch (type) {
            case 'NEW_STOCK': return { icon: ArrowUpCircle, color: 'text-accent', bg: 'bg-emerald-50', label: 'Nhập kho' };
            case 'SALE': return { icon: ArrowDownCircle, color: 'text-primary', bg: 'bg-primary-subtle', label: 'Bán hàng' };
            case 'TRANSFER': return { icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Chuyển kho' };
            case 'RETURN': return { icon: RefreshCw, color: 'text-warning', bg: 'bg-amber-50', label: 'Thu hồi' };
            default: return { icon: History, color: 'text-slate-600', bg: 'bg-slate-50', label: type };
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto font-outfit">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                            <History size={32} />
                        </div>
                        Lịch sử giao dịch kho
                    </h1>
                    <p className="text-slate-500 font-medium">Theo dõi chi tiết các biến động hàng hóa: nhập, xuất, chuyển và thu hồi</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative group min-w-[300px] flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Mã đơn, Serial hoặc Tên SP..."
                            className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl w-full shadow-sm focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none font-bold text-sm transition-all"
                    >
                        <option value="ALL">Tất cả chi nhánh</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none font-bold text-sm transition-all"
                    >
                        <option value="ALL">Tất cả loại hình</option>
                        <option value="NEW_STOCK">Nhập kho mơi</option>
                        <option value="SALE">Bán lẻ / Trừ kho</option>
                        <option value="TRANSFER">Chuyển kho nội bộ</option>
                        <option value="RETURN">Thu hồi nâng cấp</option>
                    </select>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Thời gian</th>
                                <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Loại giao dịch</th>
                                <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Sản phẩm & Serial</th>
                                <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kho / Chi nhánh</th>
                                <th className="px-8 py-6 text-center text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Số lượng</th>
                                <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Liên kết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3, 4, 5, 6].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-7"><div className="h-4 bg-slate-100 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <History className="mx-auto text-slate-100 mb-4" size={64} />
                                        <p className="text-slate-400 font-black text-xl">Không tìm thấy giao dịch nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const style = getTransactionStyle(t.type);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{format(new Date(t.createdAt), 'dd MMMM, HH:mm', { locale: vi })}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{format(new Date(t.createdAt), 'yyyy')}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-tight",
                                                    style.bg, style.color
                                                )}>
                                                    <style.icon size={14} />
                                                    {style.label}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-slate-400" />
                                                        <span className="font-bold text-slate-900">{t.product.name}</span>
                                                    </div>
                                                    {t.serialNumber && (
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 ml-5 flex items-center gap-1">
                                                            <ArrowRight size={10} /> SN: {t.serialNumber === 'MULTIPLE' ? 'Nhiều số Serial' : t.serialNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-slate-400" />
                                                    <span className="font-medium text-slate-700">{t.branch.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={cn(
                                                    "font-black text-lg",
                                                    t.quantity > 0 ? "text-accent" : "text-primary"
                                                )}>
                                                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {t.orderId ? (
                                                    <a href={`/orders/${t.orderId}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase">
                                                        <FileText size={14} />
                                                        Chi tiết đơn
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic">— System —</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
