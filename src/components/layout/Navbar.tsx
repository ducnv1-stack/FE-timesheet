"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, ChevronLeft } from 'lucide-react';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === '/login';
    const isDashboard = pathname === '/dashboard';
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        };

        loadUser();
        window.addEventListener('user-avatar-updated', loadUser);

        return () => {
            window.removeEventListener('user-avatar-updated', loadUser);
        };
    }, []);

    if (isLoginPage) return null;

    return (
        <nav className="sticky top-0 z-[100] w-full backdrop-blur-md bg-white/70 border-b border-slate-200/50 no-print">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Left side: Menu Toggle (Mobile) and Module Title */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-primary focus:outline-none cursor-pointer"
                    >
                        <Menu size={22} strokeWidth={2.5} />
                    </button>
                    {!isDashboard && (
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h2 className="text-sm font-bold text-slate-800 tracking-wider">
                        {pathname === '/dashboard' ? 'Báo cáo tổng quan' : pathname === '/orders/new' ? 'Tạo đơn hàng mới' : 'Hệ thống Ohari'}
                    </h2>
                </div>

                {/* Right side: User info */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div
                            onClick={() => router.push('/profile')}
                            className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:bg-primary-light hover:border-primary/20 transition-all cursor-pointer group"
                            title="Xem hồ sơ cá nhân"
                        >
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{user.employee?.fullName || user.username}</span>
                                <span className="text-[8px] text-slate-500 font-medium">
                                    {typeof user.role === 'object' ? user.role.name : user.role}
                                </span>
                            </div>
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all overflow-hidden shrink-0">
                                {user.employee?.avatarUrl ? (
                                    <img src={user.employee.avatarUrl.startsWith('http') ? user.employee.avatarUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')}${user.employee.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    (user.employee?.fullName || user.username).substring(0, 2).toUpperCase()
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
