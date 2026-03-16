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
    ChevronDown,
    ShoppingBag,
    ShoppingCart,
    ScrollText,
    Users,
    Building2,
    Menu,
    X,
    Truck,
    Trophy,
    Fingerprint,
    ClipboardList,
    Activity,
    BarChart3,
    LayoutGrid,
    Warehouse
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
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
    }, []);

    // Auto open parent menu if child is active
    useEffect(() => {
        const activeGroup = navItems.find(item =>
            item.children?.some(child => child.active)
        );
        if (activeGroup && !openMenus.includes(activeGroup.label)) {
            setOpenMenus(prev => [...prev, activeGroup.label]);
        }
    }, [pathname]);

    const toggleMenu = (label: string) => {
        if (isCollapsed) {
            onToggle();
            setOpenMenus([label]);
            return;
        }
        setOpenMenus(prev =>
            prev.includes(label)
                ? prev.filter(i => i !== label)
                : [...prev, label]
        );
    };

    if (isLoginPage) return null;

    const navItems = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard'
        },
        {
            label: 'Kinh doanh',
            icon: ShoppingBag,
            children: [
                {
                    label: 'Tạo đơn mới',
                    icon: PlusCircle,
                    href: '/orders/new',
                    active: pathname === '/orders/new',
                    roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE', 'ADMIN']
                },
                {
                    label: 'Nâng cấp sản phẩm',
                    icon: ShoppingCart,
                    href: '/orders/upgrade',
                    active: pathname === '/orders/upgrade',
                    roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE', 'ADMIN']
                },
                {
                    label: 'Lịch sử đơn',
                    icon: History,
                    href: '/orders',
                    active: pathname === '/orders',
                    roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'SALE', 'DRIVER', 'ADMIN', 'TECHNICIAN', 'WAREHOUSE']
                },
                {
                    label: 'Báo cáo doanh số',
                    icon: BarChart3,
                    href: '/performance',
                    active: pathname === '/performance',
                    roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MANAGER', 'ADMIN']
                },
            ]
        },
        {
            label: 'Quản lý Kho',
            icon: Warehouse,
            children: [
                {
                    label: 'Tồn kho chi tiết',
                    icon: LayoutGrid,
                    href: '/warehouse/inventory',
                    active: pathname === '/warehouse/inventory',
                    roleAccess: ['ADMIN', 'WAREHOUSE', 'DIRECTOR', 'MANAGER']
                },
                {
                    label: 'Lịch sử giao dịch',
                    icon: History,
                    href: '/warehouse/transactions',
                    active: pathname === '/warehouse/transactions',
                    roleAccess: ['ADMIN', 'WAREHOUSE', 'DIRECTOR', 'MANAGER']
                },
            ]
        },
        {
            label: 'Nhân sự',
            icon: Users,
            children: [
                {
                    label: 'Quản lý nhân viên',
                    icon: Users,
                    href: '/employees',
                    active: pathname.startsWith('/employees') && !pathname.includes('/attendance') && !pathname.includes('/timesheet'),
                    roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'HR', 'ADMIN']
                },
                {
                    label: 'Chấm công',
                    icon: Fingerprint,
                    href: '/employees/attendance',
                    active: pathname === '/employees/attendance',
                    roleAccess: ['ADMIN', 'TECHNICIAN', 'WAREHOUSE', 'SALE', 'DRIVER', 'MANAGER', 'DIRECTOR']
                },
                {
                    label: 'Bảng công tháng',
                    icon: ClipboardList,
                    href: '/employees/timesheet',
                    active: pathname === '/employees/timesheet',
                    roleAccess: ['ADMIN', 'TECHNICIAN', 'WAREHOUSE', 'SALE', 'DRIVER', 'MANAGER', 'DIRECTOR']
                },
                {
                    label: 'Cấu hình chấm công',
                    icon: Settings,
                    href: '/settings/attendance',
                    active: pathname === '/settings/attendance',
                    roleAccess: ['ADMIN']//, 'HR', 'DIRECTOR'
                },
            ]
        },
        {
            label: 'Hệ thống',
            icon: LayoutGrid,
            children: [
                {
                    label: 'Quản lý sản phẩm',
                    icon: ShoppingBag,
                    href: '/products',
                    active: pathname === '/products',
                    roleAccess: ['ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT']
                },
                {
                    label: 'Quản lý chi nhánh',
                    icon: Building2,
                    href: '/branches',
                    active: pathname === '/branches',
                    roleAccess: ['ADMIN'] //, 'MANAGER', 'DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'HR',
                },
                {
                    label: 'Cấu hình phí ship',
                    icon: Truck,
                    href: '/settings/delivery-fees',
                    active: pathname === '/settings/delivery-fees',
                    roleAccess: ['ADMIN']
                },
            ]
        },
        {
            label: 'Bảng xếp hạng',
            icon: Trophy,
            href: '/leaderboard',
            active: pathname === '/leaderboard',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'MANAGER', 'ADMIN', 'TELESALE']
        },
        {
            label: 'Log hệ thống',
            icon: Activity,
            href: '/logs',
            active: pathname === '/logs',
            roleAccess: ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'DRIVER', 'SALE', 'ADMIN']
        },
        {
            label: 'Cài đặt',
            icon: Settings,
            href: '/profile',
            active: pathname === '/profile',
        }
    ];

    // Filter menu items based on role access
    const checkAccess = (item: any) => {
        if (!item.roleAccess) return true;
        if (!currentUser?.role?.code) return false;
        if (currentUser.role.code === 'ADMIN') return true;
        return item.roleAccess.includes(currentUser.role.code);
    };

    const visibleNavItems = navItems.filter((item: any) => {
        if (item.children) {
            item.visibleChildren = item.children.filter(checkAccess);
            return item.visibleChildren.length > 0;
        }
        return checkAccess(item);
    });

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 h-full z-[150] bg-white border-r border-border-system transition-all duration-300 no-print",
                "lg:translate-x-0", // Always show on desktop
                isCollapsed ? "-translate-x-full lg:w-20 lg:translate-x-0" : "translate-x-0 w-64 shadow-2xl lg:shadow-none"
            )}
        >
            {/* Header Section: Menu Button instead of Logo on Mobile/Collapsed */}
            <div className="h-16 flex items-center px-4 border-b border-slate-50 justify-between gap-2 overflow-hidden">
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-primary focus:outline-none cursor-pointer"
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
            <div className="py-6 px-3 space-y-2 overflow-y-auto h-[calc(100%-120px)] scrollbar-hide">
                {visibleNavItems.map((item: any) => {
                    const hasChildren = item.visibleChildren && item.visibleChildren.length > 0;
                    const isOpen = openMenus.includes(item.label);
                    const isAnyChildActive = hasChildren && item.visibleChildren.some((child: any) => child.active);

                    if (hasChildren) {
                        return (
                            <div key={item.label} className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(item.label)}
                                    className={cn(
                                        "group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                                        isAnyChildActive ? "text-primary bg-primary-light" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon size={20} className={cn(
                                        "shrink-0",
                                        isAnyChildActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                                    )} />
                                    {!isCollapsed && (
                                        <>
                                            <span className="font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">
                                                {item.label}
                                            </span>
                                            <ChevronDown
                                                size={16}
                                                className={cn(
                                                    "transition-transform duration-200",
                                                    isOpen ? "rotate-180" : ""
                                                )}
                                            />
                                        </>
                                    )}
                                </button>

                                {isOpen && !isCollapsed && (
                                    <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {item.visibleChildren.map((child: any) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={cn(
                                                    "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                                                    child.active
                                                        ? "text-primary font-bold"
                                                        : "text-slate-400 hover:text-slate-700"
                                                )}
                                            >
                                                <child.icon size={16} className={cn(
                                                    "shrink-0",
                                                    child.active ? "text-primary" : "group-hover:text-slate-600"
                                                )} />
                                                <span className="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {child.label}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                                item.active
                                    ? "bg-primary-light text-primary shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "shrink-0",
                                item.active ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            {!isCollapsed && (
                                <span className="font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.label}
                                </span>
                            )}
                            {item.active && !isCollapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 w-full p-3 border-t border-slate-50 bg-white">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:bg-primary-light hover:text-primary transition-all cursor-pointer",
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
