"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
    options: { label: string; value: string }[];
    value: string;
    onSelect: (value: string) => void;
    placeholder: string;
    icon?: React.ReactNode;
    className?: string;
    allOption?: { label: string; value: string };
}

export default function SearchableSelect({
    options,
    value,
    onSelect,
    placeholder,
    icon,
    className,
    allOption = { label: 'Tất cả', value: 'all' }
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value) || (value === allOption.value ? allOption : null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
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

    return (
        <div className={cn("relative h-8 w-full min-w-0", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full pl-8 pr-2 h-full py-0 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none flex items-center justify-between text-[11px] font-medium transition-colors group",
                    value !== allOption.value ? 'border-rose-300 font-bold bg-white' : 'border-slate-200'
                )}
            >
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {icon && React.isValidElement(icon) ? (
                        React.cloneElement(icon as React.ReactElement<any>, {
                            size: 14,
                            className: cn((icon as React.ReactElement<any>).props.className, value !== allOption.value ? 'text-rose-500' : 'text-slate-400')
                        })
                    ) : null}
                </div>
                <span className="truncate mr-2 flex-1 text-left min-w-0">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={12} className={cn("text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-[999] overflow-hidden min-w-[200px] w-max max-w-[300px]"
                    style={{ filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))' }}
                >
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search size={12} className="text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="w-full bg-transparent border-none text-[10.5px] font-bold text-slate-700 placeholder:font-normal focus:ring-0 p-0"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto py-1">
                        <div
                            onClick={() => {
                                onSelect(allOption.value);
                                setIsOpen(false);
                                setSearch('');
                            }}
                            className={cn(
                                "px-3 py-1.5 text-[10.5px] hover:bg-rose-50 flex items-center justify-between cursor-pointer transition-colors",
                                value === allOption.value ? "text-rose-700 font-bold bg-rose-50" : "text-slate-600"
                            )}
                        >
                            {allOption.label}
                            {value === allOption.value && <Check size={10} className="text-rose-600" />}
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onSelect(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 text-[10.5px] hover:bg-rose-50 flex items-center justify-between cursor-pointer transition-colors",
                                        value === opt.value ? "text-rose-700 font-bold bg-rose-50" : "text-slate-700"
                                    )}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {value === opt.value && <Check size={10} className="text-rose-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-[10.5px] text-slate-400 italic">
                                Không tìm thấy kết quả
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
