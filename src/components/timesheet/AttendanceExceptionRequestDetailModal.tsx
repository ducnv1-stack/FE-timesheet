import { X, FileText, CalendarDays, Clock, MapPin, User, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AttendanceExceptionRequestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
}

export default function AttendanceExceptionRequestDetailModal({
    isOpen,
    onClose,
    request
}: AttendanceExceptionRequestDetailModalProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (!isOpen || !request) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'APPROVED': return { label: 'Đã duyệt', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
            case 'REJECTED': return { label: 'Từ chối', color: 'text-primary', bg: 'bg-primary-subtle', border: 'border-primary-subtle' };
            default: return { label: 'Chờ duyệt', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
        }
    };

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'GO_LATE': return 'Báo đi muộn';
            case 'LEAVE_EARLY': return 'Báo về sớm';
            case 'GPS_ERROR': return 'Lỗi GPS / Vị trí';
            case 'FORGOT_CHECKIN': return 'Quên Check-in';
            case 'FORGOT_CHECKOUT': return 'Quên Check-out';
            default: return 'Khác';
        }
    };

    const statusInfo = getStatusInfo(request.status);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText size={22} className="text-primary" />
                        Chi tiết đơn giải trình
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{request.employee?.fullName}</p>
                                <p className="text-[10px] text-slate-500">{request.employee?.branch?.name} • {request.employee?.position}</p>
                            </div>
                        </div>
                        <div className={cn("px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-widest", statusInfo.bg, statusInfo.color, statusInfo.border)}>
                            {statusInfo.label}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <div className="h-9 w-9 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400">
                                    <CalendarDays size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Ngày công</p>
                                    <p className="text-sm font-black text-slate-700">
                                        {new Date(request.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                <div className="h-9 w-9 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400">
                                    <AlertCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Loại giải trình</p>
                                    <p className="text-sm font-black text-slate-700">{getTypeInfo(request.type)}</p>
                                </div>
                            </div>
                        </div>

                        {request.actualTime && (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-primary">
                                        <Clock size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-primary/60 font-black">Giờ nhân sự khai báo</p>
                                        <p className="text-lg font-black text-primary">{request.actualTime}</p>
                                    </div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-bold text-primary/30 uppercase leading-tight italic">Hệ thống sẽ dùng giờ này<br/>để tính lại công</p>
                                </div>
                            </div>
                        )}

                        <div className="p-5 bg-slate-50/30 border border-slate-100 rounded-3xl space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-4 bg-slate-200 rounded-full"></div>
                                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-black">Lý do chi tiết từ nhân sự</p>
                            </div>
                            <p className="text-[13px] leading-relaxed text-slate-600 font-medium italic pl-3">"{request.reason || 'Không có lý do chi tiết'}"</p>
                        </div>
                    </div>

                    {request.images && request.images.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1"><ImageIcon size={12} /> Ảnh đính kèm</p>
                            <div className="grid grid-cols-2 gap-2">
                                {request.images.map((img: string, i: number) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={`${API_URL}${img}`} 
                                            alt={`Hình minh chứng ${i + 1}`} 
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => setSelectedImage(`${API_URL}${img}`)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {request.note && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">Ghi chú của người duyệt</p>
                            <p className="text-sm text-orange-700">{request.note}</p>
                            <p className="text-[10px] text-orange-400/80 mt-1 italic">Duyệt bởi: {request.approver?.username}</p>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button onClick={onClose} className="w-full px-6 py-3 bg-slate-100 text-slate-600 font-bold text-sm tracking-tight hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
                        Đóng cửa sổ
                    </button>
                </div>
            </div>

            {/* Lightbox / Fullscreen Image Preview */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-center justify-center animate-in fade-in"
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={selectedImage} 
                        alt="Phóng to minh chứng" 
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95" 
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
