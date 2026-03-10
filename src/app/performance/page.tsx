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
import { ChevronDown, Check } from 'lucide-react';
import EmployeeOrdersModal from '@/components/performance/EmployeeOrdersModal';

interface PerformanceRecord {
    employeeId: string;
    fullName: string;
    branchName: string;
    totalOrders: number;
    grossRevenue: number;        // New
    totalRevenue: number;
    branchTotalOrders: number;   // New
    branchTotalRevenue: number;  // New
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
    position: string;         // New
    department: string | null; // New
    branchId: string;         // New
    status: string;           // New
    avatarUrl: string | null; // New
}

interface Branch {
    id: string;
    name: string;
}

function MultiSelect({
    label,
    options,
    selected,
    onChange,
    placeholder
}: {
    label: string;
    options: { label: string; value: string }[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const isAllSelected = selected.length === 0;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 flex items-center justify-between hover:border-rose-500 transition-all shadow-sm outline-none"
            >
                <span className="truncate">
                    {isAllSelected ? placeholder : `${label} (${selected.length})`}
                </span>
                <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-1 py-2">
                        <div
                            onClick={() => {
                                onChange([]);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-bold transition-colors",
                                isAllSelected ? "bg-rose-50 text-rose-600" : "hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            <span>Tất cả {label}</span>
                            {isAllSelected && <Check size={14} />}
                        </div>
                        <div className="h-px bg-slate-100 my-1" />
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => toggleOption(opt.value)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-colors mb-0.5",
                                    selected.includes(opt.value) ? "bg-rose-50 text-rose-600 font-bold" : "hover:bg-slate-50 text-slate-600"
                                )}
                            >
                                <span>{opt.label}</span>
                                {selected.includes(opt.value) && <Check size={14} />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function PerformancePage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [records, setRecords] = useState<PerformanceRecord[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [isManager, setIsManager] = useState(false);
    const [managerBranchId, setManagerBranchId] = useState<string | null>(null);
    const [managerBranchName, setManagerBranchName] = useState<string>('');
    const [selectedEmployeeForOrders, setSelectedEmployeeForOrders] = useState<PerformanceRecord | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const { error: toastError } = useToast();
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getFullImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handleImageError = (key: string) => {
        setImageErrors(prev => ({ ...prev, [key]: true }));
    };

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(user);
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MANAGER', 'ADMIN'];
        if (!allowedRoles.includes(parsedUser.role?.code)) {
            router.push('/dashboard');
            return;
        }

        if (parsedUser.role?.code === 'MANAGER' && parsedUser.employee?.branchId) {
            setIsManager(true);
            setManagerBranchId(parsedUser.employee.branchId);
            setManagerBranchName(parsedUser.employee.branch?.name || '');
        }

        fetchBranches();
        fetchReport();
    }, [month, year]);

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_URL}/branches`);
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const user = localStorage.getItem('user');
            const parsedUser = user ? JSON.parse(user) : null;
            const branchFilter = parsedUser?.role?.code === 'MANAGER' && parsedUser?.employee?.branchId
                ? `&branchId=${parsedUser.employee.branchId}` : '';
            const res = await fetch(`${API_URL}/employees/performance/report?month=${month}&year=${year}${branchFilter}`);
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
        const exportData = filteredRecords.map(r => {
            if (isManager) {
                return {
                    'Nhân viên': r.fullName,
                    'Chi nhánh': r.branchName || '-',
                    'Chức vụ': r.position || '-',
                    'Tổng đơn': r.totalOrders,
                    'Doanh số bán': r.grossRevenue,
                    'Doanh số hoàn thành': r.totalRevenue,
                    'Đơn dưới Min': r.lowPriceValue,
                    'Tỷ lệ thấp (%)': r.lowPriceRatio.toFixed(1),
                };
            }
            return {
                'Nhân viên': r.fullName,
                'Chi nhánh': r.branchName || '-',
                'Chức vụ': r.position || '-',
                'Tổng đơn': r.totalOrders,
                'Doanh số bán': r.grossRevenue,
                'Doanh số hoàn thành': r.totalRevenue,
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
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        if (!isManager) {
            const currencyCols = [4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15];
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                currencyCols.forEach(C => {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws[cellAddress]) {
                        ws[cellAddress].t = 'n';
                        ws[cellAddress].z = '#,##0 "₫"';
                    }
                });
            }
            ws['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];
        } else {
            const currencyCols = [4, 5, 6];
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                currencyCols.forEach(C => {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws[cellAddress]) {
                        ws[cellAddress].t = 'n';
                        ws[cellAddress].z = '#,##0 "₫"';
                    }
                });
            }
            ws['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
            ];
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Bao_cao_T${month}_${year}`);
        XLSX.writeFile(wb, `Bao_cao_Doanh_so_T${month}_${year}.xlsx`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const filteredRecords = records.filter(r => {
        const matchSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.branchName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBranch = selectedBranches.length === 0 || selectedBranches.includes(r.branchId);
        const matchPosition = selectedPositions.length === 0 || selectedPositions.includes(r.position);
        const matchDepartment = selectedDepartments.length === 0 || (r.department && selectedDepartments.includes(r.department));

        return matchSearch && matchBranch && matchPosition && matchDepartment;
    });

    return (
        <div className="min-h-screen bg-slate-50/50 pt-1 px-3 pb-3">
            <div className="max-w-[1600px] mx-auto space-y-3">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="text-rose-500" size={20} />
                            {isManager ? 'Báo Cáo Doanh Số Chi Nhánh' : 'Báo Cáo Doanh Số & Thưởng'}
                        </h1>
                        <p className="text-slate-400 font-medium text-xs">
                            {isManager ? `Chi nhánh: ${managerBranchName}` : 'Theo dõi hiệu suất và chính sách thưởng cá nhân'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg">
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="bg-transparent px-2 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="bg-transparent px-2 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                                {Array.from({ length: new Date().getFullYear() - 2025 + 2 }, (_, i) => 2025 + i).map(y => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95 whitespace-nowrap cursor-pointer"
                        >
                            <FileSpreadsheet size={16} />
                            Xuất Excel
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative group col-span-1 md:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-medium"
                        />
                    </div>

                    {isManager ? (
                        <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 flex items-center gap-2 cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            {managerBranchName || 'Chi nhánh của bạn'}
                        </div>
                    ) : (
                        <MultiSelect
                            label="Chi nhánh"
                            placeholder="Tất cả chi nhánh"
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                            selected={selectedBranches}
                            onChange={setSelectedBranches}
                        />
                    )}

                    <MultiSelect
                        label="Phòng ban"
                        placeholder="Tất cả phòng ban"
                        options={[
                            { label: 'BGĐ', value: 'BGĐ' },
                            { label: 'MKT', value: 'MKT' },
                            { label: 'HCKT', value: 'HCKT' },
                            { label: 'Kỹ Thuật', value: 'Kỹ Thuật' },
                            { label: 'Kho', value: 'Kho' },
                            { label: 'Lái xe', value: 'Lái xe' },
                            { label: 'Phòng KD', value: 'Phòng KD' },
                        ]}
                        selected={selectedDepartments}
                        onChange={setSelectedDepartments}
                    />

                    <MultiSelect
                        label="Chức vụ"
                        placeholder="Tất cả chức vụ"
                        options={[
                            { label: 'Giám đốc (GĐ)', value: 'GĐ' },
                            { label: 'Giám đốc kinh doanh (GĐKD)', value: 'GĐKD' },
                            { label: 'Nhân viên bán hàng (NVBH)', value: 'NVBH' },
                            { label: 'Nhân viên giao hàng (NVGH)', value: 'NVGH' },
                            { label: 'Quản Lý', value: 'Quản Lý' },
                            { label: 'Kế toán', value: 'Kế toán' },
                            { label: 'Nhân viên kỹ thuật (NVKT)', value: 'NVKT' },
                            { label: 'Lái xe (Driver)', value: 'Driver' },
                            { label: 'Marketing', value: 'Marketing' },
                        ]}
                        selected={selectedPositions}
                        onChange={setSelectedPositions}
                    />
                </div>

                {/* Totals calculation for filtered records */}
                {(() => {
                    const totals = filteredRecords.reduce((acc, r) => ({
                        totalOrders: acc.totalOrders + (r.totalOrders || 0),
                        grossRevenue: acc.grossRevenue + (Number(r.grossRevenue) || 0),
                        totalRevenue: acc.totalRevenue + (Number(r.totalRevenue) || 0),
                        commission: acc.commission + (Number(r.commission) || 0),
                        hotBonus: acc.hotBonus + (Number(r.hotBonus) || 0),
                        shippingFee: acc.shippingFee + (Number(r.shippingFee) || 0),
                        lowPriceValue: acc.lowPriceValue + (Number(r.lowPriceValue) || 0),
                        baseSalary: acc.baseSalary + (Number(r.baseSalary) || 0),
                        netIncome: acc.netIncome + (Number(r.netIncome) || 0),
                    }), {
                        totalOrders: 0,
                        grossRevenue: 0,
                        totalRevenue: 0,
                        commission: 0,
                        hotBonus: 0,
                        shippingFee: 0,
                        lowPriceValue: 0,
                        baseSalary: 0,
                        netIncome: 0
                    });

                    const colCount = isManager ? 8 : 15;

                    return (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                            <div className="overflow-auto max-h-[calc(100vh-230px)] custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-20 shadow-sm">
                                        <tr className="bg-slate-100 border-b-2 border-slate-300 whitespace-nowrap">
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200 text-center">STT</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200 text-center">Ảnh</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200">Nhân viên</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200">Chi nhánh</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase border-r border-slate-200">Chức vụ</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-center border-r border-slate-200">Tổng đơn</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-rose-600 uppercase text-right border-r border-slate-200 bg-rose-50/50">Doanh số bán</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-emerald-600 uppercase text-right border-r border-slate-200 bg-emerald-50/50">DS hoàn thành</th>
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Hoa hồng</th>}
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Thưởng nóng</th>}
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Tiền ship</th>}
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Đơn dưới Min</th>
                                            <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-center border-r border-slate-200">Tỷ lệ</th>
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Mốc thưởng</th>}
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Lương CB</th>}
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-right border-r border-slate-200">Thực nhận</th>}
                                            {!isManager && <th className="px-2 py-2 text-[10px] font-black text-slate-600 uppercase text-center">Trạng thái</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={colCount + 2} className="px-6 py-8 bg-slate-50/30"></td>
                                                </tr>
                                            ))
                                        ) : filteredRecords.length > 0 ? (
                                            filteredRecords.map((r, idx) => (
                                                <tr key={r.employeeId} className="hover:bg-slate-50 transition-colors group text-[12px] border-b border-slate-100">
                                                    <td className="px-2 py-2 text-center border-r border-slate-100 font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="px-2 py-2 border-r border-slate-100">
                                                        <div className="flex justify-center">
                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-50 border border-slate-100 shrink-0 flex items-center justify-center">
                                                                {(r.avatarUrl && !imageErrors[`perf-${r.employeeId}`]) ? (
                                                                    <img
                                                                        src={getFullImageUrl(r.avatarUrl)!}
                                                                        alt={r.fullName}
                                                                        className="w-full h-full object-cover"
                                                                        onError={() => handleImageError(`perf-${r.employeeId}`)}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-rose-500 font-black text-[10px] uppercase">
                                                                        {r.fullName.split(' ').pop()?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap font-bold border-r border-slate-100 group-hover:bg-rose-50/50 transition-colors">
                                                        <button
                                                            onClick={() => setSelectedEmployeeForOrders(r)}
                                                            className="text-slate-900 group-hover:text-rose-700 hover:underline cursor-pointer text-left"
                                                        >
                                                            {r.fullName}
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-slate-600 border-r border-slate-100">{r.branchName || '-'}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-slate-600 border-r border-slate-100">{r.position || '-'}</td>
                                                    <td className="px-2 py-2 text-center border-r border-slate-100">
                                                        <div className="font-bold text-slate-700">{r.totalOrders}</div>
                                                        {!isManager && r.position?.toLowerCase().includes('telesale') && <div className="text-[9px] text-slate-400 font-bold uppercase">(System)</div>}
                                                    </td>
                                                    <td className="px-2 py-2 text-right border-r border-slate-100 bg-rose-50/10">
                                                        <div className="font-bold text-rose-600 whitespace-nowrap">{formatCurrency(r.grossRevenue)}</div>
                                                    </td>
                                                    <td className="px-2 py-2 text-right border-r border-slate-100 bg-emerald-50/10">
                                                        <div className="font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(r.totalRevenue)}</div>
                                                        {!isManager && r.position?.toLowerCase().includes('telesale') && <div className="text-[9px] text-slate-400 font-bold uppercase">(Hệ thống)</div>}
                                                        {!isManager && (r.position?.toLowerCase().includes('manager') || r.position?.toLowerCase().includes('quản lý')) && <div className="text-[9px] text-amber-500 font-bold uppercase">(Chi nhánh)</div>}
                                                        {!isManager && r.position?.toLowerCase().includes('marketing') && <div className="text-[9px] text-slate-400 font-bold uppercase">(Hệ thống)</div>}
                                                        {!isManager && ['lái xe', 'nvgh', 'driver'].some(p => r.position?.toLowerCase().includes(p)) && <div className="text-[9px] text-blue-500 font-bold uppercase">(Phí ship)</div>}
                                                    </td>
                                                    {!isManager && <td className="px-2 py-2 text-right font-medium text-slate-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.commission)}</td>}
                                                    {!isManager && <td className="px-2 py-2 text-right font-medium text-amber-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.hotBonus)}</td>}
                                                    {!isManager && <td className="px-2 py-2 text-right font-medium text-blue-600 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.shippingFee)}</td>}
                                                    <td className="px-2 py-2 text-right text-slate-500 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.lowPriceValue)}</td>
                                                    <td className="px-2 py-2 text-center border-r border-slate-100">
                                                        <span className={cn(
                                                            "px-1 py-0.5 rounded text-[9px] font-black",
                                                            r.lowPriceRatio >= 20 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                                        )}>
                                                            {r.lowPriceRatio.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    {!isManager && (
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
                                                    )}
                                                    {!isManager && <td className="px-2 py-2 text-right font-bold text-slate-700 whitespace-nowrap border-r border-slate-100">{formatCurrency(r.baseSalary)}</td>}
                                                    {!isManager && (
                                                        <td className="px-2 py-2 text-right border-r border-slate-100">
                                                            <div className={cn(
                                                                "font-black whitespace-nowrap text-[12px]",
                                                                r.isPenalty && !r.isClemency ? "text-red-600" : "text-emerald-600"
                                                            )}>
                                                                {formatCurrency(r.netIncome)}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {!isManager && (
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
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={colCount + 2} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                                        <FileSpreadsheet size={48} className="text-slate-300" />
                                                        <p className="font-bold text-slate-400">Không tìm thấy dữ liệu phù hợp</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {filteredRecords.length > 0 && (
                                        <tfoot className="sticky bottom-0 z-30 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                                            <tr className="bg-slate-50 border-t-2 border-slate-300 text-[11px] font-black text-slate-700">
                                                <td colSpan={5} className="px-4 py-3 text-left bg-slate-100 border-r border-slate-200 uppercase tracking-wider">TỔNG CỘNG</td>
                                                <td className="px-2 py-3 text-center border-r border-slate-200 text-rose-600">{totals.totalOrders}</td>
                                                <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 font-black text-rose-600 bg-rose-50/50">{formatCurrency(totals.grossRevenue)}</td>
                                                <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 font-black text-emerald-600 bg-emerald-50/50">{formatCurrency(totals.totalRevenue)}</td>
                                                {!isManager && <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 text-indigo-600">{formatCurrency(totals.commission)}</td>}
                                                {!isManager && <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 text-amber-600">{formatCurrency(totals.hotBonus)}</td>}
                                                {!isManager && <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 text-blue-600">{formatCurrency(totals.shippingFee)}</td>}
                                                <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 text-slate-500">{formatCurrency(totals.lowPriceValue)}</td>
                                                <td className="px-2 py-3 border-r border-slate-200 bg-slate-100/30"></td>
                                                {!isManager && <td className="px-2 py-3 border-r border-slate-200 bg-slate-100/30"></td>}
                                                {!isManager && <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 text-slate-700">{formatCurrency(totals.baseSalary)}</td>}
                                                {!isManager && <td className="px-2 py-3 text-right whitespace-nowrap border-r border-slate-200 text-emerald-700 bg-emerald-50/30">{formatCurrency(totals.netIncome)}</td>}
                                                {!isManager && <td className="px-2 py-3 bg-slate-100/30"></td>}
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )
                })()}

                {/* Policy Legend - Only visible for non-managers */}
                {!isManager && (
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
                )}
            </div>

            {/* Modal Detail Orders for Employee */}
            {selectedEmployeeForOrders && (
                <EmployeeOrdersModal
                    employee={selectedEmployeeForOrders}
                    month={month}
                    year={year}
                    onClose={() => setSelectedEmployeeForOrders(null)}
                />
            )}
        </div>
    );
}
