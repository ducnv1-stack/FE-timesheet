"use client";

import OrderForm from '@/components/orders/OrderForm';

export default function NewOrderPage() {
    return (
        <OrderForm 
            initialIsUpgrade={false} 
            title="Hóa đơn bán hàng" 
        />
    );
}
