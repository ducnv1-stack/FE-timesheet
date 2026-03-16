"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, ExternalLink, Camera, FolderOpen } from 'lucide-react';
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
    const [originalImages, setOriginalImages] = useState<string[]>(order?.images || []);
    const [systemImages, setSystemImages] = useState<string[]>([]);
    const [uploadOptionsOpen, setUploadOptionsOpen] = useState(false);
    const [systemImageModalOpen, setSystemImageModalOpen] = useState(false);
    const [pendingClose, setPendingClose] = useState(false);

    const fetchLatestImages = async () => {
        try {
            const [orderRes, sysImgRes] = await Promise.all([
                fetch(`${API_URL}/orders/${order.id}`),
                fetch(`${API_URL}/orders/${order.id}/system-images`).catch(() => null)
            ]);

            if (orderRes.ok) {
                const data = await orderRes.json();
                setImages(data.images || []);
                setOriginalImages(data.images || []);
            }
            if (sysImgRes && sysImgRes.ok) {
                const sysData = await sysImgRes.json();
                setSystemImages(Array.isArray(sysData) ? sysData : []);
            }
        } catch (error) {
            console.error('Lỗi lấy ảnh mới:', error);
        }
    };

    // Load initial system images on mount
    useEffect(() => {
        fetchLatestImages();
    }, [order.id]);

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

            const storedUser = localStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const currentUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

            const res = await fetch(`${API_URL}/orders/${order.id}/images?userId=${currentUserId}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Lỗi tải ảnh');
            }

            const updatedOrder = await res.json();
            const newServerImages = updatedOrder.images || [];
            const newlyUploaded = newServerImages.filter((img: string) => !originalImages.includes(img));

            setOriginalImages(newServerImages);
            setImages(prev => Array.from(new Set([...prev, ...newlyUploaded])));

            success('Đã đính kèm chứng từ thành công');

            // Cập nhật lại list ảnh hệ thống rảnh rỗi
            const sysImgRes = await fetch(`${API_URL}/orders/${order.id}/system-images`).catch(() => null);
            if (sysImgRes && sysImgRes.ok) {
                const sysData = await sysImgRes.json();
                setSystemImages(Array.isArray(sysData) ? sysData : []);
            }

            onRefresh();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddSystemImageLocal = (url: string) => {
        if (images.includes(url)) {
            toastError('Ảnh này đã có trong danh sách');
            return;
        }
        setImages([...images, url]);
        setSystemImageModalOpen(false);
    };

    const handleSaveChanges = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const currentUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

            const res = await fetch(`${API_URL}/orders/${order.id}?userId=${currentUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Lỗi khi lưu ảnh');
            }

            success('Đã lưu thay đổi ảnh');
            await fetchLatestImages();
            onRefresh();
            setPendingClose(false);
            onClose();
        } catch (error: any) {
            toastError(error.message);
        }
    };

    const handleCloseAttempt = () => {
        const hasChanges =
            originalImages.length !== images.length ||
            originalImages.some(img => !images.includes(img)) ||
            images.some(img => !originalImages.includes(img));

        if (hasChanges) {
            setPendingClose(true);
        } else {
            onClose();
        }
    };

    const getImageUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${cleanApiUrl}${cleanUrl}`;
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={handleCloseAttempt}
            >
                <div
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-subtle text-primary rounded-xl flex items-center justify-center">
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Ảnh giao dịch</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">#{order?.id?.substring(0, 8)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCloseAttempt}
                            className="p-2 text-slate-400 hover:text-primary-light hover:bg-primary-subtle rounded-xl transition-colors cursor-pointer"
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
                                        className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors pointer-events-none lg:pointer-events-auto"
                                        onClick={() => setPreviewImage(img)}
                                    >
                                        {/* X Button Top Right */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setImages(images.filter(i => i !== img)); }}
                                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-primary-light text-white rounded-full transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer pointer-events-auto"
                                            title="Gỡ ảnh này khỏi đơn hàng"
                                        >
                                            <X size={14} />
                                        </button>
                                        {/* View Button Bottom Left */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }}
                                            className="absolute bottom-2 left-2 p-1.5 bg-black/50 hover:bg-white text-white hover:text-slate-900 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer pointer-events-auto flex items-center gap-1.5"
                                            title="Xem phóng to"
                                        >
                                            <ExternalLink size={12} />
                                            <span className="text-[10px] font-bold">Xem</span>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Upload Button */}
                            <div
                                onClick={() => setUploadOptionsOpen(true)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer w-full h-full",
                                    uploading
                                        ? "bg-slate-50 border-slate-200"
                                        : "border-primary-subtle hover:border-primary hover:bg-primary-subtle/50 group min-h-[160px]"
                                )}
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin w-8 h-8 border-4 border-primary-light border-t-transparent rounded-full shadow-lg"></div>
                                        <span className="text-xs font-bold text-slate-500 animate-pulse mt-2">Đang tải lên...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-primary-subtle text-primary-light rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary-light group-hover:text-white transition-all shadow-sm">
                                            <Camera size={24} />
                                        </div>
                                        <span className="text-xs font-black text-slate-400 group-hover:text-primary uppercase tracking-wider text-center px-4">Đính kèm ảnh mới</span>
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
            </div>

            {/* Fullscreen Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 p-4 lg:p-10"
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
                        className="absolute top-4 right-4 lg:top-8 lg:right-8 p-3 bg-white/10 hover:bg-primary text-white rounded-xl transition-all z-50 shadow-lg backdrop-blur-sm cursor-pointer"
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

            {/* Modal Upload Options */}
            {uploadOptionsOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setUploadOptionsOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-800">Tùy chọn tải ảnh</h3>
                            <button onClick={() => setUploadOptionsOpen(false)} className="text-slate-400 hover:text-primary-light cursor-pointer p-1"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <button
                                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary-subtle transition-all text-left group cursor-pointer"
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    setUploadOptionsOpen(false);
                                }}
                            >
                                <div className="w-10 h-10 bg-primary-subtle text-primary-light rounded-full flex items-center justify-center group-hover:bg-primary-light group-hover:text-white transition-colors shadow-sm">
                                    <Camera size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">Tải ảnh từ thiết bị</div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Chọn file hình ảnh từ máy tính hoặc điện thoại</div>
                                </div>
                            </button>

                            <button
                                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group cursor-pointer"
                                onClick={() => {
                                    setSystemImageModalOpen(true);
                                    setUploadOptionsOpen(false);
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
            {systemImageModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSystemImageModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-800">Chọn ảnh từ hệ thống</h3>
                            <button onClick={() => setSystemImageModalOpen(false)} className="text-slate-400 hover:text-primary-light cursor-pointer p-1"><X size={20} /></button>
                        </div>
                        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                            {systemImages.filter(url => !images.includes(url)).length === 0 ? (
                                <div className="col-span-full py-8 text-center text-slate-500 text-sm font-medium">
                                    Không có ảnh hệ thống nào đang trống để chọn thêm.
                                </div>
                            ) : (
                                systemImages.filter(url => !images.includes(url)).map(url => (
                                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:ring-2 hover:ring-primary-light transition-all"
                                        onClick={() => handleAddSystemImageLocal(url)}>
                                        <img src={getImageUrl(url)} alt="System Image" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold px-2 py-1 bg-primary rounded">Chọn</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirm Save Changes */}
            {pendingClose && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPendingClose(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center p-6" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload size={32} />
                        </div>
                        <h3 className="font-black text-lg text-slate-800 mb-2">Lưu thay đổi?</h3>
                        <p className="text-sm text-slate-500 mb-6 px-4">
                            Bạn đã thêm hoặc gỡ hình ảnh nháp nhưng chưa lưu. Bạn có muốn lưu lại những thay đổi này không?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSaveChanges}
                                className="w-full bg-primary hover:bg-primary-light text-white py-3 px-4 rounded-xl font-bold transition-colors cursor-pointer"
                            >
                                Lưu thay đổi
                            </button>
                            <button
                                onClick={() => { setPendingClose(false); onClose(); }}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold transition-colors cursor-pointer"
                            >
                                Không lưu & Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
