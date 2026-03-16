"use client";

import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Product, OrderItem } from '@/types/order';
import { formatCurrency, formatNumber, parseNumber, cn } from '@/lib/utils';

interface ItemGridProps {
    items: OrderItem[];
    products: Product[];
    onChange: (items: OrderItem[]) => void;
    isUpgrade?: boolean;
    oldOrderAmount?: number;
    orderDate?: string;
}

export default function ItemGrid({ items, products, onChange, isUpgrade, oldOrderAmount, orderDate }: ItemGridProps) {
    const getEffectiveMinPrice = (product: Product, date?: string) => {
        if (!product) return 0;
        if (!date || !product.minPricePolicies || product.minPricePolicies.length === 0) {
            return product.minPrice;
        }

        const dateObj = new Date(date);
        // Backend should have already sorted them, but we'll be safe
        const applicablePolicies = product.minPricePolicies
            .filter(p => {
                const start = new Date(p.startDate);
                const end = p.endDate ? new Date(p.endDate) : null;
                return dateObj >= start && (!end || dateObj <= end);
            })
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

        if (applicablePolicies.length > 0) {
            return applicablePolicies[0].minPrice;
        }

        return product.minPrice;
    };

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const addItem = () => {
        onChange([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    return (
        <div className="bg-white border-2 border-slate-800 overflow-hidden shadow-lg">
            <div className="bg-primary-subtle border-b-2 border-slate-800 p-2 text-center">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                    Danh sách hàng hóa
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-primary-subtle border-b-2 border-slate-800 text-slate-900">
                            <th className="px-2 py-2 border-r-2 border-slate-800 text-center w-[40px] text-slate-900">STT</th>
                            <th className="px-4 py-2 border-r-2 border-slate-800 text-left min-w-[200px] text-slate-900">Tên hàng hóa</th>
                            <th className="px-2 py-2 border-r-2 border-slate-800 text-center w-[80px] text-slate-900">Số lượng</th>
                            <th className="px-4 py-2 border-r-2 border-slate-800 text-right w-[140px] text-slate-900">Đơn giá</th>
                            <th className="px-4 py-2 text-right w-[140px] text-slate-900">Thành tiền</th>
                            <th className="px-2 py-2 w-[40px] print:hidden text-slate-900"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-800">
                        {items.map((item, index) => {
                            const selectedProduct = products.find(p => p.id === item.productId);
                            const effectiveMinPrice = selectedProduct ? getEffectiveMinPrice(selectedProduct, orderDate) : 0;
                            const effectivePrice = Number(item.unitPrice) + (isUpgrade ? Number(oldOrderAmount || 0) : 0);
                            const isBelowMin = selectedProduct && effectivePrice < effectiveMinPrice;

                            // Calculate Commission
                            let commissionPercent = 0;
                            let commissionAmount = 0;
                            if (selectedProduct) {
                                commissionPercent = isBelowMin ? 1 : 1.8;
                                commissionAmount = (item.quantity * item.unitPrice * commissionPercent) / 100;
                            }

                            // Calculate Bonus if High-end
                            let bonusAmount = 0;
                            const isHighEnd = selectedProduct?.isHighEnd || (selectedProduct as any)?.is_high_end;

                            if (isHighEnd && selectedProduct?.bonusPolicies && orderDate) {
                                // 🆕 Find effective bonus policy based on orderDate
                                const dateObj = new Date(orderDate);
                                const applicablePolicy = [...selectedProduct.bonusPolicies]
                                    .filter(pol => {
                                        const start = new Date(pol.startDate);
                                        const end = pol.endDate ? new Date(pol.endDate) : null;
                                        return dateObj >= start && (!end || dateObj <= end);
                                    })
                                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

                                if (applicablePolicy?.rules) {
                                    const applicableRule = [...applicablePolicy.rules]
                                        .filter(rule => Number(effectivePrice) >= Number(rule.minSellPrice))
                                        .sort((a, b) => Number(b.minSellPrice) - Number(a.minSellPrice))[0];

                                    if (applicableRule) {
                                        bonusAmount = Number(applicableRule.bonusAmount) * item.quantity;
                                    }
                                }
                            }

                            return (
                                <tr key={index} className={cn(
                                    "group transition-colors",
                                    isBelowMin ? "bg-primary-subtle/50" : "hover:bg-slate-50/50"
                                )}>
                                    <td className="px-2 py-2 border-r-2 border-slate-800 text-center font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800">
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 rounded p-1 appearance-none print:appearance-none cursor-pointer"
                                        >
                                            <option value="">Chọn sản phẩm...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({new Intl.NumberFormat('vi-VN').format(getEffectiveMinPrice(p, orderDate))}đ)</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800">
                                        <input
                                            type="text"
                                            value={item.quantity === 0 ? '' : formatNumber(item.quantity)}
                                            onChange={(e) => updateItem(index, 'quantity', parseNumber(e.target.value))}
                                            placeholder="1"
                                            className="w-full bg-transparent border-none focus:ring-0 p-1 text-center font-bold print:placeholder-transparent"
                                        />
                                    </td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={item.unitPrice === 0 ? '' : formatNumber(item.unitPrice)}
                                                onChange={(e) => updateItem(index, 'unitPrice', parseNumber(e.target.value))}
                                                onFocus={() => setFocusedIndex(index)}
                                                onBlur={() => setFocusedIndex(null)}
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                                className={cn(
                                                    "w-full bg-transparent border-none focus:ring-0 p-1 text-right font-bold print:placeholder-transparent transition-colors",
                                                    isBelowMin && "text-amber-600"
                                                )}
                                                placeholder="Giá bán..."
                                            />
                                            {selectedProduct && effectiveMinPrice > 0 && (
                                                <div className={cn(
                                                    "absolute -top-7 right-0 scale-90 px-1.5 py-0.5 rounded shadow-lg transition-all whitespace-nowrap z-10 font-bold text-[10px]",
                                                    isBelowMin ? "bg-amber-600 text-white" : "bg-slate-800 text-white",
                                                    (focusedIndex === index || hoveredIndex === index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                                                )}>
                                                    {isBelowMin ? `Dưới giá Min: ${formatCurrency(effectiveMinPrice)}` : `Giá tối thiểu: ${formatCurrency(effectiveMinPrice)}`}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-black text-slate-900 bg-slate-50/50">
                                        {formatCurrency(item.quantity * item.unitPrice)}
                                    </td>
                                    <td className="px-2 py-2 text-center print:hidden">
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="p-1 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                                    Chưa có sản phẩm nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-2 border-t-2 border-slate-800 bg-slate-50 flex justify-end print:hidden">
                <button
                    onClick={addItem}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary-light hover:bg-primary text-white rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                    <Plus size={12} /> Thêm sản phẩm
                </button>
            </div>
        </div>
    );
}
