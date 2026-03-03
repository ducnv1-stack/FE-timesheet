"use client";

import { Plus, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import { Employee, Branch, OrderSplit } from '@/types/order';
import { formatCurrency, formatNumber, parseNumber, cn } from '@/lib/utils';

interface SplitManagerProps {
    splits: OrderSplit[];
    employees: Employee[];
    branches: Branch[];
    totalOrderAmount: number;
    onChange: (splits: OrderSplit[]) => void;
}

export default function SplitManager({ splits, employees, branches, totalOrderAmount, onChange }: SplitManagerProps) {
    const addSplit = () => {
        onChange([...splits, { employeeId: '', branchId: '', splitPercent: 0, splitAmount: 0 }]);
    };

    const removeSplit = (index: number) => {
        onChange(splits.filter((_, i) => i !== index));
    };

    const updateSplit = (index: number, field: keyof OrderSplit, value: any) => {
        const newSplits = [...splits];
        let val = value;

        if (field === 'splitAmount') {
            val = Number(value);
            const percent = totalOrderAmount > 0 ? (val / totalOrderAmount) * 100 : 0;
            newSplits[index] = {
                ...newSplits[index],
                [field]: val,
                splitPercent: Number(percent.toFixed(2))
            };
        } else {
            newSplits[index] = { ...newSplits[index], [field]: val };
        }
        onChange(newSplits);
    };

    const totalSplitAmount = splits.reduce((sum, s) => sum + s.splitAmount, 0);
    const totalPercent = Number(splits.reduce((sum, s) => sum + s.splitPercent, 0).toFixed(2));
    const isValid = totalSplitAmount <= totalOrderAmount;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">
                    Chia doanh số
                </h3>
                <button
                    onClick={addSplit}
                    type="button"
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-bold"
                >
                    <UserPlus size={12} /> Thêm
                </button>
            </div>

            <div className="p-2 space-y-2">
                {splits.map((split, index) => (
                    <div key={index} className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-sm relative group">
                        {/* Row 1: Branch & Actions */}
                        <div className="flex items-center gap-1.5">
                            <select
                                value={split.branchId}
                                onChange={(e) => updateSplit(index, 'branchId', e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-xs font-medium"
                            >
                                <option value="">Chọn Chi nhánh...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => removeSplit(index)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded shadow-sm shrink-0"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Row 2: Employee */}
                        <select
                            value={split.employeeId}
                            onChange={(e) => updateSplit(index, 'employeeId', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-xs"
                        >
                            <option value="">Chọn Nhân viên...</option>
                            {employees
                                .filter(emp => !split.branchId || emp.branchId === split.branchId)
                                .map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                ))}
                        </select>

                        {/* Row 3: Amount & Percent */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 focus-within:ring-2 focus-within:ring-rose-500 transition-all">
                                <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Doanh số</span>
                                <input
                                    type="text"
                                    value={formatNumber(split.splitAmount)}
                                    onChange={(e) => updateSplit(index, 'splitAmount', parseNumber(e.target.value))}
                                    className="w-full border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 focus:outline-none bg-transparent"
                                    placeholder="0"
                                />
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                                {split.splitPercent}%
                            </div>
                        </div>
                    </div>
                ))}

                <div className={cn(
                    "mt-2 p-2 rounded flex flex-col gap-1 text-[11px] font-bold border transition-all",
                    splits.length === 0
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : isValid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                    <div>
                        {splits.length === 0
                            ? "Mặc định (100% người tạo)"
                            : `Tổng: ${formatCurrency(totalSplitAmount)} (${totalPercent}%)`
                        }
                    </div>

                    {!isValid && (
                        <div className="animate-pulse flex items-center gap-1 text-[10px] font-medium text-red-600">
                            <AlertCircle size={10} /> Vượt quá tổng đơn!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
