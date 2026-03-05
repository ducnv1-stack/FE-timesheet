import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/order';

interface EmployeeSearchSelectorProps {
    employees: Employee[];
    selectedId: string;
    onSelect: (employeeId: string) => void;
    placeholder?: string;
    staffCode?: string; // To calculate specific fee for the selling staff
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
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedEmployee = employees.find(e => e.id === selectedId);

    const filteredEmployees = employees.filter(emp =>
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
        if (emp.id === staffCode) return "(+100k)";
        if (emp.position === 'sale' || emp.position === 'NVBH' || emp.department === 'Phòng KD') return "(+200k)";
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
                                onSelect('');
                                setSearch('');
                            }}
                        />
                    )}
                    <ChevronDown size={12} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px]">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-transparent border-none text-[11px] font-bold text-slate-700 placeholder:font-normal focus:ring-0 p-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto py-1 custom-scrollbar">
                        <div
                            onClick={() => {
                                onSelect('');
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
                                        onSelect(emp.id);
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
                                        <span className="text-[9px] text-slate-400 font-normal">{[emp.employeeCode, emp.position].filter(Boolean).join(' - ') || 'Nhân viên'}</span>
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
                                <p className="text-[10px] text-slate-400">Không tìm thấy nhân viên</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
