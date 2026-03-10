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
    Users,
    Building2,
    Menu,
    X,
    Truck,
    Trophy
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
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE', 'ADMIN']
        },
        {
            label: 'Lịch sử đơn',
            icon: History,
            href: '/orders',
            active: pathname === '/orders',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE', 'DRIVER', 'ADMIN']
        },
        {
            label: 'Báo cáo doanh số',
            icon: ScrollText,
            href: '/performance',
            active: pathname === '/performance',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MANAGER', 'ADMIN']
        },
        {
            label: 'Bảng xếp hạng',
            icon: Trophy,
            href: '/leaderboard',
            active: pathname === '/leaderboard',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MANAGER', 'TELESALE', 'ADMIN']
        },
        {
            label: 'Log hệ thống',
            icon: ScrollText,
            href: '/logs',
            active: pathname === '/logs',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'DRIVER', 'SALE', 'ADMIN']
        },
        {
            label: 'Quản lý nhân viên',
            icon: Users,
            href: '/employees',
            active: pathname.startsWith('/employees') && !pathname.includes('/attendance') && !pathname.includes('/timesheet'),
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'HR', 'ADMIN']
        },
        {
            label: 'Chấm công',
            icon: LayoutDashboard,
            href: '/employees/attendance',
            active: pathname === '/employees/attendance',
            roleAccess: ['ADMIN'] //'DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 
        },
        {
            label: 'Bảng công tháng',
            icon: ScrollText,
            href: '/employees/timesheet',
            active: pathname === '/employees/timesheet',
            roleAccess: ['ADMIN'] //'DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 
        },
        {
            label: 'Quản lý sản phẩm',
            icon: ShoppingBag,
            href: '/products',
            active: pathname === '/products',
            roleAccess: ['ADMIN'] //'DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 
        },
        {
            label: 'Quản lý chi nhánh',
            icon: Building2,
            href: '/branches',
            active: pathname === '/branches',
            roleAccess: ['ADMIN'] //'DIRECTOR', 'MANAGER', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 
        },
        {
            label: 'Cấu hình phí ship',
            icon: Truck,
            href: '/settings/delivery-fees',
            active: pathname === '/settings/delivery-fees',
            roleAccess: ['ADMIN'] //'DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 
        },
        {
            label: 'Cài đặt',
            icon: Settings,
            href: '/profile',
            active: pathname === '/profile',
        }
    ];

    // Filter menu items based on role access
    const visibleNavItems = navItems.filter((item: any) => {
        if (!item.roleAccess) return true; // No restriction
        if (!currentUser?.role?.code) return false;
        if (currentUser.role.code === 'ADMIN') return true; // ADMIN có thể xem mọi thứ
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
                "lg:translate-x-0", // Always show on desktop
                isCollapsed ? "-translate-x-full lg:w-20 lg:translate-x-0" : "translate-x-0 w-64 shadow-2xl lg:shadow-none"
            )}
        >
            {/* Header Section: Menu Button instead of Logo on Mobile/Collapsed */}
            <div className="h-16 flex items-center px-4 border-b border-slate-50 justify-between gap-2 overflow-hidden">
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-rose-600 focus:outline-none cursor-pointer"
                    title={isCollapsed ? "Mở menu" : "Thu gọn"}
                >
                    {isCollapsed ? <Menu size={24} strokeWidth={2.5} /> : <X size={24} strokeWidth={2.5} />}
                </button>

                {!isCollapsed && (
                    <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-500">
                        <img src="/logo.png" alt="Ohari Logo" className="h-7 w-auto object-contain" />
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <div className="py-6 px-3 space-y-2 overflow-y-auto h-[calc(100%-120px)]">
                {visibleNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                            item.active
                                ? "bg-rose-50 text-rose-700 shadow-sm"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
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

                {/* Collapse Toggle (Desktop only) */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-[-30px] w-6 h-6 bg-white border border-slate-200 rounded-full hidden lg:flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        </aside>
    );
}
