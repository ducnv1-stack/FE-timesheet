"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Download,
    Search,
    Calendar,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast';

interface PerformanceRecord {
    employeeId: string;
    fullName: string;
    branchName: string;
    totalOrders: number;      // New
    totalRevenue: number;
    lowPriceValue: number;
    lowPriceRatio: number;
    milestone: number;
    baseReward: number;
    actualReward: number;
    hotBonus: number;         // New
    commission: number;       // New
    shippingFee: number;      // New
    baseSalary: number;       // New
    netIncome: number;        // New
    isPenalty: boolean;
    isClemency: boolean;
}

export default function PerformancePage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [records, setRecords] = useState<PerformanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { error: toastError } = useToast();
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(user);
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'];
        if (!allowedRoles.includes(parsedUser.role?.code)) {
            router.push('/dashboard');
            return;
        }

        fetchReport();
    }, [month, year]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/employees/performance/report?month=${month}&year=${year}`);
            if (!res.ok) throw new Error('Không thể tải báo cáo');
            const data = await res.json();
            setRecords(data);
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        const exportData = records.map(r => ({
            'Nhân viên': r.fullName,
            'Chi nhánh': r.branchName || '-',
            'Tổng đơn': r.totalOrders,
            'Doanh số': r.totalRevenue,
            'Hoa hồng': r.commission,
            'Thưởng nóng': r.hotBonus,
            'Tiền ship': r.shippingFee,
            'Đơn dưới Min': r.lowPriceValue,
            'Tỷ lệ thấp (%)': r.lowPriceRatio.toFixed(1),
            'Mốc doanh số': r.milestone,
            'Thưởng mốc (gốc)': r.baseReward,
            'Thưởng mốc (thực tế)': r.actualReward,
            'Lương cơ bản': r.baseSalary,
            'Thực nhận': r.netIncome,
            'Trạng thái': r.isClemency ? 'Khoan hồng' : (r.isPenalty ? 'Bị phạt' : 'Bình thường')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);

        // Apply number formatting for currency columns
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const currencyCols = [3, 4, 5, 6, 7, 9, 10, 11, 12, 13]; // Doanh số, Hoa hồng, Thưởng nóng, Ship, Đơn dưới Min, Mốc, Thưởng gốc, Thưởng thực tế, Lương CB, Thực nhận

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            currencyCols.forEach(C => {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[cellAddress]) {
                    ws[cellAddress].t = 'n'; // Set type to number
                    ws[cellAddress].z = '#,##0 "₫"'; // Vietnamese currency format
                }
            });
        }

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 20 }, // Nhân viên
            { wch: 15 }, // Chi nhánh
            { wch: 10 }, // Tổng đơn
            { wch: 15 }, // Doanh số
            { wch: 15 }, // Hoa hồng
            { wch: 15 }, // Thưởng nóng
            { wch: 12 }, // Tiền ship
            { wch: 15 }, // Đơn dưới Min
            { wch: 12 }, // Tỷ lệ
            { wch: 15 }, // Mốc doanh số
            { wch: 15 }, // Thưởng mốc gốc
            { wch: 15 }, // Thưởng mốc thực tế
            { wch: 15 }, // Lương CB
            { wch: 15 }, // Thực nhận
            { wch: 15 }  // Trạng thái
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Bao_cao_T${month}_${year}`);
        XLSX.writeFile(wb, `Bao_cao_Doanh_so_T${month}_${year}.xlsx`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const filteredRecords = records.filter(r =>
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.branchName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pt-1 px-3 pb-3">
            <div className="max-w-[1600px] mx-auto space-y-3">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="text-rose-500" size={20} />
                            Báo Cáo Doanh Số & Thưởng
                        </h1>
                        <p className="text-slate-400 font-medium text-xs">Theo dõi hiệu suất và chính sách thưởng cá nhân</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg">
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="bg-transparent px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="bg-transparent px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                            >
                                {Array.from({ length: new Date().getFullYear() - 2025 + 2 }, (_, i) => 2025 + i).map(y => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95 whitespace-nowrap"
                        >
                            <FileSpreadsheet size={16} />
                            Xuất Excel
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên nhân viên hoặc chi nhánh..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-medium"
                    />
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300 whitespace-nowrap">
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200">Nhân viên</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200">Chi nhánh</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-center border-r border-slate-200">Tổng đơn</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Doanh số</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Hoa hồng</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Thưởng nóng</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Tiền ship</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Đơn dưới Min</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-center border-r border-slate-200">Tỷ lệ</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Mốc thưởng</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Lương CB</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Thực nhận</th>
                                    <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={13} className="px-6 py-8 bg-slate-50/30"></td>
                                        </tr>
                                    ))
                                ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map((r) => (
                                        <tr key={r.employeeId} className="hover:bg-slate-50 transition-colors group text-[12px] border-b border-slate-100">
                                            <td className="px-2 py-2 whitespace-nowrap font-bold text-slate-900 border-r border-slate-100">{r.fullName}</td>
                                            <td className="px-2 py-2 whitespace-nowrap text-slate-600 border-r border-slate-100">{r.branchName || '-'}</td>
                                            <td className="px-2 py-2 text-center font-bold text-slate-700 border-r border-slate-100">{r.totalOrders}</td>
                                            <td className="px-2 py-2 text-right font-bold text-indigo-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.totalRevenue)}</td>
                                            <td className="px-2 py-2 text-right font-medium text-slate-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.commission)}</td>
                                            <td className="px-2 py-2 text-right font-medium text-amber-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.hotBonus)}</td>
                                            <td className="px-2 py-2 text-right font-medium text-blue-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.shippingFee)}</td>
                                            <td className="px-2 py-2 text-right text-slate-500 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.lowPriceValue)}</td>
                                            <td className="px-2 py-2 text-center border-r border-slate-100">
                                                <span className={cn(
                                                    "px-1 py-0.5 rounded text-[9px] font-black",
                                                    r.lowPriceRatio >= 20 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                                )}>
                                                    {r.lowPriceRatio.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 text-right border-r border-slate-100">
                                                <div className="font-bold text-slate-700 whitespace-nowrap">{formatCurrency(r.milestone)}</div>
                                                <div className={cn(
                                                    "text-[9px] font-bold uppercase mt-0.5",
                                                    (r.isPenalty && !r.isClemency) ? "text-slate-400 line-through" : "text-slate-500"
                                                )}>
                                                    Thưởng: {formatCurrency(r.baseReward)}
                                                </div>
                                                {(r.isPenalty && !r.isClemency) && (
                                                    <div className="text-[10px] font-black text-red-600 mt-0.5">
                                                        {formatCurrency(r.actualReward)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-right font-bold text-slate-700 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.baseSalary)}</td>
                                            <td className="px-2 py-2 text-right border-r border-slate-100">
                                                <div className={cn(
                                                    "font-black whitespace-nowrap text-[12px]",
                                                    r.isPenalty && !r.isClemency ? "text-red-600" : "text-emerald-600"
                                                )}>
                                                    {formatCurrency(r.netIncome)}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <div className="flex justify-center">
                                                    {r.isClemency ? (
                                                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap border border-amber-200">
                                                            <CheckCircle2 size={10} /> Khoan hồng
                                                        </div>
                                                    ) : r.isPenalty ? (
                                                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap border border-red-200">
                                                            <AlertTriangle size={10} /> Bị phạt
                                                        </div>
                                                    ) : r.totalRevenue > 0 ? (
                                                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap border border-emerald-200">
                                                            <CheckCircle2 size={10} /> Hợp lệ
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <FileSpreadsheet size={48} className="text-slate-300" />
                                                <p className="font-bold text-slate-400">Không tìm thấy dữ liệu phù hợp</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Policy Legend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            CHÍNH SÁCH PHẠT (20%)
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            Nếu tổng giá trị các mặt hàng bán <span className="text-red-600 font-bold">dưới giá Min</span> chiếm hơn <span className="bg-red-50 text-red-600 px-1 rounded font-bold">20%</span> doanh số cá nhân, thưởng mốc đạt được sẽ bị giảm xuống còn <span className="font-bold">70%</span>.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            CHẾ ĐỘ KHOAN HỒNG (110%)
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            Nếu doanh số thực tế đạt trên <span className="bg-emerald-50 text-emerald-600 px-1 rounded font-bold">110%</span> so với mốc thưởng đang xét, nhân viên sẽ được xóa phạt và hưởng <span className="font-bold">100%</span> thưởng mốc.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
