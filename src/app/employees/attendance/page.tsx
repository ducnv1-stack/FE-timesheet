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
    const [distance, setDistance] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [gpsError, setGpsError] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { success, error: toastError } = useToast();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            fetchTodayStatus(user.employee?.id);
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

        // Xác nhận trước khi Check-out bằng Modal hệ thống
        if (!isCheckIn && !showConfirm) {
            setShowConfirm(true);
            return;
        }

        setShowConfirm(false);
        setLoading(true);
        setErrorMsg(null);

        // 1. Lấy tọa độ GPS
        if (!navigator.geolocation) {
            toastError('Trình duyệt không hỗ trợ định vị');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const isCheckIn = state === 'INITIAL' || state === 'RETRY';
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
                            // Cập nhật lại trạng thái retry từ server
                            fetchTodayStatus(currentUser.employee.id);
                        }
                        throw new Error(data.message);
                    }

                    success(isCheckIn ? 'Check-in thành công!' : 'Check-out thành công!');
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
                    setGpsError(true);
                }
                toastError(msg);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const renderButton = () => {
        const baseClass = "w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-lg active:scale-95 cursor-pointer";

        switch (state) {
            case 'INITIAL':
                return (
                    <button onClick={handleAction} disabled={loading} className={cn(baseClass, "bg-rose-600 hover:bg-rose-700 text-white")}>
                        {loading ? <RefreshCcw className="animate-spin" size={32} /> : <MapPin size={32} />}
                        <span className="text-xl font-bold">BẮT ĐẦU CHẤM CÔNG</span>
                        <span className="text-sm opacity-80 uppercase">Vào ca làm việc</span>
                    </button>
                );
            case 'SUCCESS':
            case 'LATE':
                return (
                    <button onClick={handleAction} disabled={loading} className={cn(baseClass, "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                        {loading ? <RefreshCcw className="animate-spin" size={32} /> : <CheckCircle2 size={32} />}
                        <span className="text-xl font-bold">ĐÃ CHECK-IN</span>
                        <span className="text-sm opacity-80 uppercase">NHẤN ĐỂ CHECK-OUT KHI VỀ</span>
                    </button>
                );
            case 'RETRY':
                return (
                    <button onClick={handleAction} disabled={loading} className={cn(baseClass, "bg-amber-500 hover:bg-amber-600 text-white")}>
                        {loading ? <RefreshCcw className="animate-spin" size={32} /> : <RefreshCcw size={32} />}
                        <span className="text-xl font-bold uppercase">THỬ LẠI</span>
                        <span className="text-sm opacity-80 uppercase">NGOÀI PHẠM VI CHO PHÉP</span>
                    </button>
                );
            case 'LOCKED':
                return (
                    <div className={cn(baseClass, "bg-slate-200 text-slate-500 cursor-not-allowed")}>
                        <AlertCircle size={32} strokeWidth={2.5} />
                        <span className="text-xl font-bold">ĐÃ KHÓA CHẤM CÔNG</span>
                        <span className="text-sm opacity-80 pointer-events-none">VƯỢT QUÁ SỐ LẦN THỬ GPS</span>
                    </div>
                );
            case 'FINISHED':
                return (
                    <div className={cn(baseClass, "bg-blue-600 text-white shadow-none opacity-80")}>
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                        <span className="text-xl font-bold">HOÀN THÀNH NGÀY CÔNG</span>
                        <span className="text-sm opacity-80">HẸN GẶP LẠI VÀO NGÀY MAI!</span>
                    </div>
                );
            default:
                if (gpsError) {
                    return (
                        <button onClick={() => { setGpsError(false); handleAction(); }} className={cn(baseClass, "bg-slate-800 hover:bg-slate-900 text-white animate-in zoom-in-95 duration-300")}>
                            <MapPin className="animate-pulse" size={32} />
                            <span className="text-xl font-bold uppercase">BẬT GPS / THỬ LẠI</span>
                            <span className="text-sm opacity-80 uppercase text-center px-4">Hệ thống cần vị trí để xác thực</span>
                        </button>
                    );
                }
                return (
                    <div className={cn(baseClass, "bg-slate-100 text-slate-400 animate-pulse")}>
                        <RefreshCcw size={32} className="animate-spin" />
                    </div>
                );
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pt-10">
            {/* User Info Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <User size={32} />
                </div>
                <div>
                    <h2 className="text-xl font-bold font-outfit">{currentUser?.employee?.fullName || 'Nhân viên'}</h2>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                        <Building2 size={14} />
                        <span>{currentUser?.employee?.branch?.name || 'Chi nhánh Ohari'}</span>
                    </div>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">CHẤM CÔNG GPS</h1>
                    <p className="text-slate-500 text-sm">Hệ thống tự động xác thực vị trí chi nhánh</p>
                </div>

                <div className="relative">
                    {renderButton()}
                </div>

                {errorMsg && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="shrink-0" size={18} />
                        <p className="font-medium leading-tight">{errorMsg}</p>
                    </div>
                )}

                {/* Status Summary */}
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
                                todayData.checkInStatus === 'ON_TIME' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                                {todayData.checkInStatus === 'ON_TIME' ? 'ĐÚNG GIỜ' : 'MUỘN'}
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
                                todayData.checkOutStatus === 'OVERTIME' ? "bg-blue-100 text-blue-600" :
                                    todayData.checkOutStatus === 'ON_TIME' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                            )}>
                                {todayData.checkOutStatus === 'OVERTIME' ? 'TĂNG CA' :
                                    todayData.checkOutStatus === 'ON_TIME' ? 'ĐÚNG GIỜ' : 'VỀ SỚM'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Note Section */}
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50">
                <h3 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Lưu ý quan trọng
                </h3>
                <ul className="text-amber-700/80 text-xs space-y-1.5 leading-relaxed font-medium">
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
