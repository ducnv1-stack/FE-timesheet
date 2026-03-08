"use client";

import { useState, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, ExternalLink, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import ConfirmModal from '@/components/ui/confirm-modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OrderImagesModalProps {
    order: any;
    onClose: () => void;
    onRefresh: () => void;
}

export default function OrderImagesModal({ order, onClose, onRefresh }: OrderImagesModalProps) {
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { success, error: toastError } = useToast();

    // Use local state to update the view without waiting for parent refresh
    const [images, setImages] = useState<string[]>(order?.images || []);

    const fetchLatestImages = async () => {
        try {
            const res = await fetch(`${API_URL}/orders/${order.id}`);
            if (res.ok) {
                const data = await res.json();
                setImages(data.images || []);
            }
        } catch (error) {
            console.error('Lỗi lấy ảnh mới:', error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();

        try {
            const compressOptions = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            for (const file of Array.from(files)) {
                try {
                    const compressedFile = await imageCompression(file, compressOptions);
                    formData.append('files', compressedFile, compressedFile.name);
                } catch (err) {
                    console.error('Lỗi khi nén ảnh hóa đơn:', err);
                    formData.append('files', file, file.name); // upload bản gốc nếu lỗi
                }
            }

            const res = await fetch(`${API_URL}/orders/${order.id}/images`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Lỗi tải ảnh');
            }

            success('Đã đính kèm chứng từ thành công');
            await fetchLatestImages();
            onRefresh();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (imageUrl: string) => {
        try {
            const res = await fetch(`${API_URL}/orders/${order.id}/images?imageUrl=${encodeURIComponent(imageUrl)}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Lỗi khi xóa ảnh');
            }

            success('Đã xóa chứng từ');
            await fetchLatestImages();
            onRefresh();
            if (previewImage === imageUrl) setPreviewImage(null);
            setDeleteConfirm(null);
        } catch (error: any) {
            toastError(error.message);
        }
    };

    const getImageUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${API_URL.replace('/api', '')}${url}`;
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">Ảnh giao dịch</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">#{order?.id?.substring(0, 8)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 bg-slate-50/30">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                <img
                                    src={getImageUrl(img)}
                                    className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
                                    alt={`Chứng từ ${idx + 1}`}
                                    onClick={() => setPreviewImage(img)}
                                />
                                <div
                                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none lg:pointer-events-auto"
                                    onClick={() => setPreviewImage(img)}
                                >
                                    <div className="flex justify-between items-center pointer-events-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }}
                                            className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded bg-blur transition-colors cursor-pointer"
                                            title="Xem phóng to"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(img); }}
                                            className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors cursor-pointer"
                                            title="Xóa ảnh này"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Upload Button */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer w-full h-full",
                                uploading
                                    ? "bg-slate-50 border-slate-200"
                                    : "border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 group min-h-[160px]"
                            )}
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full shadow-lg"></div>
                                    <span className="text-xs font-bold text-slate-500 animate-pulse mt-2">Đang tải lên...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 group-hover:text-rose-600 uppercase tracking-wider text-center px-4">Đính kèm ảnh mới</span>
                                </>
                            )}
                            <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </div>
                    </div>
                    {images.length === 0 && !uploading && (
                        <div className="text-center py-10">
                            <p className="text-slate-400 font-medium text-sm">Chưa có chứng từ nào được đính kèm.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 p-4 lg:p-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(null);
                    }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(null);
                        }}
                        className="absolute top-4 right-4 lg:top-8 lg:right-8 p-3 bg-white/10 hover:bg-rose-600 text-white rounded-xl transition-all z-50 shadow-lg backdrop-blur-sm cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={getImageUrl(previewImage)}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-90 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                title="Xóa chứng từ?"
                message="Bạn có chắc chắn muốn xóa ảnh chứng từ này khỏi hệ thống? Hành động này sẽ không thể khôi phục."
                confirmLabel="Xác nhận Xóa"
                cancelLabel="Hủy bỏ"
                isDanger={true}
            />
        </div>
    );
}
