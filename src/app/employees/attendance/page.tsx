"use client";

import { useState, useEffect } from 'react';
import {
    MapPin,
    CheckCircle2,
    AlertCircle,
    RefreshCcw,
    Clock,
    User,
    Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';

type AttendanceState = 'INITIAL' | 'SUCCESS' | 'LATE' | 'RETRY' | 'LOCKED' | 'FINISHED' | 'LOADING';

export default function AttendancePage() {
    const [state, setState] = useState<AttendanceState>('LOADING');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [todayData, setTodayData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [gpsError, setGpsError] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { success, error: toastError } = useToast();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getFullImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            fetchTodayStatus(user.employee?.id);
        }

        // Kiểm tra quyền GPS khi component mount
        if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
            (navigator as any).permissions.query({ name: 'geolocation' }).then((status: any) => {
                setPermissionStatus(status.state);
                status.onchange = () => setPermissionStatus(status.state);
            });
        }
    }, []);

    const fetchTodayStatus = async (employeeId: string) => {
        if (!employeeId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/today?employeeId=${employeeId}`);
            const data = await res.json();
            setTodayData(data);

            if (data.status === 'NOT_CHECKED_IN') {
                setState('INITIAL');
            } else if (data.checkOutTime) {
                setState('FINISHED');
            } else if (data.checkInTime) {
                setState(data.checkInStatus === 'ON_TIME' ? 'SUCCESS' : 'LATE');
            } else if (data.checkInAttempts > 0) {
                setState('RETRY');
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            toastError('Không thể lấy trạng thái chấm công');
        } finally {
            setState(prev => prev === 'LOADING' ? 'INITIAL' : prev);
        }
    };

    const handleAction = async () => {
        if (state === 'FINISHED' || state === 'LOCKED') return;

        const isCheckIn = state === 'INITIAL' || state === 'RETRY';

        if (!isCheckIn && !showConfirm) {
            setShowConfirm(true);
            return;
        }

        setShowConfirm(false);
        setLoading(true);
        setErrorMsg(null);

        if (!navigator.geolocation) {
            toastError('Trình duyệt không hỗ trợ định vị');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const endpoint = isCheckIn ? 'check-in' : 'check-out';
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/${endpoint}?employeeId=${currentUser.employee.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude })
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        setErrorMsg(data.message);
                        if (isCheckIn && data.message.includes('Ngoài phạm vi')) {
                            fetchTodayStatus(currentUser.employee.id);
                        }
                        throw new Error(data.message);
                    }

                    success(isCheckIn ? 'Check-in thành công!' : 'Check-out thành công!');
                    setGpsError(false);
                    fetchTodayStatus(currentUser.employee.id);
                } catch (error: any) {
                    toastError(error.message || 'Có lỗi xảy ra');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                let msg = 'Không thể lấy vị trí của bạn';
                if (error.code === 1) {
                    msg = 'Vui lòng cho phép quyền truy cập vị trí';
                    setPermissionStatus('denied');
                } else if (error.code === 3) {
                    msg = 'Thời gian lấy vị trí quá lâu, vui lòng thử lại';
                }
                setGpsError(true);
                toastError(msg);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const renderButton = () => {
        const baseClass = "w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-lg active:scale-95 cursor-pointer";

        if (gpsError || permissionStatus === 'denied') {
            return (
                <div className="space-y-4 w-full">
                    <button onClick={() => { setGpsError(false); handleAction(); }} className={cn(baseClass, "bg-slate-800 hover:bg-slate-900 text-white animate-in zoom-in-95 duration-300")}>
                        <MapPin className="animate-pulse" size={32} />
                        <span className="text-xl font-bold text-center px-4 uppercase">Yêu cầu bật GPS</span>
                        <span className="text-xs opacity-80 text-center px-6 leading-relaxed">
                            {permissionStatus === 'denied' 
                                ? "Quyền truy cập vị trí đang bị chặn trong cài đặt." 
                                : "Vui lòng cho phép quyền vị trí để xác thực."}
                        </span>
                    </button>
                    
                    {permissionStatus === 'denied' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-600 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            <p className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                <AlertCircle size={14} className="text-primary" />
                                Cách mở lại quyền (Hướng dẫn):
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <p className="font-bold text-primary italic underline uppercase text-[9px]">Dành cho iPhone (Safari):</p>
                                    <p>Vào <b>Cài đặt</b> của máy → <b>Quyền riêng tư & Bảo mật</b> → <b>Dịch vụ định vị</b> → Chọn <b>Trang web Safari</b> → Chọn <b>Khi dùng ứng dụng</b>.</p>
                                </div>
                                <div className="space-y-1 border-t border-slate-100 pt-2">
                                    <p className="font-bold text-primary italic underline uppercase text-[9px]">Dành cho Android (Chrome):</p>
                                    <p>Nhấn biểu tượng <b>⋮</b> (3 chấm) → <b>Cài đặt</b> → <b>Cài đặt trang web</b> → <b>Vị trí</b> → Tìm trang web này và chọn <b>Cho phép</b>.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        switch (state) {
            case 'INITIAL':
                return (
                    <button onClick={handleAction} disabled={loading} className={cn(baseClass, "bg-primary hover:bg-primary/90 text-white shadow-primary-light/50")}>
                        {loading ? <RefreshCcw className="animate-spin" size={32} /> : <MapPin size={32} />}
                        <span className="text-xl font-bold">Bắt đầu chấm công</span>
                        <span className="text-sm opacity-80">Vào ca làm việc</span>
                    </button>
                );
            case 'SUCCESS':
            case 'LATE':
                return (
                    <button onClick={handleAction} disabled={loading} className={cn(baseClass, "bg-accent hover:bg-accent/90 text-white shadow-accent/20")}>
                        {loading ? <RefreshCcw className="animate-spin" size={32} /> : <CheckCircle2 size={32} />}
                        <span className="text-xl font-bold">Đã check-in</span>
                        <span className="text-sm opacity-80">Nhấn để check-out khi về</span>
                    </button>
                );
            case 'RETRY':
                return (
                    <button onClick={handleAction} disabled={loading} className={cn(baseClass, "bg-warning hover:bg-warning/90 text-white shadow-warning/20")}>
                        {loading ? <RefreshCcw className="animate-spin" size={32} /> : <RefreshCcw size={32} />}
                        <span className="text-xl font-bold">Thử lại</span>
                        <span className="text-sm opacity-80">Ngoài phạm vi cho phép</span>
                    </button>
                );
            case 'LOCKED':
                return (
                    <div className={cn(baseClass, "bg-slate-200 text-slate-500 cursor-not-allowed")}>
                        <AlertCircle size={32} strokeWidth={2.5} />
                        <span className="text-xl font-bold">Đã khóa chấm công</span>
                        <span className="text-sm opacity-80 pointer-events-none">Vượt quá số lần thử GPS</span>
                    </div>
                );
            case 'FINISHED':
                return (
                    <div className={cn(baseClass, "bg-indigo-600 text-white shadow-none opacity-80")}>
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                        <span className="text-xl font-bold">Hoàn thành ngày công</span>
                        <span className="text-sm opacity-80">Hẹn gặp lại vào ngày mai!</span>
                    </div>
                );
            default:
                return (
                    <div className={cn(baseClass, "bg-slate-100 text-slate-400 animate-pulse")}>
                        <RefreshCcw size={32} className="animate-spin" />
                    </div>
                );
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pt-10">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-light border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center text-primary">
                    {(currentUser?.employee?.avatarUrl && !imageError) ? (
                        <img
                            src={getFullImageUrl(currentUser.employee.avatarUrl)!}
                            alt={currentUser.employee.fullName}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-black text-xl uppercase">
                            {currentUser?.employee?.fullName?.split(' ').pop()?.charAt(0) || <User size={32} />}
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold font-outfit">{currentUser?.employee?.fullName || 'Nhân viên'}</h2>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                        <Building2 size={14} />
                        <span>{currentUser?.employee?.branch?.name || 'Chi nhánh Superb AI'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chấm công GPS</h1>
                    <p className="text-slate-500 text-sm">Hệ thống tự động xác thực vị trí chi nhánh</p>
                </div>

                <div className="relative">
                    {renderButton()}
                </div>

                {errorMsg && (
                    <div className="bg-primary-light/50 text-primary p-4 rounded-2xl text-sm flex gap-3 animate-in fade-in slide-in-from-top-2 border border-primary/10">
                        <AlertCircle className="shrink-0" size={18} />
                        <p className="font-medium leading-tight">{errorMsg}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Clock size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Vào ca</span>
                        </div>
                        <p className="text-lg font-bold font-mono">
                            {todayData?.checkInTime ? new Date(todayData.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        {todayData?.checkInStatus && (
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                todayData.checkInStatus === 'ON_TIME' ? "bg-accent/10 text-accent" : "bg-primary-light text-primary"
                            )}>
                                {todayData.checkInStatus === 'ON_TIME' ? 'Đúng giờ' : 'Muộn'}
                            </span>
                        )}
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Clock size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Ra ca</span>
                        </div>
                        <p className="text-lg font-bold font-mono">
                            {todayData?.checkOutTime ? new Date(todayData.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        {todayData?.checkOutStatus && (
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                todayData.checkOutStatus === 'OVERTIME' ? "bg-indigo-100 text-indigo-600" :
                                    todayData.checkOutStatus === 'ON_TIME' ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
                            )}>
                                {todayData.checkOutStatus === 'OVERTIME' ? 'Tăng ca' :
                                    todayData.checkOutStatus === 'ON_TIME' ? 'Đúng giờ' : 'Về sớm'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-warning/10 rounded-2xl p-5 border border-warning/20">
                <h3 className="text-warning font-bold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Lưu ý quan trọng
                </h3>
                <ul className="text-warning/80 text-xs space-y-1.5 leading-relaxed font-medium">
                    <li>• Vui lòng bật GPS và cho phép trình duyệt truy cập vị trí.</li>
                    <li>• Khoảng cách cho phép tối đa là 70 mét tính từ tâm chi nhánh.</li>
                    <li>• Nếu sai lệch GPS, hãy di chuyển ra nơi thoáng đãng và thử lại.</li>
                </ul>
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                title="Xác nhận Check-out"
                message="Bạn có chắc chắn muốn kết thúc ca làm việc và thực hiện Check-out ngay bây giờ không?"
                confirmLabel="Đồng ý Check-out"
                cancelLabel="Để sau"
                onConfirm={handleAction}
                onCancel={() => setShowConfirm(false)}
            />
        </div>
    );
}
