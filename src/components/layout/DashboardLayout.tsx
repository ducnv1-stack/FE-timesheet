"use client";

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { error: toastError } = useToast();
    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (isLoginPage) return;

        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                router.push('/login');
                return;
            }

            const user = JSON.parse(storedUser);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            try {
                const res = await fetch(`${apiUrl}/auth/status/${user.id}`);
                if (!res.ok) {
                    if (res.status === 401 || res.status === 404) {
                        localStorage.removeItem('user');
                        router.push('/login');
                    }
                    return;
                }

                const data = await res.json();
                if (!data.isActive) {
                    toastError('Tài khoản của bạn đã bị khóa. Đang đăng xuất...');
                    setTimeout(() => {
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }, 2000);
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
            }
        };

        checkAuth();

        // Optional: Periodic check or check on page visibility change
        const interval = setInterval(checkAuth, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [pathname, router, toastError, isLoginPage]);

    if (isLoginPage) {
        return (
            <div className="flex-1 w-full h-full">
                {children}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            <div className={cn(
                "flex-1 min-w-0 transition-all duration-300 min-h-screen flex flex-col print:ml-0",
                isCollapsed ? "ml-20" : "ml-64"
            )}>
                <Navbar />
                <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
