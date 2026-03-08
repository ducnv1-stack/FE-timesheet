import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

export default function KPIPeriodTrend({ periodStats }: { periodStats: any[] }) {
    if (!periodStats || periodStats.length === 0) return null;

    const totalBonus = periodStats.reduce((sum, p) => sum + p.bonus, 0);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Tiến độ KPI theo kỳ</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Chia làm 3 kỳ (1-10, 11-20, 21-hết tháng)</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Thưởng kỳ (Tạm tính)</p>
                    <p className={`text-sm font-black ${totalBonus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {totalBonus > 0 ? `+${formatCurrency(totalBonus)}` : formatCurrency(totalBonus)}
                    </p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {periodStats.map((period, idx) => {
                        const percent = (period.revenue / period.target) * 100;
                        const isAchieved = period.status === 'achieved';
                        const isFailed = period.status === 'failed';
                        const isOngoing = period.status === 'ongoing';

                        return (
                            <div key={idx} className={`p-4 rounded-2xl border transition-all ${isOngoing ? 'bg-amber-50/30 border-amber-100 shadow-sm' :
                                isAchieved ? 'bg-emerald-50/20 border-emerald-100' :
                                    isFailed ? 'bg-rose-50/20 border-rose-100' : 'bg-slate-50/30 border-slate-100'
                                }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-wider ${isOngoing ? 'text-amber-600' : 'text-slate-400'}`}>
                                            {period.label} {isOngoing && '(Hôm nay)'}
                                        </p>
                                        <p className="text-[9px] text-slate-500 font-bold">
                                            {formatDateFns(new Date(period.startDate), 'dd/MM')} - {formatDateFns(new Date(period.endDate), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    {isAchieved && <CheckCircle size={16} className="text-emerald-500" />}
                                    {isFailed && <AlertCircle size={16} className="text-rose-500" />}
                                    {isOngoing && <Clock size={16} className="text-amber-500 animate-pulse" />}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{formatCurrency(period.revenue)}</p>
                                            <p className="text-[8px] text-slate-400 font-medium tracking-tight">Mục tiêu: {formatCurrency(period.target)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xs font-black ${isAchieved ? 'text-emerald-600' : isFailed ? 'text-rose-600' : 'text-amber-600'}`}>
                                                {percent.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isAchieved ? 'bg-emerald-500' : isOngoing ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : isFailed ? 'bg-rose-500' : 'bg-slate-300'
                                                }`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100/50">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                                            {period.status === 'upcoming' ? 'Trạng thái' : 'Thưởng/Phạt'}
                                        </p>
                                        <p className={`text-[10px] font-black ${period.bonus > 0 ? 'text-emerald-600' : (period.bonus < 0 ? 'text-rose-600' : 'text-slate-400')}`}>
                                            {period.status === 'upcoming' ? 'Chưa đến' : (period.bonus > 0 ? `+${formatCurrency(period.bonus)}` : formatCurrency(period.bonus))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
