"use client";

import { Plus, Trash2, CreditCard, Banknote, Image as ImageIcon, X, FolderOpen, ExternalLink, Camera } from 'lucide-react';
import { OrderPayment } from '@/types/order';
import { formatCurrency, formatNumber, parseNumber, cn } from '@/lib/utils';
import { useRef, useState } from 'react';

interface PaymentFormProps {
    payments: OrderPayment[];
    totalOrderAmount: number;
    onChange: (payments: OrderPayment[]) => void;
    availableSystemImages?: string[];
    onAddSystemImage?: (paymentIndex: number, url: string) => void;
}

export default function PaymentForm({ payments, totalOrderAmount, onChange, availableSystemImages, onAddSystemImage }: PaymentFormProps) {
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
    const [systemImageModalFor, setSystemImageModalFor] = useState<number | null>(null);
    const [activePaymentModal, setActivePaymentModal] = useState<number | null>(null);
    const [uploadOptionsFor, setUploadOptionsFor] = useState<number | null>(null);

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

    const removeExistingFile = (paymentIndex: number, urlToDelete: string) => {
        const currentImages = payments[paymentIndex].existingImages || [];
        const newImages = currentImages.filter(url => url !== urlToDelete);
        updatePayment(paymentIndex, 'existingImages', newImages);
    };

    const getImageUrl = (url: string) => {
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${cleanApiUrl}${cleanUrl}`;
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

                            {/* Image Button Row */}
                            <div className="flex items-center mt-1 px-1">
                                <button
                                    onClick={() => setActivePaymentModal(index)}
                                    className="flex items-center justify-center w-full max-w-[140px] py-1.5 border border-dashed border-slate-300 rounded-md text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors text-[10px] gap-1.5 cursor-pointer"
                                    title="Quản lý ảnh giao dịch"
                                >
                                    <ImageIcon size={12} />
                                    {((payment.files?.length || 0) + (payment.existingImages?.length || 0) > 0)
                                        ? `Đã chọn (${(payment.files?.length || 0) + (payment.existingImages?.length || 0)}) ảnh`
                                        : 'Thêm ảnh CK'
                                    }
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    ref={el => { fileInputRefs.current[index] = el; }}
                                    onChange={(e) => handleFileChange(index, e)}
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

            {/* Modal Image Selection per Payment */}
            {activePaymentModal !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActivePaymentModal(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                                    <ImageIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Ảnh giao dịch</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thanh toán {activePaymentModal + 1}</p>
                                </div>
                            </div>
                            <button onClick={() => setActivePaymentModal(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/30">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {/* Render existing images */}
                                {(payments[activePaymentModal].existingImages || []).map((url, fIndex) => {
                                    const fullUrl = getImageUrl(url);
                                    return (
                                        <div key={`existing-${fIndex}`} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                            <img
                                                src={fullUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
                                                onClick={() => setPreviewImage(fullUrl)}
                                            />
                                            <div
                                                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none lg:pointer-events-auto"
                                                onClick={() => setPreviewImage(fullUrl)}
                                            >
                                                <div className="flex justify-between items-center pointer-events-auto">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setPreviewImage(fullUrl); }}
                                                        className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded bg-blur transition-colors cursor-pointer"
                                                        title="Xem phóng to"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeExistingFile(activePaymentModal, url); }}
                                                        className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors cursor-pointer"
                                                        title="Xóa ảnh này"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Render new selected files */}
                                {(payments[activePaymentModal].files || []).map((file, fIndex) => {
                                    const url = URL.createObjectURL(file);
                                    return (
                                        <div key={`new-${fIndex}`} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                            <img
                                                src={url}
                                                alt="Preview"
                                                className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
                                                onClick={() => setPreviewImage(url)}
                                            />
                                            <div
                                                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none lg:pointer-events-auto"
                                                onClick={() => setPreviewImage(url)}
                                            >
                                                <div className="flex justify-between items-center pointer-events-auto">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setPreviewImage(url); }}
                                                        className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded bg-blur transition-colors cursor-pointer"
                                                        title="Xem phóng to"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFile(activePaymentModal, fIndex); }}
                                                        className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors cursor-pointer"
                                                        title="Xóa ảnh này"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Upload blocks */}
                                <>
                                    {/* Combined Upload Box */}
                                    <div
                                        className="flex flex-col items-center justify-center gap-2 aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer w-full h-full border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 group min-h-[160px]"
                                        onClick={() => {
                                            if (availableSystemImages !== undefined) {
                                                setUploadOptionsFor(activePaymentModal);
                                            } else {
                                                fileInputRefs.current[activePaymentModal]?.click();
                                            }
                                        }}
                                    >
                                        <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                                            <Camera size={24} />
                                        </div>
                                        <span className="text-xs font-black text-slate-400 group-hover:text-rose-600 uppercase tracking-wider text-center px-4">ĐÍNH KÈM ẢNH MỚI</span>
                                    </div>
                                </>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Modal Upload Options */}
            {uploadOptionsFor !== null && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setUploadOptionsFor(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-800">Tùy chọn tải ảnh</h3>
                            <button onClick={() => setUploadOptionsFor(null)} className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <button
                                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 transition-all text-left group cursor-pointer"
                                onClick={() => {
                                    fileInputRefs.current[uploadOptionsFor]?.click();
                                    setUploadOptionsFor(null);
                                }}
                            >
                                <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors shadow-sm">
                                    <Camera size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">Tải ảnh từ thiết bị</div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Chọn file hình ảnh từ máy tính hoặc điện thoại</div>
                                </div>
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group cursor-pointer"
                                onClick={() => {
                                    setSystemImageModalFor(uploadOptionsFor);
                                    setUploadOptionsFor(null);
                                    setActivePaymentModal(null);
                                }}
                            >
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm">
                                    <FolderOpen size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">Chọn ảnh từ hệ thống</div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Sử dụng lại ảnh có sẵn của hóa đơn này</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Select System Image */}
            {systemImageModalFor !== null && availableSystemImages && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => { setActivePaymentModal(systemImageModalFor); setSystemImageModalFor(null); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-800">Chọn ảnh từ hệ thống</h3>
                        </div>
                        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                            {availableSystemImages.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-slate-500 text-sm font-medium">
                                    Không có ảnh hệ thống nào đang trống để chọn thêm.
                                </div>
                            ) : (
                                availableSystemImages.map(url => (
                                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:ring-2 hover:ring-rose-500 transition-all"
                                        onClick={() => {
                                            if (onAddSystemImage) {
                                                onAddSystemImage(systemImageModalFor, url);
                                            }
                                            setActivePaymentModal(systemImageModalFor);
                                            setSystemImageModalFor(null);
                                        }}>
                                        <img src={getImageUrl(url)} alt="System Image" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold px-2 py-1 bg-rose-600 rounded">Chọn</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
