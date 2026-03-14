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

export const formatNumber = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
};

export const parseNumber = (val: string) => {
    if (!val) return 0;
    const cleanValue = val.replace(/\D/g, '');
    return cleanValue === '' ? 0 : Number(cleanValue);
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
