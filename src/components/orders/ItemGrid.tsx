"use client";

import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Product, OrderItem } from '@/types/order';
import { formatCurrency, cn } from '@/lib/utils';

interface ItemGridProps {
    items: OrderItem[];
    products: Product[];
    onChange: (items: OrderItem[]) => void;
}

export default function ItemGrid({ items, products, onChange }: ItemGridProps) {
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
            <div className="bg-rose-50 border-b-2 border-slate-800 p-2 text-center">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                    Danh sách hàng hóa
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-rose-50 border-b-2 border-slate-800">
                            <th className="px-2 py-2 border-r-2 border-slate-800 text-center w-[60px]">STT</th>
                            <th className="px-4 py-2 border-r-2 border-slate-800 text-left min-w-[300px]">Tên hàng hóa</th>
                            <th className="px-2 py-2 border-r-2 border-slate-800 text-center w-[100px]">Số lượng</th>
                            <th className="px-4 py-2 border-r-2 border-slate-800 text-right w-[180px]">Đơn giá</th>
                            <th className="px-4 py-2 text-right w-[180px]">Thành tiền</th>
                            <th className="px-2 py-2 w-[50px] print:hidden"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-800">
                        {items.map((item, index) => {
                            const selectedProduct = products.find(p => p.id === item.productId);
                            const isBelowMin = selectedProduct && item.unitPrice < selectedProduct.minPrice;

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
                            const bonusRules = selectedProduct?.bonusRules || (selectedProduct as any)?.bonus_rules;

                            if (isHighEnd && bonusRules) {
                                const applicableRules = (bonusRules as any[])
                                    .filter(rule => Number(item.unitPrice) >= Number(rule.minSellPrice || rule.min_sell_price))
                                    .sort((a, b) => Number(b.minSellPrice || b.min_sell_price) - Number(a.minSellPrice || a.min_sell_price));

                                if (applicableRules.length > 0) {
                                    bonusAmount = Number(applicableRules[0].bonusAmount || applicableRules[0].bonus_amount) * item.quantity;
                                }
                            }

                            return (
                                <tr key={index} className="group">
                                    <td className="px-2 py-2 border-r-2 border-slate-800 text-center font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800">
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 rounded p-1"
                                        >
                                            <option value="">Chọn sản phẩm...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-1 text-center font-bold"
                                        />
                                    </td>
                                    <td className="px-2 py-2 border-r-2 border-slate-800">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={item.unitPrice === 0 ? '' : item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                                className={cn(
                                                    "w-full bg-transparent border-none focus:ring-0 p-1 text-right font-bold",
                                                    isBelowMin && "text-amber-600"
                                                )}
                                            />
                                            {isBelowMin && (
                                                <div className="absolute -top-7 right-0 scale-90 bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    Dưới giá Min: {formatCurrency(selectedProduct.minPrice)}
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
                                            <Trash2 size={16} />
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
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                    <Plus size={14} /> Thêm sản phẩm
                </button>
            </div>
        </div>
    );
}
