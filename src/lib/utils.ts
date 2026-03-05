import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
