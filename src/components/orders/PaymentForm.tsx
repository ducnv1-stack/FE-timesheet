"use client";

import { Plus, Trash2, CreditCard, Banknote, Image as ImageIcon, X } from 'lucide-react';
import { OrderPayment } from '@/types/order';
import { formatCurrency, formatNumber, parseNumber, cn } from '@/lib/utils';
import { useRef, useState } from 'react';

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

    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const currentFiles = payments[index].files || [];
        // Optional: limit to 3 images per payment to prevent clutter
        const newFiles = [...currentFiles, ...selectedFiles].slice(0, 3);

        updatePayment(index, 'files', newFiles);

        // Reset input so the same file can be selected again if needed
        if (e.target) e.target.value = '';
    };

    const removeFile = (paymentIndex: number, fileIndex: number) => {
        const currentFiles = payments[paymentIndex].files || [];
        const newFiles = currentFiles.filter((_, i) => i !== fileIndex);
        updatePayment(paymentIndex, 'files', newFiles);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">
                        Thanh toán
                    </h3>
                    <button
                        onClick={addPayment}
                        type="button"
                        className="flex items-center gap-1 px-1.5 py-0.5 text-rose-700 hover:bg-rose-50 rounded text-[10px] font-bold border border-rose-200 cursor-pointer"
                    >
                        <Plus size={12} /> Thêm
                    </button>
                </div>

                <div className="p-2 space-y-2">
                    {payments.map((payment, index) => (
                        <div key={index} className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-sm relative">
                            {/* Row 1: Method & Actions */}
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="flex-1 min-w-0">
                                    <select
                                        value={payment.paymentMethod}
                                        onChange={(e) => updatePayment(index, 'paymentMethod', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-xs font-medium truncate cursor-pointer"
                                    >
                                        <option value="CASH">💵 Tiền mặt </option>
                                        <option value="TRANSFER_COMPANY">🏢 Chuyển khoản Công ty (Ohari - Đuôi 6666)</option>
                                        <option value="TRANSFER_PERSONAL">👤 Chuyển khoản Cá nhân (C Hằng - Đuôi 9099)</option>
                                        <option value="CARD">💳 Quẹt thẻ (Mpos)</option>
                                        <option value="INSTALLMENT">🏦 Trả góp (Homecredit)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => removePayment(index)}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors bg-white border border-slate-100 rounded shadow-sm shrink-0 cursor-pointer"
                                    title="Xóa thanh toán"
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
                                    className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-[10px] cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={payment.amount === 0 ? '' : formatNumber(payment.amount)}
                                    onChange={(e) => updatePayment(index, 'amount', parseNumber(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 rounded p-1.5 text-xs text-right font-bold"
                                    placeholder="Nhập số tiền..."
                                />
                            </div>

                            {/* Image Upload Row */}
                            <div className="flex flex-wrap items-center gap-2 mt-1 px-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    ref={el => { fileInputRefs.current[index] = el; }}
                                    onChange={(e) => handleFileChange(index, e)}
                                />

                                {(payment.files || []).map((file, fIndex) => {
                                    const url = URL.createObjectURL(file);
                                    return (
                                        <div key={fIndex} className="relative group w-10 h-10 rounded-md overflow-hidden border border-slate-200 cursor-pointer shadow-sm">
                                            <img
                                                src={url}
                                                alt="Preview"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                                                onClick={() => setPreviewImage(url)}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(index, fIndex); }}
                                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                            >
                                                <X size={10} strokeWidth={3} />
                                            </button>
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => fileInputRefs.current[index]?.click()}
                                    className="flex items-center justify-center w-full max-w-[120px] py-1.5 border border-dashed border-slate-300 rounded-md text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors text-[10px] gap-1.5 cursor-pointer"
                                    title="Tải lên ảnh giao dịch"
                                >
                                    <ImageIcon size={12} /> Thêm ảnh CK
                                </button>
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

            {/* Modal Preview Image */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10 cursor-pointer"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
