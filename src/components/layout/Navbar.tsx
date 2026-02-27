"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/login';
    const isDashboard = pathname === '/dashboard';
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (isLoginPage) return null;

    return (
        <nav className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/50 no-print">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Left side: Module Title or Page Name */}
                <div className="flex items-center gap-3">
                    {!isDashboard && (
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        {pathname === '/dashboard' ? 'Báo cáo tổng quan' : pathname === '/orders/new' ? 'Tạo đơn hàng mới' : 'Hệ thống Ohari'}
                    </h2>
                </div>

                {/* Right side: User info */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-900 leading-tight">{user.employee?.fullName || user.username}</span>
                                <span className="text-[8px] text-slate-500 uppercase font-medium">
                                    {typeof user.role === 'object' ? user.role.name : user.role}
                                </span>
                            </div>
                            <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                                {(user.employee?.fullName || user.username).substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
