import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/order';

type StaffTab = 'staff' | 'deliverer';

interface EmployeeSearchSelectorProps {
    employees: Employee[];
    selectedId: string;
    onSelect: (employeeId: string, tab: StaffTab) => void;
    placeholder?: string;
    staffCode?: string;
    showFee?: boolean;
    triggerClassName?: string;
}

export default function EmployeeSearchSelector({
    employees,
    selectedId,
    onSelect,
    placeholder = "Tìm nhân viên...",
    staffCode,
    showFee = false,
    triggerClassName
}: EmployeeSearchSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<StaffTab>('staff');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedEmployee = employees.find(e => e.id === selectedId);

    // Determine which tab the selected employee belongs to
    useEffect(() => {
        if (selectedEmployee) {
            if (selectedEmployee.position === 'NVGH') {
                setActiveTab('deliverer');
            } else {
                setActiveTab('staff');
            }
        }
    }, [selectedEmployee]);

    // Filter employees by active tab and status
    const tabFilteredEmployees = employees.filter(emp => {
        if (emp.status === 'Nghỉ việc') return false;

        if (activeTab === 'deliverer') {
            return emp.position === 'NVGH';
        } else {
            // Staff tab: show sale/NVBH employees and all non-driver, non-NVGH employees
            return emp.position !== 'NVGH' && emp.department !== 'Lái xe' && emp.position !== 'driver' && emp.position !== 'Driver' && !emp.isInternalDriver;
        }
    });

    const filteredEmployees = tabFilteredEmployees.filter(emp =>
        emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getFeeLabel = (emp: Employee) => {
        // NVGH employees always get 70k
        if (emp.position === 'NVGH') return "(+70k)";
        // Selling staff (the one creating the order) gets 100k
        if (emp.id === staffCode) return "(+100k)";
        // Other sale/NVBH employees get 200k
        if (emp.position === 'sale' || emp.position === 'NVBH' || emp.department === 'Phòng KD') return "(+200k)";
        // Default for other staff
        return "(+70k)";
    };


    return (
        <div className={cn("relative w-full", isOpen && "z-[50]")} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full font-medium transition-all cursor-pointer group",
                    !triggerClassName && "bg-transparent border-none focus:ring-0 p-0 text-slate-900 text-[11px]",
                    triggerClassName,
                    isOpen && "z-[60]"
                )}
            >
                <div className="flex items-center gap-1.5 truncate">
                    {selectedEmployee ? (
                        <>
                            <span className="truncate">{selectedEmployee.fullName}</span>
                            {showFee && <span className="text-rose-600 font-bold shrink-0">{getFeeLabel(selectedEmployee)}</span>}
                        </>
                    ) : (
                        <span className="text-slate-400">-- Không --</span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {selectedId && (
                        <X
                            size={12}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect('', activeTab);
                                setSearch('');
                            }}
                        />
                    )}
                    <ChevronDown size={12} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[240px]">
                    {/* Tabs */}
                    <div className="flex border-b-2 border-slate-800 bg-slate-50">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveTab('staff'); setSearch(''); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                activeTab === 'staff'
                                    ? "bg-white text-rose-700 border-b-2 border-rose-600 -mb-[2px]"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <User size={12} />
                            Nhân viên
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveTab('deliverer'); setSearch(''); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                activeTab === 'deliverer'
                                    ? "bg-white text-amber-700 border-b-2 border-amber-600 -mb-[2px]"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <Package size={12} />
                            NV Giao hàng
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={activeTab === 'deliverer' ? "Tìm NV giao hàng..." : placeholder}
                            className="w-full bg-transparent border-none text-[11px] font-bold text-slate-700 placeholder:font-normal focus:ring-0 p-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Employee List */}
                    <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                        <div
                            onClick={() => {
                                onSelect('', activeTab);
                                setIsOpen(false);
                                setSearch('');
                            }}
                            className="px-3 py-2 text-[11px] hover:bg-slate-50 flex items-center justify-between cursor-pointer text-slate-400 italic"
                        >
                            -- Không --
                            {!selectedId && <Check size={12} className="text-emerald-500" />}
                        </div>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => {
                                        onSelect(emp.id, activeTab);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={cn(
                                        "px-3 py-2 text-[11px] hover:bg-rose-50 flex items-center justify-between cursor-pointer transition-colors group",
                                        selectedId === emp.id ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-700"
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="truncate">{emp.fullName}</span>
                                        <span className="text-[9px] text-slate-400 font-normal">
                                            {[emp.employeeCode, emp.position].filter(Boolean).join(' - ') || 'Nhân viên'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {showFee && (
                                            <span className={cn(
                                                "text-[10px] font-black italic",
                                                selectedId === emp.id ? "text-rose-600" : "text-slate-400 group-hover:text-rose-500 transition-colors"
                                            )}>
                                                {getFeeLabel(emp)}
                                            </span>
                                        )}
                                        {selectedId === emp.id && <Check size={12} className="text-rose-600" />}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-[10px] text-slate-400">
                                    {activeTab === 'deliverer'
                                        ? "Không tìm thấy NV giao hàng (NVGH)"
                                        : "Không tìm thấy nhân viên"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
