export interface ProductBonusRule {
    id: string;
    productId: string;
    minSellPrice: number;
    bonusAmount: number;
    salePercent: number;
    managerPercent: number;
}

export interface Product {
    id: string;
    name: string;
    minPrice: number;
    isHighEnd: boolean;
    bonusRules?: ProductBonusRule[];
}

export interface Employee {
    id: string;
    fullName: string;
    branchId: string;
    department?: string;
    role?: string;
    position?: string;
    isInternalDriver?: boolean;
}

export interface Branch {
    id: string;
    name: string;
    code: string;
    address?: string;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    // Local UI helpers
    name?: string;
    totalPrice?: number;
}

export interface OrderSplit {
    employeeId: string;
    branchId: string;
    splitPercent: number;
    splitAmount: number;
}

export interface OrderPayment {
    paymentMethod: string;
    amount: number;
    paidAt: string;
}

export interface FullOrder {
    branchId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerCardNumber?: string;
    customerCardIssueDate?: string;
    staffCode?: string;
    driverId?: string;
    driverType?: 'internal' | 'sale';
    orderDate: string;
    orderSource: string;
    note?: string;
    giftAmount: number;
    items: OrderItem[];
    splits: OrderSplit[];
    payments: OrderPayment[];
}
