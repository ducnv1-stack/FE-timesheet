"use client";

import { Plus, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import { Employee, Branch, OrderSplit } from '@/types/order';
import { formatCurrency, cn } from '@/lib/utils';

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
        newSplits[index] = { ...newSplits[index], [field]: value };
        onChange(newSplits);
    };

    const splitAmount = totalOrderAmount / (splits.length + 1);

    const totalPercent = splits.reduce((sum, s) => sum + s.splitPercent, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    Chia doanh số (Split)
                </h3>
                <button
                    onClick={addSplit}
                    type="button"
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
                >
                    <UserPlus size={14} /> Thêm nhân viên
                </button>
            </div>

            <div className="p-4 space-y-3">
                {splits.map((split, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm relative group">
                        {/* Row 1: Employee & Actions */}
                        <div className="flex items-center gap-2">
                            <select
                                value={split.employeeId}
                                onChange={(e) => updateSplit(index, 'employeeId', e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded-lg p-2 text-sm font-medium"
                            >
                                <option value="">Chọn Nhân viên...</option>
                                {employees
                                    .filter(emp => !split.branchId || emp.branchId === split.branchId)
                                    .map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                    ))}
                            </select>
                            <button
                                onClick={() => removeSplit(index)}
                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded-lg shadow-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Row 2: Branch & Amount */}
                        <div className="flex items-center gap-2">
                            <select
                                value={split.branchId}
                                onChange={(e) => updateSplit(index, 'branchId', e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded-lg p-2 text-sm"
                            >
                                <option value="">Chọn Chi nhánh...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>

                            <div className="w-[150px] bg-slate-100 border border-slate-200 rounded-lg px-2 py-2 text-right">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Doanh số</span>
                                <span className="text-sm font-bold text-slate-700">{formatCurrency(splitAmount)}</span>
                            </div>
                        </div>

                        {/* Row 3: Amount Display */}
                    </div>
                ))}

                <div className={cn(
                    "mt-4 p-3 rounded-lg flex justify-between items-center text-sm font-bold border transition-all",
                    splits.length === 0
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : totalPercent === 100
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                    <span>
                        {splits.length === 0
                            ? "Mặc định: 100% cho nhân viên tạo đơn"
                            : `Tổng tỉ trọng chia: ${totalPercent}%`
                        }
                    </span>

                    {splits.length > 0 && totalPercent !== 100 && (
                        <span className="animate-pulse flex items-center gap-1 text-xs font-medium">
                            <AlertCircle size={14} /> Phải bằng 100% để lưu
                        </span>
                    )}
                    {(splits.length === 0 || totalPercent === 100) && <span>Hợp lệ</span>}
                </div>
            </div>
        </div>
    );
}
