"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Truck,
    Plus,
    Save,
    Trash2,
    X,
    Building2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';

// Category mapping
const CATEGORY_LABELS: Record<string, string> = {
    'COMPANY_DRIVER': 'Tài xế công ty',
    'EXTERNAL_DRIVER': 'Tài xế ngoài',
    'STAFF_DELIVERER': 'Nhân viên giao',
    'SELLING_SALE': 'Sale tự giao',
    'OTHER_SALE': 'Sale khác',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

interface DeliveryFeeRule {
    id: string;
    branchId: string | null;
    deliveryCategory: string;
    feeAmount: number;
    isActive: boolean;
    branch?: { id: string; code: string; name: string } | null;
}

interface Branch {
    id: string;
    code: string;
    name: string;
}

export default function DeliveryFeesPage() {
    const [rules, setRules] = useState<DeliveryFeeRule[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<DeliveryFeeRule | null>(null);
    const [deleteRule, setDeleteRule] = useState<DeliveryFeeRule | null>(null);
    const [user, setUser] = useState<any>(null);

    // Form state
    const [formBranchId, setFormBranchId] = useState<string>('');
    const [formCategory, setFormCategory] = useState<string>(CATEGORIES[0]);
    const [formFeeAmount, setFormFeeAmount] = useState<string>('0');

    const { error: toastError, success } = useToast();
    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            const role = typeof u.role === 'object' ? u.role.code : u.role;
            if (!['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT'].includes(role)) {
                router.push('/dashboard');
                return;
            }
            setUser(u);
        } else {
            router.push('/login');
        }
    }, []);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, branchesRes] = await Promise.all([
                fetch(`${apiUrl}/delivery-fee-rules`),
                fetch(`${apiUrl}/branches`),
            ]);
            if (rulesRes.ok) setRules(await rulesRes.json());
            if (branchesRes.ok) setBranches(await branchesRes.json());
        } catch {
            toastError('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingRule(null);
        setFormBranchId('');
        setFormCategory(CATEGORIES[0]);
        setFormFeeAmount('0');
        setShowModal(true);
    };

    const openEdit = (rule: DeliveryFeeRule) => {
        setEditingRule(rule);
        setFormBranchId(rule.branchId || '');
        setFormCategory(rule.deliveryCategory);
        setFormFeeAmount(String(rule.feeAmount));
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRule) {
                const res = await fetch(`${apiUrl}/delivery-fee-rules/${editingRule.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feeAmount: Number(formFeeAmount) }),
                });
                if (!res.ok) throw new Error('Failed to update');
                success('Cập nhật thành công');
            } else {
                const res = await fetch(`${apiUrl}/delivery-fee-rules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        branchId: formBranchId || undefined,
                        deliveryCategory: formCategory,
                        feeAmount: Number(formFeeAmount),
                    }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Failed to create');
                }
                success('Thêm quy tắc thành công');
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            toastError(err.message || 'Lỗi khi lưu');
        }
    };

    const handleToggleActive = async (rule: DeliveryFeeRule) => {
        try {
            const res = await fetch(`${apiUrl}/delivery-fee-rules/${rule.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !rule.isActive }),
            });
            if (!res.ok) throw new Error('Failed');
            success(rule.isActive ? 'Đã tắt quy tắc' : 'Đã bật quy tắc');
            fetchData();
        } catch {
            toastError('Lỗi khi cập nhật trạng thái');
        }
    };

    const confirmDelete = async () => {
        if (!deleteRule) return;
        try {
            const res = await fetch(`${apiUrl}/delivery-fee-rules/${deleteRule.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            success('Đã xóa quy tắc');
            setDeleteRule(null);
            fetchData();
        } catch {
            toastError('Lỗi khi xóa');
        }
    };

    // Group rules: defaults (branchId = null) and overrides
    const defaultRules = rules.filter(r => !r.branchId);
    const overrideRules = rules.filter(r => !!r.branchId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Truck className="text-rose-600" size={28} />
                            Cấu hình phí ship
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Quản lý phí giao hàng theo loại hình và chi nhánh.</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-rose-700 transition-all cursor-pointer"
                    >
                        <Plus size={16} /> Thêm quy tắc
                    </button>
                </div>

                {/* Default Rules */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-sm font-bold text-slate-700">📋 Quy tắc mặc định (Áp dụng tất cả chi nhánh)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Loại giao hàng</th>
                                    <th className="text-right px-6 py-3 text-slate-500 font-medium">Phí (VNĐ)</th>
                                    <th className="text-center px-6 py-3 text-slate-500 font-medium">Trạng thái</th>
                                    <th className="text-center px-6 py-3 text-slate-500 font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defaultRules.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">Chưa có quy tắc mặc định</td></tr>
                                ) : defaultRules.map(rule => (
                                    <tr key={rule.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700">
                                            {CATEGORY_LABELS[rule.deliveryCategory] || rule.deliveryCategory}
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-600">
                                            {formatCurrency(Number(rule.feeAmount))}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleActive(rule)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
                                                    rule.isActive
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                                                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                {rule.isActive ? 'Đang bật' : 'Đã tắt'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(rule)} className="px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium text-xs cursor-pointer transition-colors">
                                                    Sửa
                                                </button>
                                                <button onClick={() => setDeleteRule(rule)} className="px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium text-xs cursor-pointer transition-colors">
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Override Rules */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-amber-50">
                        <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                            <Building2 size={16} />
                            Quy tắc riêng theo chi nhánh (Override mặc định)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Chi nhánh</th>
                                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Loại giao hàng</th>
                                    <th className="text-right px-6 py-3 text-slate-500 font-medium">Phí (VNĐ)</th>
                                    <th className="text-center px-6 py-3 text-slate-500 font-medium">Trạng thái</th>
                                    <th className="text-center px-6 py-3 text-slate-500 font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overrideRules.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">Chưa có quy tắc riêng cho chi nhánh nào</td></tr>
                                ) : overrideRules.map(rule => (
                                    <tr key={rule.id} className="border-t border-slate-50 hover:bg-amber-50/30 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700">
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-md mr-1">
                                                {rule.branch?.code}
                                            </span>
                                            {rule.branch?.name}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">
                                            {CATEGORY_LABELS[rule.deliveryCategory] || rule.deliveryCategory}
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-rose-600">
                                            {formatCurrency(Number(rule.feeAmount))}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleActive(rule)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
                                                    rule.isActive
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                                                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                {rule.isActive ? 'Đang bật' : 'Đã tắt'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(rule)} className="px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium text-xs cursor-pointer transition-colors">
                                                    Sửa
                                                </button>
                                                <button onClick={() => setDeleteRule(rule)} className="px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium text-xs cursor-pointer transition-colors">
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Thêm/Sửa */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingRule ? 'Sửa quy tắc' : 'Thêm quy tắc mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {!editingRule && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Chi nhánh</label>
                                        <select
                                            value={formBranchId}
                                            onChange={e => setFormBranchId(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                        >
                                            <option value="">Mặc định (Tất cả chi nhánh)</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Loại giao hàng</label>
                                        <select
                                            value={formCategory}
                                            onChange={e => setFormCategory(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phí giao hàng (VNĐ)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={formFeeAmount}
                                    onChange={e => setFormFeeAmount(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    {editingRule ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!deleteRule}
                title="Xóa quy tắc phí ship"
                message={`Bạn có chắc muốn xóa quy tắc phí ship "${CATEGORY_LABELS[deleteRule?.deliveryCategory || ''] || ''}" ${deleteRule?.branch ? `cho chi nhánh ${deleteRule.branch.code}` : '(mặc định)'}?`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteRule(null)}
            />
        </div>
    );
}
