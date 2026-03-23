"use client";

import { useState, useRef } from 'react';
import { X, FileText, Send, Loader2, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface AttendanceExceptionRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any;
    employeeId: string;
    onSuccess: () => void;
}

export default function AttendanceExceptionRequestModal({
    isOpen,
    onClose,
    record,
    employeeId,
    onSuccess
}: AttendanceExceptionRequestModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { success, error: toastError } = useToast();
    const [form, setForm] = useState({
        type: 'GO_LATE',
        reason: '',
        images: [] as string[]
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleUploadImages = async (files: FileList) => {
        if (files.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            
            // Nén ảnh trước khi upload
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const compressedFile = await imageCompression(file, options);
                    // Đổi đuôi file sang .webp
                    const webpFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    formData.append('images', compressedFile, webpFileName);
                } catch (error) {
                    console.error('Lỗi khi nén ảnh:', error);
                    // Fallback to original
                    formData.append('images', file, file.name);
                }
            }

            const res = await fetch(`${API_URL}/attendance-exception-requests/upload-images`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Lỗi tải ảnh');
            }

            const data = await res.json();
            setForm(prev => ({
                ...prev,
                images: [...prev.images, ...data.imageUrls]
            }));
            success('Tải ảnh thành công!');
        } catch (err: any) {
            toastError(err.message || 'Không thể tải ảnh lên');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!form.reason.trim()) {
            toastError('Vui lòng nhập lý do giải trình');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/attendance-exception-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    attendanceId: (record.id && !record.id.startsWith('temp') && !record.id.startsWith('today')) ? record.id : undefined,
                    date: record.date,
                    type: form.type,
                    reason: form.reason,
                    images: form.images
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Lỗi khi gửi đơn');
            }

            success('Gửi đơn giải trình thành công! Vui lòng chờ phê duyệt.');
            setForm({ type: 'GO_LATE', reason: '', images: [] });
            onSuccess();
            onClose();
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const types = [
        { value: 'GO_LATE', label: 'Báo đi muộn' },
        { value: 'LEAVE_EARLY', label: 'Báo về sớm' },
        { value: 'GPS_ERROR', label: 'Lỗi GPS / Vị trí' },
        { value: 'FORGOT_CHECKIN', label: 'Quên Check-in' },
        { value: 'FORGOT_CHECKOUT', label: 'Quên Check-out' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText size={22} className="text-primary" />
                        Gửi đơn giải trình
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"><X size={20} /></button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thông tin ngày công</p>
                    <p className="text-sm font-bold text-slate-700">
                        Ngày {new Date(record.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    {record.checkInTime && (
                        <p className="text-[11px] text-slate-500 mt-1">
                            Vào: <span className="font-bold">{new Date(record.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span> 
                            {record.checkOutTime && <> - Ra: <span className="font-bold">{new Date(record.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></>}
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Loại giải trình</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                        >
                            {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lý do chi tiết</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all h-32 resize-none"
                            placeholder="Vui lòng nhập lý do cụ thể (VD: xe hỏng, đi gặp khách hàng, lỗi mạng không check được...)"
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                            <ImageIcon size={12} /> Đính kèm hình ảnh (tối đa 5 ảnh)
                        </label>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => e.target.files && handleUploadImages(e.target.files)}
                        />

                        {/* Image Preview Grid */}
                        {form.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {form.images.map((url, i) => (
                                    <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                                        <img src={`${API_URL}${url}`} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {form.images.length < 5 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full h-16 border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-primary text-xs font-bold transition-all cursor-pointer hover:bg-primary/5"
                            >
                                {uploading ? (
                                    <><Loader2 className="animate-spin" size={16} /> Đang tải ảnh...</>
                                ) : (
                                    <><Upload size={16} /> Nhấn để chọn ảnh từ máy</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 px-6 py-3 text-slate-500 font-bold text-sm tracking-tight hover:bg-slate-50 rounded-xl transition-all cursor-pointer">Hủy</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting || uploading}
                        className="flex-[1.5] px-6 py-3 bg-primary text-white font-bold text-sm tracking-tight rounded-xl shadow-lg shadow-primary-light/50 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        Gửi đơn yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
}
