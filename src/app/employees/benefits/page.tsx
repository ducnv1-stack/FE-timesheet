"use client";

import { useState, useEffect } from 'react';
import { Gift, Cake, Calendar, Star, ChevronRight, User, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BenefitsPage() {
    const [activeTab, setActiveTab ] = useState('BIRTHDAYS');
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const fetchBirthdays = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/employees/upcoming-birthdays`);
                const data = await res.json();
                setBirthdays(data);
            } catch (error) {
                console.error('Error fetching birthdays:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBirthdays();
    }, []);

    const getFullImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const getDayLabel = (days: number) => {
        if (days === 0) return "Hôm nay! 🎂";
        if (days === 1) return "Ngày mai";
        return `Còn ${days} ngày`;
    };

    const getCardStyles = (days: number) => {
        if (days === 0) return "bg-rose-50 border-rose-500 text-rose-700 shadow-rose-100 ring-4 ring-rose-500/10";
        if (days === 1) return "bg-orange-50 border-orange-400 text-orange-700 shadow-orange-100";
        return "bg-amber-50 border-amber-300 text-amber-900 shadow-amber-100";
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <Gift className="text-rose-500" size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Đãi ngộ nhân viên
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Quản lý các chương trình phúc lợi, sinh nhật và ưu đãi nội bộ dành cho đội ngũ.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 gap-8">
                <button
                    onClick={() => setActiveTab('BIRTHDAYS')}
                    className={cn(
                        "pb-4 px-2 font-black text-sm transition-all relative flex items-center gap-2",
                        activeTab === 'BIRTHDAYS' ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Cake size={18} />
                    Sinh nhật
                    {birthdays.length > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                            {birthdays.length}
                        </span>
                    )}
                    {activeTab === 'BIRTHDAYS' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 rounded-t-full shadow-[0_-4px_10px_rgba(244,63,94,0.3)]" />
                    )}
                </button>
                <button
                    disabled
                    className="pb-4 px-2 font-black text-sm text-slate-300 cursor-not-allowed flex items-center gap-2 group"
                >
                    <Star size={18} className="opacity-30" />
                    Thưởng lễ tết
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">Soon</span>
                </button>
            </div>

            {/* Content */}
            {activeTab === 'BIRTHDAYS' && (
                <div className="space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-rose-500 mb-4" size={40} />
                            <p className="text-slate-500 font-bold">Đang lấy danh sách sinh nhật...</p>
                        </div>
                    ) : birthdays.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {birthdays.map((emp) => (
                                <div
                                    key={emp.id}
                                    className={cn(
                                        "group relative p-6 rounded-[32px] border-2 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl overflow-hidden cursor-default",
                                        getCardStyles(emp.daysRemaining)
                                    )}
                                >
                                    {/* Subtle Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                        <div className="relative">
                                            {emp.avatarUrl ? (
                                                <img 
                                                    src={getFullImageUrl(emp.avatarUrl)!} 
                                                    alt={emp.fullName}
                                                    className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white shadow-xl group-hover:rotate-3 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-2xl font-black shadow-xl ring-4 ring-white group-hover:rotate-3 transition-transform duration-500">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                            )}
                                            {emp.daysRemaining === 0 && (
                                                <div className="absolute -top-3 -right-3 bg-gradient-to-tr from-rose-500 to-pink-400 text-white p-2 rounded-2xl shadow-lg animate-bounce">
                                                    <Cake size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl shadow-sm inline-block",
                                                emp.daysRemaining === 0 
                                                    ? "bg-rose-500 text-white animate-pulse" 
                                                    : "bg-white/80 backdrop-blur-sm border border-current/10"
                                            )}>
                                                {getDayLabel(emp.daysRemaining)}
                                            </span>
                                            <div className="text-xl font-black mt-3 flex flex-col items-end">
                                                <span className="opacity-40 text-[10px] uppercase font-bold tracking-tighter">Ngày sinh</span>
                                                <span className="tabular-nums">
                                                    {emp.birthdayDate.toString().padStart(2, '0')}
                                                    <span className="mx-0.5 opacity-30">/</span>
                                                    {emp.birthdayMonth.toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <h3 className="font-black text-xl leading-snug group-hover:text-rose-600 transition-colors">
                                                {emp.fullName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="p-1 px-2 rounded-lg bg-black/5 flex items-center gap-1.5">
                                                    <Briefcase size={12} className="opacity-60" />
                                                    <span className="text-[11px] font-black uppercase tracking-tight opacity-70">
                                                        {emp.pos?.name || emp.position || 'Nhân viên'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 flex items-center gap-2 text-[12px] font-black opacity-60">
                                            <MapPin size={14} className="text-rose-500" />
                                            {emp.branch?.name || 'Văn phòng chính'}
                                        </div>
                                    </div>

                                    {/* Abstract background shapes */}
                                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:scale-125 pointer-events-none">
                                        <Cake size={120} />
                                    </div>
                                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[64px] border-4 border-dashed border-slate-100 animate-in zoom-in duration-500">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 group overflow-hidden">
                                <Star className="text-slate-200 group-hover:text-amber-400 transition-colors duration-500 group-hover:scale-125" size={64} fill="currentColor" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Chưa có sinh nhật nào sắp tới</h3>
                            <p className="text-slate-400 font-bold max-w-sm text-center">Chúng tôi sẽ tự động thông báo tại đây khi có nhân viên sắp bước sang tuổi mới trong 7 ngày tới.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
