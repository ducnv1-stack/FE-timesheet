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
    const inputRef = useRef<HTMLInputElement>(null);

    const displayValue = value ? formatDate(value) : "";

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return;
        
        const input = inputRef.current as any;
        if (input) {
            try {
                if ('showPicker' in input) {
                    input.showPicker();
                } else {
                    input.focus();
                    input.click();
                }
            } catch (err) {
                input.focus();
                input.click();
            }
        }
    };

    return (
        <div 
            className={cn(
                "relative group cursor-pointer flex items-center justify-between bg-white border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-900 hover:border-rose-300 transition-all",
                disabled && "opacity-60 cursor-not-allowed",
                className
            )}
            onClick={handleClick}
        >
            {/* Lớp hiển thị (UI layer) */}
            <span className={cn(
                "whitespace-nowrap overflow-hidden text-ellipsis flex-1 leading-relaxed",
                !displayValue ? "text-slate-400 font-normal" : "font-semibold"
            )}>
                {displayValue || placeholder}
            </span>
            <Calendar size={14} className="ml-2 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />

            {/* Input gốc (Logic layer - Ẩn nhưng vẫn nhận sự kiện) */}
            <input
                ref={inputRef}
                type="date"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="absolute inset-0 opacity-0 w-full h-full appearance-none pointer-events-none"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
    );
};

export default FixedDatePicker;
