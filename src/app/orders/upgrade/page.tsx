"use client";

import OrderForm from '@/components/orders/OrderForm';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function UpgradeOrderContent() {
    const searchParams = useSearchParams();
    const upgradeFromId = searchParams.get('from') || undefined;

    return (
        <OrderForm 
            initialIsUpgrade={true} 
            title="Nâng cấp sản phẩm" 
            upgradeFromId={upgradeFromId}
        />
    );
}

export default function UpgradeOrderPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Đang tải form nâng cấp...</div>}>
            <UpgradeOrderContent />
        </Suspense>
    );
}
