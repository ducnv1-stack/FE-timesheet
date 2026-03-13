"use client";

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface FixedDatePickerProps {
    value: string | null | undefined;
    onChange: (val: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

const FixedDatePicker: React.FC<FixedDatePickerProps> = ({
    value,
    onChange,
    className = "",
    placeholder = "Chọn ngày",
    disabled = false
}) => {
    const displayValue = value ? formatDate(value) : "";

    return (
        <div 
            className={cn(
                "relative group flex items-center justify-between bg-white border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-900 hover:border-rose-300 transition-all",
                disabled && "opacity-60 cursor-not-allowed",
                className
            )}
        >
            {/* Lớp hiển thị (UI layer) */}
            <span className={cn(
                "whitespace-nowrap overflow-hidden text-ellipsis flex-1 leading-relaxed",
                !displayValue ? "text-slate-400 font-normal" : "font-semibold"
            )}>
                {displayValue || placeholder}
            </span>
            <Calendar size={14} className="ml-2 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />

            {/* Input gốc (Logic layer - Nằm đè lên trên để nhận click trực tiếp) */}
            <input
                type="date"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    "absolute inset-0 opacity-0 w-full h-full appearance-none cursor-pointer z-10",
                    disabled && "cursor-not-allowed"
                )}
            />
        </div>
    );
};

export default FixedDatePicker;
