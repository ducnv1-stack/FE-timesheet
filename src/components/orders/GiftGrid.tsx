"use client";

import { Gift, Trash2, Plus } from 'lucide-react';
import { Gift as GiftType, OrderGift } from '@/types/order';
import { formatCurrency, formatNumber, parseNumber, cn } from '@/lib/utils';

interface GiftGridProps {
    orderGifts: OrderGift[];
    allGifts: GiftType[];
    onChange: (gifts: OrderGift[]) => void;
}

export default function GiftGrid({ orderGifts, allGifts, onChange }: GiftGridProps) {
    const addGift = () => {
        onChange([...orderGifts, { giftId: '', quantity: 1, name: '', price: 0 }]);
    };

    const removeGift = (index: number) => {
        onChange(orderGifts.filter((_, i) => i !== index));
    };

    const updateGift = (index: number, field: keyof OrderGift, value: any) => {
        const newGifts = [...orderGifts];

        if (field === 'giftId') {
            const selectedGift = allGifts.find(g => g.id === value);
            newGifts[index] = {
                ...newGifts[index],
                giftId: value,
                name: selectedGift?.name || '',
                price: selectedGift?.price || 0
            };
        } else {
            newGifts[index] = { ...newGifts[index], [field]: value };
        }

        onChange(newGifts);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
            <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                <div className="flex items-center gap-1.5">
                    <Gift size={14} className="text-rose-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">
                        Quà tặng kèm
                    </h3>
                </div>
                <button
                    onClick={addGift}
                    type="button"
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-[10px] font-bold"
                >
                    <Plus size={12} /> Thêm quà
                </button>
            </div>

            <div className="p-2 space-y-2">
                {orderGifts.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-slate-400 italic">
                        Chưa có quà tặng nào...
                    </div>
                )}

                {orderGifts.map((og, index) => (
                    <div key={index} className="flex items-center gap-2 p-1.5 bg-rose-50/30 rounded-lg border border-rose-100 shadow-sm relative group">
                        <div className="flex-1">
                            <select
                                value={og.giftId}
                                onChange={(e) => updateGift(index, 'giftId', e.target.value)}
                                className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1 text-[11px] font-medium"
                            >
                                <option value="">Chọn quà tặng...</option>
                                {allGifts.map(g => (
                                    <option key={g.id} value={g.id}>{g.name} ({formatCurrency(g.price)})</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus-within:ring-2 focus-within:ring-rose-500 transition-all shrink-0">
                            <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Số lượng</span>
                            <input
                                type="number"
                                min="1"
                                value={og.quantity}
                                onChange={(e) => updateGift(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full border-none p-0 text-[11px] font-bold text-slate-700 focus:ring-0 focus:outline-none bg-transparent"
                            />
                        </div>

                        <div className="text-right min-w-[70px] shrink-0">
                            <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Trị giá</span>
                            <span className="text-[11px] font-black text-rose-600">
                                {formatCurrency((og.price || 0) * og.quantity)}
                            </span>
                        </div>

                        <button
                            onClick={() => removeGift(index)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded shadow-sm shrink-0"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
