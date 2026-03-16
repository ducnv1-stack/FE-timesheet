"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Đăng nhập thất bại. Kiểm tra lại tài khoản');
            }

            const data = await res.json();

            // Save to local storage
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-5rem)] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="pt-10 pb-6 px-8 text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/logo.png" alt="Superb AI Logo" className="h-28 w-auto object-contain drop-shadow-sm" />
                    </div>
                    {/* <p className="text-slate-500 text-base font-medium">HỆ THỐNG QUẢN LÝ - TÍNH LƯƠNG</p> */}
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tên đăng nhập</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-primary-light focus:ring-2 focus:ring-primary-subtle font-medium text-slate-800 transition-all outline-none"
                                placeholder="Nhập username (vd: sale01)"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-primary-light focus:ring-2 focus:ring-primary-subtle font-medium text-slate-800 transition-all outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-subtle active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}
                        </button>

                        <div className="text-center text-xs text-slate-400 mt-6">
                            © 2026 Superb AI GROUP. All rights reserved.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
