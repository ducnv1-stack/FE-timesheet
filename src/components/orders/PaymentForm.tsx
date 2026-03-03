"use client";

import { Plus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { OrderPayment } from '@/types/order';
import { formatCurrency, formatNumber, parseNumber, cn } from '@/lib/utils';

interface PaymentFormProps {
    payments: OrderPayment[];
    totalOrderAmount: number;
    onChange: (payments: OrderPayment[]) => void;
}

export default function PaymentForm({ payments, totalOrderAmount, onChange }: PaymentFormProps) {
    const addPayment = () => {
        onChange([...payments, { paymentMethod: 'CASH', amount: 0, paidAt: new Date().toISOString().split('T')[0] }]);
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
            <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">
                    Thanh toán
                </h3>
                <button
                    onClick={addPayment}
                    type="button"
                    className="flex items-center gap-1 px-1.5 py-0.5 text-rose-700 hover:bg-rose-50 rounded text-[10px] font-bold border border-rose-200"
                >
                    <Plus size={12} /> Thêm
                </button>
            </div>

            <div className="p-2 space-y-2">
                {payments.map((payment, index) => (
                    <div key={index} className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-sm relative">
                        {/* Row 1: Method & Actions */}
                        <div className="flex items-center gap-1.5">
                            <select
                                value={payment.paymentMethod}
                                onChange={(e) => updatePayment(index, 'paymentMethod', e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-xs font-medium"
                            >
                                <option value="CASH">💵 Tiền mặt (CASH)</option>
                                <option value="TRANSFER_COMPANY">🏢 Chuyển khoản Công ty (CORP)</option>
                                <option value="TRANSFER_PERSONAL">👤 Chuyển khoản Cá nhân (PERSONAL)</option>
                                <option value="CARD">💳 Quẹt thẻ (CARD/CREDIT)</option>
                                <option value="INSTALLMENT">🏦 Trả góp (INSTALLMENT)</option>
                            </select>
                            <button
                                onClick={() => removePayment(index)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded shadow-sm shrink-0"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Row 2: Date & Amount stacked */}
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={payment.paidAt}
                                onChange={(e) => updatePayment(index, 'paidAt', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-[10px]"
                            />
                            <input
                                type="text"
                                value={formatNumber(payment.amount)}
                                onChange={(e) => updatePayment(index, 'amount', parseNumber(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-xs text-right font-bold"
                                placeholder="Số tiền"
                            />
                        </div>
                    </div>
                ))}

                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Đã thanh toán:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Còn lại:</span>
                        <span className={cn(
                            "font-bold text-sm",
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
