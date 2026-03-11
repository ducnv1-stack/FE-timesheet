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

export interface Gift {
    id: string;
    name: string;
    price: number;
}

export interface Employee {
    id: string;
    fullName: string;
    branchId: string;
    department?: string;
    role?: string;
    position?: string;
    isInternalDriver?: boolean;
    employeeCode?: string;
    status?: string;
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
    files?: File[];
    existingImages?: string[];
}

export interface OrderGift {
    giftId: string;
    quantity: number;
    // Local UI helpers
    name?: string;
    price?: number;
    gift?: {
        name: string;
        price: number;
    };
}

export interface Delivery {
    id?: string;
    driverId?: string | null;
    role?: 'DRIVER' | 'STAFF';
    category: 'COMPANY_DRIVER' | 'EXTERNAL_DRIVER' | 'STAFF_DELIVERER' | 'SELLING_SALE' | 'OTHER_SALE';
    deliveryFee?: number;
    employee?: Employee;
    driver?: Employee;
}

export interface Province {
    id: string;
    name: string;
}

export interface Ward {
    id: string;
    name: string;
    provinceId: string;
}

export interface FullOrder {
    branchId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    provinceId?: string;
    wardId?: string;
    province?: Province;
    ward?: Ward;
    customerCardNumber?: string;
    customerCardIssueDate?: string;
    staffCode?: string;
    deliveries?: Delivery[];
    orderDate: string;
    orderSource: string;
    note?: string;
    giftAmount: number;
    gifts: OrderGift[];
    items: OrderItem[];
    splits: OrderSplit[];
    payments: OrderPayment[];
    isPaymentConfirmed?: boolean;
    confirmedAt?: string;
    confirmer?: {
        fullName: string;
        employee?: Employee;
    };
    isInvoiceIssued?: boolean;
    invoiceIssuedAt?: string;
    invoiceIssuer?: {
        fullName: string;
        employee?: Employee;
    };
    images?: string[];
    isUpgrade?: boolean;
    oldOrderProductName?: string;
    oldOrderAmount?: number;
    oldOrderDate?: string;
    oldOrderCustomerName?: string;
    oldOrderCustomerPhone?: string;
    oldOrderCustomerAddress?: string;
    oldOrderProvinceId?: string;
    oldOrderWardId?: string;
    oldOrderCustomerCardNumber?: string;
    oldOrderCustomerCardIssueDate?: string;
    oldOrderId?: string;
    oldOrderCode?: string;
}
