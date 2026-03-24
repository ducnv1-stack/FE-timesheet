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
    disabled = false
}) => {
    return (
        <div className={cn("relative group flex items-center", className)}>
            <input
                type="date"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    "w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-primary-light outline-none transition-all font-bold text-slate-900 text-xs",
                    "date-input-icon-fix pr-10",
                    disabled && "opacity-60 cursor-not-allowed bg-slate-100"
                )}
            />
            <div className="absolute right-3 pointer-events-none text-slate-400 group-focus-within:text-primary-light transition-colors">
                <Calendar size={14} />
            </div>
        </div>
    );
};

export default FixedDatePicker;
