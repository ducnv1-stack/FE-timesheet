import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
}

export const formatNumber = (val: number | null | undefined) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(val);
};

export const parseNumber = (val: string) => {
    return Number(val.replace(/\D/g, '')) || 0;
};

export const formatDate = (date: Date | string | number | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return format(d, 'dd/MM/yyyy');
};

export const formatDateTime = (date: Date | string | number | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return format(d, 'HH:mm dd/MM/yyyy');
};
