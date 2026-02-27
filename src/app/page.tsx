"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center animate-pulse">
        <h2 className="text-2xl font-bold text-slate-400">Đang chuyển hướng tới Nhập Bill...</h2>
      </div>
    </div>
  );
}
