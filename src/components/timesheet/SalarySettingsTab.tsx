import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { Save, AlertCircle, RefreshCw, Search, User, Building2, Banknote as BanknoteIcon, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfirmModal from '@/components/ui/confirm-modal';

export default function SalarySettingsTab() {
    const [roles, setRoles] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { error: toastError } = useToast();
    
    // Manage local edits before saving
    const [roleEdits, setRoleEdits] = useState<Record<string, any>>({});
    const [empEdits, setEmpEdits] = useState<Record<string, any>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddEmployeeList, setShowAddEmployeeList] = useState(false);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
            const [rolesRes, empsRes] = await Promise.all([
                fetch(`${API_URL}/roles`),
                fetch(`${API_URL}/employees`)
            ]);
            
            const rolesData = await rolesRes.json();
            const empsData = await empsRes.json();
            
            const empsList = Array.isArray(empsData) ? empsData : (empsData?.data || []);
            
            setRoles(rolesData);
            setEmployees(empsList.filter((e: any) => e.status !== 'QUITTING'));
            
            const rEdits: any = {};
            rolesData.forEach((r: any) => {
                rEdits[r.id] = { 
                    baseSalary: r.baseSalary || 0, 
                    diligentSalary: r.diligentSalary || 0,
                    allowance: r.allowance || 0,
                    standardWorkingDays: r.standardWorkingDays || 27 
                };
            });
            setRoleEdits(rEdits);
            
            const eEdits: any = {};
            empsList.forEach((e: any) => {
                eEdits[e.id] = { 
                    customBaseSalary: e.customBaseSalary ?? '', 
                    customDiligentSalary: e.customDiligentSalary ?? '',
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
            
            const hasException = empEdits[e.id] && (
                empEdits[e.id].customBaseSalary !== '' || 
                empEdits[e.id].customDiligentSalary !== '' ||
                empEdits[e.id].customAllowance !== '' ||
                empEdits[e.id].customStandardWorkingDays !== ''
            );

            return matchesSearch && hasException;
        });
    }, [employees, searchTerm, empEdits]);

    const availableEmployeesForException = useMemo(() => {
        return employees.filter(e => {
            const hasException = empEdits[e.id] && (
                empEdits[e.id].customBaseSalary !== '' || 
                empEdits[e.id].customDiligentSalary !== '' ||
                empEdits[e.id].customAllowance !== '' ||
                empEdits[e.id].customStandardWorkingDays !== ''
            );
            
            const matchesSearch = e.fullName.toLowerCase().includes(employeeSearchTerm.toLowerCase());

            return !hasException && matchesSearch;
        });
    }, [employees, empEdits, employeeSearchTerm]);

    const handleRoleChange = (id: string, field: string, value: string) => {
        let finalValue: any = value;
        if (['baseSalary', 'diligentSalary', 'allowance'].includes(field)) {
            finalValue = parseCurrency(value);
        }
        setRoleEdits(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: finalValue }
        }));
    };

    const handleEmpChange = (id: string, field: string, value: string) => {
        let finalValue: any = value;
        if (['customBaseSalary', 'customDiligentSalary', 'customAllowance'].includes(field)) {
            finalValue = parseCurrency(value);
        }
        setEmpEdits(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: finalValue }
        }));
    };

    const saveRole = async (roleId: string) => {
        setSavingId(roleId);
        try {
            const edit = roleEdits[roleId];
            const res = await fetch(`${API_URL}/roles/${roleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseSalary: Number(edit.baseSalary) || 0,
                    diligentSalary: Number(edit.diligentSalary) || 0,
                    allowance: Number(edit.allowance) || 0,
                    standardWorkingDays: Number(edit.standardWorkingDays) || 27,
                })
            });
            
            if (res.ok) {
                const rIcon = document.getElementById(`r-icon-${roleId}`);
                if (rIcon) {
                    rIcon.style.opacity = '1';
                    setTimeout(() => { rIcon.style.opacity = '0'; }, 2000);
                }
            }
        } catch (error) {
            toastError("Lỗi khi lưu lương Chức vụ");
        } finally {
            setSavingId(null);
        }
    };

    const saveEmployee = async (empId: string) => {
        setSavingId(empId);
        try {
            const edit = empEdits[empId];
            const payload: any = {};
            if (edit.customBaseSalary === '') payload.customBaseSalary = null;
            else payload.customBaseSalary = Number(edit.customBaseSalary) || 0;

            if (edit.customDiligentSalary === '') payload.customDiligentSalary = null;
            else payload.customDiligentSalary = Number(edit.customDiligentSalary) || 0;

            if (edit.customAllowance === '') payload.customAllowance = null;
            else payload.customAllowance = Number(edit.customAllowance) || 0;
            
            if (edit.customStandardWorkingDays === '') payload.customStandardWorkingDays = null;
            else payload.customStandardWorkingDays = Number(edit.customStandardWorkingDays) || 27;

            const res = await fetch(`${API_URL}/employees/${empId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const eIcon = document.getElementById(`e-icon-${empId}`);
                if (eIcon) {
                    eIcon.style.opacity = '1';
                    setTimeout(() => { eIcon.style.opacity = '0'; }, 2000);
                }
            }
        } catch (error) {
            toastError("Lỗi khi lưu lương Cá nhân");
        } finally {
            setSavingId(null);
        }
    };
    const removeException = async (empId: string) => {
        setSavingId(empId);
        try {
            const payload = {
                customBaseSalary: null,
                customDiligentSalary: null,
                customAllowance: null,
                customStandardWorkingDays: null
            };

            const res = await fetch(`${API_URL}/employees/${empId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Update local state to hide from exception list
                setEmpEdits(prev => ({
                    ...prev,
                    [empId]: {
                        customBaseSalary: '',
                        customDiligentSalary: '',
                        customAllowance: '',
                        customStandardWorkingDays: ''
                    }
                }));
                const eIcon = document.getElementById(`e-icon-${empId}`);
                if (eIcon) {
                    eIcon.style.opacity = '1';
                    setTimeout(() => { eIcon.style.opacity = '0'; }, 2000);
                }
            }
        } catch (error) {
            toastError("Lỗi khi xóa cấu hình ngoại lệ");
        } finally {
            setSavingId(null);
            setConfirmDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-rose-500 animate-spin" />
                <p className="text-sm font-black uppercase tracking-widest animate-pulse">Đang tải cấu hình lương...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Warning Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/60 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <AlertCircle size={80} className="text-amber-500" />
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                        <AlertCircle size={20} className="text-amber-600" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-amber-900 font-black uppercase text-xs tracking-wider">Lưu ý quan trọng về chính sách lương</h3>
                        <div className="text-[11px] text-amber-800/80 font-medium leading-relaxed max-w-3xl">
                            Các thiết lập này sẽ ảnh hưởng trực tiếp đến kết quả tính lương trong <span className="font-bold underline">Báo cáo Doanh số</span>. 
                            Hệ thống ưu tiên <span className="text-rose-600 font-bold">Mức lương Ngoại lệ</span> trước, nếu không có sẽ lấy theo <span className="font-bold">Mức lương Chức vụ</span>.
                            Mọi thay đổi sẽ được áp dụng ngay lập tức cho các chu kỳ lương chưa chốt.
                        </div>
                    </div>
                </div>
            </div>

            {/* Mức lương theo Chức Vụ */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/60">
                <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <BanknoteIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase leading-none">Mức lương theo Chức vụ</h2>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cấu hình lương gốc mặc định cho từng bộ phận</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200">
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider">Chức vụ/Hợp đồng</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[180px]">Lương Cơ Bản</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[130px]">Chuyên cần</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[130px]">Phụ cấp</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[100px]">Công chuẩn</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[80px] text-center">Lưu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {roles.map(r => (
                                <tr key={r.id} className="group hover:bg-rose-50/30 transition-all duration-300">
                                    <td className="px-4 py-1">
                                        <div>
                                            <div className="font-extrabold text-slate-800 text-[11px] sm:text-xs group-hover:text-rose-600 transition-colors uppercase tracking-tight leading-tight">{r.name}</div>
                                            <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold">{r.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-1">
                                        <div className="relative group/input">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(roleEdits[r.id]?.baseSalary)}
                                                onChange={(e) => handleRoleChange(r.id, 'baseSalary', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-rose-600 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-[9px] shadow-inner group-hover:bg-white"
                                                placeholder="Nhập..."
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-1">
                                        <div className="relative group/input">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(roleEdits[r.id]?.diligentSalary)}
                                                onChange={(e) => handleRoleChange(r.id, 'diligentSalary', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-amber-600 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all placeholder:text-[9px] shadow-inner group-hover:bg-white"
                                                placeholder="Nhập..."
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-1">
                                        <div className="relative group/input">
                                            <input 
                                                type="text" 
                                                value={formatCurrency(roleEdits[r.id]?.allowance)}
                                                onChange={(e) => handleRoleChange(r.id, 'allowance', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-emerald-600 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-[9px] shadow-inner group-hover:bg-white"
                                                placeholder="Nhập..."
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-1">
                                        <input 
                                            type="number" 
                                            value={roleEdits[r.id]?.standardWorkingDays || ''}
                                            onChange={(e) => handleRoleChange(r.id, 'standardWorkingDays', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all group-hover:bg-white shadow-inner"
                                            placeholder="27"
                                        />
                                    </td>
                                    <td className="px-4 sm:px-6 py-1 text-center relative">
                                        <button 
                                            onClick={() => saveRole(r.id)}
                                            disabled={savingId === r.id}
                                            className={cn(
                                                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer mx-auto",
                                                savingId === r.id ? "bg-slate-100 text-slate-400" : "bg-white text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-100 hover:-translate-y-0.5 active:translate-y-0"
                                            )}
                                        >
                                            {savingId === r.id ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                        </button>
                                        <div id={`r-icon-${r.id}`} className="absolute top-1/2 -right-2 -translate-y-1/2 opacity-0 transition-opacity text-emerald-500">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mức lương Ngoại lệ theo Cá nhân */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/60">
                <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase leading-none">Mức lương Ngoại lệ (Cá nhân)</h2>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cài đặt lương riêng biệt cho nhân sự cơ chế ngoại lệ</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search bar */}
                        <div className="relative group w-full md:w-60">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Tìm trong danh sách..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[11px] sm:text-xs font-bold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all shadow-sm"
                            />
                        </div>

                        {/* ADD BUTTON */}
                        <button 
                            onClick={() => setShowAddEmployeeList(true)}
                            className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                        >
                            + Thêm nhân sự ngoại lệ
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto border-t border-slate-50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200">
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider">Nhân sự</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[180px]">Lương Thỏa Thuận</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[130px]">Chuyên cần</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[130px]">Phụ cấp</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[100px]">Công chuẩn</th>
                                <th className="px-4 py-2 text-[10px] font-black text-slate-700 uppercase tracking-wider w-[80px] text-center">Lưu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredEmployees.map(e => {
                                return (
                                    <tr key={e.id} className="group transition-all duration-300 bg-rose-50/40 hover:bg-rose-50/60">
                                        <td className="px-4 py-1">
                                            <div className="flex items-center gap-2">
                                                {e.avatarUrl ? (
                                                    <img 
                                                        src={`${API_URL}${e.avatarUrl}`} 
                                                        alt={e.fullName}
                                                        className="w-6 h-6 rounded-md object-cover border border-rose-100 shadow-sm"
                                                        onError={(ev) => {
                                                            (ev.target as HTMLImageElement).style.display = 'none';
                                                            (ev.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={cn(
                                                    "w-6 h-6 rounded-md bg-rose-500 text-white flex items-center justify-center font-extrabold text-[8px] border border-rose-400 shadow-md shadow-rose-100",
                                                    e.avatarUrl ? "hidden" : ""
                                                )}>
                                                    {e.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-extrabold text-slate-800 text-[10px] sm:text-[11px] tracking-tight truncate max-w-[120px]">{e.fullName}</div>
                                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter truncate max-w-[120px]">{e.branch?.name || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-1">
                                            <div className="relative group/input">
                                                <input 
                                                    type="text" 
                                                    placeholder="Tự động..."
                                                    value={formatCurrency(empEdits[e.id]?.customBaseSalary)}
                                                    onChange={(ev) => handleEmpChange(e.id, 'customBaseSalary', ev.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-rose-600 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-[9px] shadow-inner group-hover:bg-white"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                placeholder="Tự động..."
                                                value={formatCurrency(empEdits[e.id]?.customDiligentSalary)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customDiligentSalary', ev.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-amber-600 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all placeholder:text-[9px] shadow-inner group-hover:bg-white"
                                            />
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="text" 
                                                placeholder="Tự động..."
                                                value={formatCurrency(empEdits[e.id]?.customAllowance)}
                                                onChange={(ev) => handleEmpChange(e.id, 'customAllowance', ev.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[11px] sm:text-xs font-extrabold text-emerald-600 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-[9px] shadow-inner group-hover:bg-white"
                                            />
                                        </td>
                                        <td className="px-4 py-1">
                                            <input 
                                                type="number" 
                                                placeholder="VD: 27"
                                                value={empEdits[e.id]?.customStandardWorkingDays || ''}
                                                onChange={(ev) => handleEmpChange(e.id, 'customStandardWorkingDays', ev.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[10px] sm:text-[11px] font-extrabold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all group-hover:bg-white shadow-inner"
                                            />
                                        </td>
                                        <td className="px-4 py-1 text-center relative flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => saveEmployee(e.id)}
                                                disabled={savingId === e.id}
                                                className={cn(
                                                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer",
                                                    savingId === e.id ? "bg-slate-100 text-slate-400" : "bg-white text-emerald-500 border border-emerald-100 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-0.5 active:translate-y-0"
                                                )}
                                                title="Lưu cấu hình"
                                            >
                                                {savingId === e.id ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                            </button>
                                            
                                            <button 
                                                onClick={() => setConfirmDeleteId(e.id)}
                                                disabled={savingId === e.id}
                                                className={cn(
                                                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer",
                                                    savingId === e.id ? "bg-slate-100 text-slate-400" : "bg-white text-rose-400 border border-rose-100 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-100 hover:-translate-y-0.5 active:translate-y-0"
                                                )}
                                                title="Xóa ngoại lệ"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div id={`e-icon-${e.id}`} className="absolute top-1/2 -right-2 -translate-y-1/2 opacity-0 transition-opacity text-emerald-500">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <BanknoteIcon size={40} className="mb-2 opacity-20" />
                                            <p className="text-sm font-black uppercase tracking-widest">Không có nhân sự ngoại lệ nào</p>
                                            <button 
                                                onClick={() => setShowAddEmployeeList(true)}
                                                className="text-[10px] font-black text-rose-500 underline uppercase tracking-tighter hover:text-rose-600 transition-colors"
                                            >
                                                Thêm nhân sự ngay
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal 
                isOpen={!!confirmDeleteId}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa cấu hình lương ngoại lệ này? Nhân viên sẽ quay lại áp dụng mức lương mặc định theo Chức vụ."
                confirmLabel="Xóa ngoại lệ"
                cancelLabel="Hủy"
                isDanger={true}
                onConfirm={() => confirmDeleteId && removeException(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />

            {/* SELECTION MODAL/DROPDOWN */}
            {showAddEmployeeList && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Chọn nhân sự thêm ngoại lệ</h3>
                            <button onClick={() => setShowAddEmployeeList(false)} className="text-slate-400 hover:text-rose-500 font-bold">✕</button>
                        </div>
                        <div className="p-4 bg-slate-50/50">
                            <div className="relative group">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Tìm tên nhân viên..."
                                    value={employeeSearchTerm}
                                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-rose-400 shadow-sm transition-all"
                                />
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                            {availableEmployeesForException.map(e => (
                                <button 
                                    key={e.id}
                                    onClick={() => {
                                        handleEmpChange(e.id, 'customBaseSalary', '0');
                                        setShowAddEmployeeList(false);
                                        setEmployeeSearchTerm('');
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-rose-50 rounded-2xl transition-all group border border-transparent hover:border-rose-100 mb-1 text-left"
                                >
                                        <div className="relative shrink-0">
                                            {e.avatarUrl ? (
                                                <img 
                                                    src={`${API_URL}${e.avatarUrl}`} 
                                                    alt={e.fullName}
                                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 group-hover:border-rose-200 shadow-sm transition-all"
                                                    onError={(ev) => {
                                                        (ev.target as HTMLImageElement).style.display = 'none';
                                                        (ev.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={cn(
                                                "w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black group-hover:bg-white group-hover:text-rose-500 transition-all border border-slate-200",
                                                e.avatarUrl ? "hidden" : ""
                                            )}>
                                                {e.fullName.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{e.fullName}</div>
                                        <div className="text-[9px] text-slate-400 font-bold group-hover:text-rose-400 uppercase tracking-tighter">{e.position} • {e.branch?.name}</div>
                                    </div>
                                </button>
                            ))}
                            {availableEmployeesForException.length === 0 && (
                                <div className="py-12 text-center text-slate-300 text-xs font-black uppercase tracking-widest">
                                    Không tìm thấy nhân viên phù hợp
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <button 
                                onClick={() => setShowAddEmployeeList(false)}
                                className="w-full py-3 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all border border-transparent hover:border-slate-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

