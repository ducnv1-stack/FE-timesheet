"use client";

import { Plus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { OrderPayment } from '@/types/order';
import { formatCurrency, cn } from '@/lib/utils';

interface PaymentFormProps {
    payments: OrderPayment[];
    totalOrderAmount: number;
    onChange: (payments: OrderPayment[]) => void;
}

export default function PaymentForm({ payments, totalOrderAmount, onChange }: PaymentFormProps) {
    const addPayment = () => {
        onChange([...payments, { paymentMethod: 'TRANSFER', amount: 0, paidAt: new Date().toISOString().split('T')[0] }]);
    };

    const removePayment = (index: number) => {
        onChange(payments.filter((_, i) => i !== index));
    };

    const updatePayment = (index: number, field: keyof OrderPayment, value: any) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], [field]: value };
        onChange(newPayments);
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totalOrderAmount - totalPaid;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    Thanh toán
                </h3>
                <button
                    onClick={addPayment}
                    type="button"
                    className="flex items-center gap-1.5 px-2 py-1 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors border border-rose-200"
                >
                    <Plus size={14} /> Thêm phương thức
                </button>
            </div>

            <div className="p-4 space-y-3">
                {payments.map((payment, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm relative">
                        {/* Row 1: Method & Actions */}
                        <div className="flex items-center gap-2">
                            <select
                                value={payment.paymentMethod}
                                onChange={(e) => updatePayment(index, 'paymentMethod', e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded-lg p-2 text-sm font-medium"
                            >
                                <option value="CASH">Tiền mặt (CASH)</option>
                                <option value="TRANSFER">Chuyển khoản (TRANSFER)</option>
                                <option value="CREDIT">Quẹt thẻ (CREDIT)</option>
                            </select>
                            <button
                                onClick={() => removePayment(index)}
                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded-lg shadow-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Row 2: Date & Amount */}
                        <div className="flex items-center gap-2">
                            <div className="w-[110px]">
                                <input
                                    type="date"
                                    value={payment.paidAt}
                                    onChange={(e) => updatePayment(index, 'paidAt', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="number"
                                    value={payment.amount === 0 ? '' : payment.amount}
                                    onChange={(e) => updatePayment(index, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded-lg p-2 text-sm text-right pr-3 font-bold"
                                    placeholder="Số tiền"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="mt-6 pt-4 border-t border-dashed border-slate-200 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Đã thanh toán:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Còn lại:</span>
                        <span className={cn(
                            "font-bold text-lg",
                            remaining === 0 ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {formatCurrency(remaining)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
