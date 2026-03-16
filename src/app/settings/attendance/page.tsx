'use client';

import { useState } from 'react';
import { 
    Fingerprint, Building2, BadgeCheck, Settings, 
    ChevronRight, Home, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DepartmentsTab from './components/DepartmentsTab';
import PositionsTab from './components/PositionsTab';
import AttendancePoliciesTab from './components/AttendancePoliciesTab';
import Link from 'next/link';

type TabType = 'departments' | 'positions' | 'policies';

export default function AttendanceSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('departments');

    const tabs = [
        {
            id: 'departments',
            label: 'Phòng ban',
            icon: Building2,
            description: 'Quản lý cơ cấu tổ chức',
            color: 'text-primary-light',
            bgColor: 'bg-primary-subtle'
        },
        {
            id: 'positions',
            label: 'Chức vụ',
            icon: BadgeCheck,
            description: 'Định nghĩa vị trí & quyền lợi',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50'
        },
        {
            id: 'policies',
            label: 'Chính sách',
            icon: Settings,
            description: 'Cấu hình giờ làm & GPS',
            color: 'text-accent-light',
            bgColor: 'bg-emerald-50'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-inter">
            <div className="max-w-7xl mx-auto space-y-6">
                

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-200">
                                <Fingerprint size={20} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Thiết lập <span className="text-primary">Chấm công</span>
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 font-medium max-w-xl pl-1">
                            Quản lý tập trung sơ đồ tổ chức, chức vụ và các chính sách làm việc linh hoạt áp dụng trực tiếp cho từng vị trí nhân sự.
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "flex-1 min-w-[170px] p-3 rounded-2xl border-2 transition-all duration-500 text-left group relative overflow-hidden cursor-pointer",
                                activeTab === tab.id 
                                    ? "bg-white border-slate-900 shadow-xl shadow-slate-200 -translate-y-1" 
                                    : "bg-white/40 border-slate-100 hover:border-slate-300 hover:bg-white"
                            )}
                        >
                            {/* Animated background on active */}
                            {activeTab === tab.id && (
                                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-slate-50 rounded-full -z-10 animate-pulse" />
                            )}
                            
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-lg transition-all duration-500 shrink-0",
                                    activeTab === tab.id ? "bg-slate-900 text-white" : cn(tab.bgColor, tab.color)
                                )}>
                                    <tab.icon size={18} />
                                </div>
                                <div className="space-y-0 min-w-0 flex-1">
                                    <span className={cn(
                                        "block text-[9px] font-bold tracking-wider",
                                        activeTab === tab.id ? "text-slate-400" : "text-slate-400"
                                    )}>
                                        Quản lý
                                    </span>
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight truncate">
                                        {tab.label}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1">
                                        {tab.description}
                                    </p>
                                </div>
                            </div>

                            {/* Active Indicator */}
                            {activeTab === tab.id && (
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-light animate-ping" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content Rendering */}
                <div className="bg-white rounded-3xl p-4 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden min-h-[500px]">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-bl-[10rem] -z-10" />
                    
                    <div className="relative">
                        {activeTab === 'departments' && <DepartmentsTab />}
                        {activeTab === 'positions' && <PositionsTab />}
                        {activeTab === 'policies' && <AttendancePoliciesTab />}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-center gap-4 py-4 text-[10px] font-bold text-slate-300 tracking-[0.1em]">
                    <LayoutGrid size={14} />
                    Superb AI System • Chính sách nhân sự
                </div>
            </div>
        </div>
    );
}
