"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    PlusCircle,
    History,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    ScrollText,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
    }, []);

    if (isLoginPage) return null;

    const navItems = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard'
        },
        {
            label: 'Tạo đơn mới',
            icon: PlusCircle,
            href: '/orders/new',
            active: pathname === '/orders/new',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE']
        },
        {
            label: 'Lịch sử đơn',
            icon: History,
            href: '/orders',
            active: pathname === '/orders',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE', 'DRIVER']
        },
        {
            label: 'Báo cáo doanh số',
            icon: ScrollText,
            href: '/performance',
            active: pathname === '/performance',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT']
        },
        {
            label: 'Log hệ thống',
            icon: ScrollText,
            href: '/logs',
            active: pathname === '/logs',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'DRIVER', 'SALE']
        },
        {
            label: 'Quản lý nhân viên',
            icon: Users,
            href: '/employees',
            active: pathname.startsWith('/employees'),
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT']
        },
        {
            label: 'Quản lý sản phẩm',
            icon: ShoppingBag,
            href: '/products',
            active: pathname === '/products',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT']
        },
        {
            label: 'Cài đặt',
            icon: Settings,
            href: '/settings',
            active: pathname === '/settings',
            disabled: true
        }
    ];

    // Filter menu items based on role access
    const visibleNavItems = navItems.filter((item: any) => {
        if (!item.roleAccess) return true; // No restriction
        if (!currentUser?.role?.code) return false;
        return item.roleAccess.includes(currentUser.role.code);
    });

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 h-full z-40 bg-white border-r border-slate-200 transition-all duration-300 no-print",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-slate-50">
                {!isCollapsed ? (
                    <img src="/logo.png" alt="Ohari Logo" className="h-8 w-auto object-contain" />
                ) : (
                    <div className="w-full flex justify-center">
                        <img src="/favicon.png" alt="Logo" className="h-10 w-10 object-contain" />
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <div className="py-6 px-3 space-y-2 overflow-y-auto h-[calc(100%-120px)]">
                {visibleNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.disabled ? "#" : item.href}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                            item.active
                                ? "bg-rose-50 text-rose-700 shadow-sm"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                            item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={(e) => item.disabled && e.preventDefault()}
                    >
                        <item.icon size={20} className={cn(
                            "shrink-0",
                            item.active ? "text-rose-700" : "text-slate-400 group-hover:text-slate-600"
                        )} />
                        {!isCollapsed && (
                            <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                {item.label}
                            </span>
                        )}
                        {item.active && !isCollapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                    </Link>
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 w-full p-3 border-t border-slate-50 bg-white">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer",
                        isCollapsed ? "justify-center" : ""
                    )}
                >
                    <LogOut size={20} className="shrink-0" />
                    {!isCollapsed && <span className="font-medium text-sm">Đăng xuất</span>}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-[-30px] w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        </aside>
    );
}
