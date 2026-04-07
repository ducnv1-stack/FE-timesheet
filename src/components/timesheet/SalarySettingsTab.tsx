import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { Save, RefreshCw, Search, User, BanknoteIcon, CheckCircle2, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SalarySettingsTab() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { error: toastError } = useToast();
    
    const [empEdits, setEmpEdits] = useState<Record<string, any>>({});
    const [bulkEdits, setBulkEdits] = useState<any>({
        customBaseSalary: '',
        customDiligentSalary: '',
        customLunchAllowance: '',
        customLunchAllowanceType: 'DAILY',
        customTravelAllowance: '',
        customTechnicalAllowance: '',
        customAllowance: '',
        customStandardWorkingDays: ''
    });
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // --- Currency Helpers ---
    const formatCurrency = (val: number | string | null | undefined) => {
        if (val === null || val === undefined || val === '') return '';
        const num = typeof val === 'string' ? parseInt(val.replace(/\./g, '')) : val;
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('vi-VN').format(num).replace(/,/g, '.');
    };

    const parseCurrency = (val: string) => {
        if (!val) return '';
        const clean = val.replace(/\D/g, '');
        return clean ? parseInt(clean) : '';
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const empsRes = await fetch(`${API_URL}/employees`);
            const empsData = await empsRes.json();
            
            const empsList = Array.isArray(empsData) ? empsData : (empsData?.data || []);
            
            setEmployees(empsList.filter((e: any) => e.status !== 'QUITTING'));
            
            const eEdits: any = {};
            empsList.forEach((e: any) => {
                eEdits[e.id] = { 
                    customBaseSalary: e.customBaseSalary ?? '', 
                    customDiligentSalary: e.customDiligentSalary ?? '',
                    customLunchAllowance: e.customLunchAllowance ?? '',
                    customLunchAllowanceType: e.customLunchAllowanceType ?? 'DAILY',
                    customTravelAllowance: e.customTravelAllowance ?? '',
                    customTechnicalAllowance: e.customTechnicalAllowance ?? '',
                    customAllowance: e.customAllowance ?? '',
                    customStandardWorkingDays: e.customStandardWorkingDays ?? '' 
                };
            });
            setEmpEdits(eEdits);
            
        } catch (error) {
            toastError("Lỗi khi tải dữ liệu lương");
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(e => {
            const matchesSearch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.position?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [employees, searchTerm]);

    const handleEmpChange = (id: string, field: string, value: any) => {
        let finalValue: any = value;
        if (['customBaseSalary', 'customDiligentSalary', 'customAllowance', 'customLunchAllowance', 'customTravelAllowance', 'customTechnicalAllowance'].includes(field)) {
            finalValue = parseCurrency(value);
        }
        setEmpEdits(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: finalValue }
        }));
    };

    const toggleLunchType = (id: string) => {
        const currentType = empEdits[id]?.customLunchAllowanceType || 'DAILY';
        const nextType = currentType === 'DAILY' ? 'MONTHLY' : 'DAILY';
        handleEmpChange(id, 'customLunchAllowanceType', nextType);
    };

    const saveEmployee = async (empId: string, silent = false) => {
        if (!silent) setSavingId(empId);
        try {
            const edit = empEdits[empId];
            const payload: any = {};
            
            payload.customBaseSalary = edit.customBaseSalary === '' ? null : Number(edit.customBaseSalary);
            payload.customDiligentSalary = edit.customDiligentSalary === '' ? null : Number(edit.customDiligentSalary);
            payload.customLunchAllowance = edit.customLunchAllowance === '' ? null : Number(edit.customLunchAllowance);
            payload.customLunchAllowanceType = edit.customLunchAllowanceType;
            payload.customTravelAllowance = edit.customTravelAllowance === '' ? null : Number(edit.customTravelAllowance);
            payload.customTechnicalAllowance = edit.customTechnicalAllowance === '' ? null : Number(edit.customTechnicalAllowance);
            payload.customAllowance = edit.customAllowance === '' ? null : Number(edit.customAllowance);
            payload.customStandardWorkingDays = edit.customStandardWorkingDays === '' ? null : Number(edit.customStandardWorkingDays);

            const res = await fetch(`${API_URL}/employees/${empId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const eIcon = document.getElementById(`e-icon-${empId}`);
                if (eIcon) {
                    eIcon.style.opacity = '1';
                    setTimeout(() => { if (eIcon) eIcon.style.opacity = '0'; }, 2000);
                }
                return true;
            }
            return false;
        } catch (error) {
            if (!silent) toastError(`Lỗi khi lưu: ${empId}`);
            return false;
        } finally {
            if (!silent) setSavingId(null);
        }
    };

    const handleBulkChange = (field: string, value: any) => {
        let finalValue: any = value;
        if (['customBaseSalary', 'customDiligentSalary', 'customAllowance', 'customLunchAllowance', 'customTravelAllowance', 'customTechnicalAllowance'].includes(field)) {
            finalValue = parseCurrency(value);
        }
        setBulkEdits((prev: any) => ({ ...prev, [field]: finalValue }));
    };

    const applyBulkToAll = () => {
        const newEdits = { ...empEdits };
        filteredEmployees.forEach(e => {
            const currentEdit = { ...newEdits[e.id] };
            // Chỉ áp dụng các trường có giá trị trong bulkEdits
            Object.keys(bulkEdits).forEach(key => {
                const val = bulkEdits[key];
                if (val !== '' && val !== null) {
                    currentEdit[key] = val;
                }
            });
            newEdits[e.id] = currentEdit;
        });
        setEmpEdits(newEdits);
    };

    const saveAllEmployees = async () => {
        if (filteredEmployees.length === 0) return;
        setIsSavingAll(true);
        try {
            const promises = filteredEmployees.map(e => saveEmployee(e.id, true));
            await Promise.all(promises);
        } catch (error) {
            toastError("Có lỗi xảy ra khi lưu tất cả");
        } finally {
            setIsSavingAll(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                <p className="text-sm font-bold tracking-wider animate-pulse">Đang tải cấu hình lương...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Mức lương Cá nhân */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/60">
                <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">Cấu hình Lương Cá nhân</h2>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-1">Cài đặt lương cho từng nhân sự trong hệ thống</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Save All Button */}
                        <button 
                            onClick={saveAllEmployees}
                            disabled={isSavingAll || filteredEmployees.length === 0}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all shadow-md active:scale-95",
                                isSavingAll 
                                    ? "bg-slate-100 text-slate-400" 
                                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50"
                            )}
                        >
                            {isSavingAll ? <RefreshCw size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                            {isSavingAll ? "Đang lưu..." : "Lưu tất cả"}
                        </button>

                        {/* Search bar */}
                        <div className="relative group w-full md:w-60">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Tìm trong danh sách..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[11px] sm:text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Bulk Setup Panel */}
                <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <RefreshCw size={10} /> Thiết lập nhanh cho danh sách
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 ml-1">Lương cơ bản</label>
                                    <input 
                                        type="text" 
                                        placeholder="Tất cả..."
                                        value={formatCurrency(bulkEdits.customBaseSalary)}
                                        onChange={(e) => handleBulkChange('customBaseSalary', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-primary transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 ml-1">Chuyên cần</label>
                                    <input 
                                        type="text" 
                                        placeholder="Tất cả..."
                                        value={formatCurrency(bulkEdits.customDiligentSalary)}
                                        onChange={(e) => handleBulkChange('customDiligentSalary', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-warning transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 ml-1">Ăn trưa</label>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleBulkChange('customLunchAllowanceType', bulkEdits.customLunchAllowanceType === 'DAILY' ? 'MONTHLY' : 'DAILY')}
                                            className={cn(
                                                "px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all",
                                                bulkEdits.customLunchAllowanceType === 'DAILY' ? "bg-teal-500 text-white" : "bg-cyan-600 text-white"
                                            )}
                                        >
                                            {bulkEdits.customLunchAllowanceType === 'DAILY' ? 'N' : 'T'}
                                        </button>
                                        <input 
                                            type="text" 
                                            placeholder="Tất cả..."
                                            value={formatCurrency(bulkEdits.customLunchAllowance)}
                                            onChange={(e) => handleBulkChange('customLunchAllowance', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-teal-400 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 ml-1">Xăng xe</label>
                                    <input 
                                        type="text" 
                                        placeholder="Tất cả..."
                                        value={formatCurrency(bulkEdits.customTravelAllowance)}
                                        onChange={(e) => handleBulkChange('customTravelAllowance', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-blue-400 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 ml-1">Kỹ thuật</label>
                                    <input 
                                        type="text" 
                                        placeholder="Tất cả..."
                                        value={formatCurrency(bulkEdits.customTechnicalAllowance)}
                                        onChange={(e) => handleBulkChange('customTechnicalAllowance', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-emerald-400 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 ml-1">C.Chuẩn</label>
                                    <input 
                                        type="number" 
                                        placeholder="Công..."
                                        value={bulkEdits.customStandardWorkingDays}
                                        onChange={(e) => handleBulkChange('customStandardWorkingDays', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black outline-none focus:border-indigo-400 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={applyBulkToAll}
                                        className="w-full bg-primary text-white text-[10px] font-black uppercase py-2 rounded-lg hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                                    >
                                        <CloudUpload size={12} /> Áp dụng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border-t border-slate-50">
                    <table className="w-full text-left border-collapse min-w-[1250px]">
                        <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200">
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-100/80 z-20 shadow-sm border-r border-slate-200">Nhân sự</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[140px]">Lương Cơ Bản</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[120px]">Chuyên cần</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[170px] text-teal-600 bg-teal-50/20">Ăn trưa</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[120px]">Xăng xe</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[120px]">Kỹ thuật</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[120px]">PC Khác</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[80px]">C.Chuẩn</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[60px] text-center">Lưu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEmployees.map(e => {
                                const lType = empEdits[e.id]?.customLunchAllowanceType || 'DAILY';
                                return (
                                    <tr key={e.id} className="group transition-all duration-300 hover:bg-slate-50/50">
                                        <td className="px-4 py-1 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-100">
                                            <div className="flex items-center gap-2">
                                                {e.avatarUrl ? (
                                                    <img 
                                                        src={`${API_URL}${e.avatarUrl}`} 
                                                        alt={e.fullName}
                                                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                                                        onError={(ev) => {
                                                            (ev.target as HTMLImageElement).style.display = 'none';
                                                            (ev.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20",
                                                    e.avatarUrl ? "hidden" : ""
                                                )}>
                                                    {e.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-[11px] sm:text-xs tracking-tight truncate max-w-[120px]">{e.fullName}</div>
                                                    <div className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">{e.position || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(empEdits[e.id]?.customBaseSalary)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customBaseSalary', ev.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(empEdits[e.id]?.customDiligentSalary)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customDiligentSalary', ev.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-warning focus:ring-4 focus:ring-warning/10 transition-all shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-1 bg-teal-50/10">
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => toggleLunchType(e.id)}
                                                    className={cn(
                                                        "px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-sm whitespace-nowrap",
                                                        lType === 'DAILY' ? "bg-teal-500 text-white shadow-teal-100" : "bg-cyan-600 text-white shadow-cyan-100"
                                                    )}
                                                >
                                                    {lType === 'DAILY' ? 'Ngày' : 'Tháng'}
                                                </button>
                                                <input 
                                                    type="text" 
                                                    placeholder={lType === 'DAILY' ? "VD: 35.000" : "VD: 1.000.000"}
                                                    value={formatCurrency(empEdits[e.id]?.customLunchAllowance)}
                                                    onChange={(ev) => handleEmpChange(e.id, 'customLunchAllowance', ev.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(empEdits[e.id]?.customTravelAllowance)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customTravelAllowance', ev.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(empEdits[e.id]?.customTechnicalAllowance)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customTechnicalAllowance', ev.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(empEdits[e.id]?.customAllowance)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customAllowance', ev.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="number" 
                                                value={empEdits[e.id]?.customStandardWorkingDays || ''}
                                                onChange={(ev) => handleEmpChange(e.id, 'customStandardWorkingDays', ev.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-black text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-1 text-center relative">
                                            <button 
                                                onClick={() => saveEmployee(e.id)}
                                                disabled={savingId === e.id}
                                                className={cn(
                                                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer mx-auto",
                                                    savingId === e.id ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary border border-transparent hover:bg-primary hover:text-white shadow-md shadow-primary/5"
                                                )}
                                                title="Lưu cấu hình"
                                            >
                                                {savingId === e.id ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                            </button>

                                            <div id={`e-icon-${e.id}`} className="absolute top-1/2 left-0 -translate-y-1/2 opacity-0 transition-opacity text-emerald-500 pointer-events-none">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <BanknoteIcon size={40} className="mb-2 opacity-20" />
                                            <p className="text-sm font-bold tracking-wider">Không có nhân sự nào khớp với tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
