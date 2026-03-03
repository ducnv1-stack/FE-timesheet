'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Employee {
    id: string;
    fullName: string;
    phone: string | null;
    position: string;
    department: string | null;
    status: string | null;
    branch: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        username: string;
        isActive: boolean;
        role: {
            name: string;
        };
    } | null;
}

interface Branch {
    id: string;
    name: string;
}

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const { error: toastError } = useToast();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [hasAccountFilter, setHasAccountFilter] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(user);

        // RBAC: Only allowed roles can access this page
        const roleCode = parsedUser.role?.code;
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'];

        if (!allowedRoles.includes(roleCode)) {
            router.push('/dashboard');
            return;
        }

        setCurrentUser(parsedUser);

        // Auto-set branch filter for MANAGER and branch-level ACCOUNTANT
        const userBranchId = parsedUser.employee?.branchId;

        if (roleCode === 'MANAGER' && userBranchId) {
            setSelectedBranch(userBranchId);
        }

        fetchBranches();
        // Don't call fetchEmployees here, let useEffect below handle it
    }, []);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_URL}/branches`);
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (selectedBranch) params.append('branchId', selectedBranch);
            if (selectedPosition) params.append('position', selectedPosition);
            if (selectedStatus) params.append('status', selectedStatus);
            if (hasAccountFilter) params.append('hasAccount', hasAccountFilter);

            // Pass current user info for permission control
            if (currentUser) {
                params.append('userId', currentUser.id);
                params.append('roleCode', currentUser.role?.code);
            }

            const res = await fetch(`${API_URL}/employees?${params.toString()}`);
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchEmployees();
        }
    }, [currentUser, selectedBranch, selectedPosition, selectedStatus, hasAccountFilter]);

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check permissions
    const userRole = currentUser?.role?.code;
    const isGlobal = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'].includes(userRole);
    const isBranch = ['MANAGER'].includes(userRole);

    const canCreate = isGlobal || isBranch;
    const canEdit = isGlobal || isBranch;
    const canDelete = isGlobal;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    <div className="flex items-center gap-1.5 mb-2 md:mb-0">
                        <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-lg">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900">Quản Lý Nhân Viên</h1>
                            <p className="text-slate-500 text-[10px]">Danh sách nhân viên và tài khoản</p>
                        </div>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => router.push('/employees/new')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm Nhân Viên
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-2.5 mb-3 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Filter className="w-3.5 h-3.5 text-slate-600" />
                        <h2 className="text-xs font-bold text-slate-900">Bộ Lọc</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                        {/* Search */}
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tên, SĐT..."
                                    className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Branch Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                                Chi Nhánh
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={currentUser?.role?.code === 'MANAGER'}
                                className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Tất cả</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            {currentUser?.role?.code === 'MANAGER' && (
                                <p className="text-[9px] text-slate-500 mt-0.5">Bạn chỉ có thể xem nhân viên chi nhánh của mình</p>
                            )}
                        </div>

                        {/* Position Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                                Chức Vụ
                            </label>
                            <select
                                value={selectedPosition}
                                onChange={(e) => setSelectedPosition(e.target.value)}
                                className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                                <option value="">Tất cả</option>
                                <option value="GĐ">Giám đốc (GĐ)</option>
                                <option value="GĐKD">Giám đốc kinh doanh (GĐKD)</option>
                                <option value="Trợ lý GĐ">Trợ lý Giám đốc</option>
                                <option value="Quản Lý">Quản Lý</option>
                                <option value="NVBH">Nhân viên bán hàng (NVBH)</option>
                                <option value="Kế toán">Kế toán</option>
                                <option value="Media">Media</option>
                                <option value="ADS">ADS</option>
                                <option value="HCNS">Hành chính nhân sự (HCNS)</option>
                                <option value="NVKT">Nhân viên kỹ thuật (NVKT)</option>
                                <option value="Driver">Lái xe (Driver)</option>
                                <option value="Nhân viên">Nhân viên (Khác)</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                                Trạng Thái
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                                <option value="">Tất cả</option>
                                <option value="Đang làm việc">Đang làm việc</option>
                                <option value="Nghỉ việc">Nghỉ việc</option>
                            </select>
                        </div>

                        {/* Has Account Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                                Tài Khoản
                            </label>
                            <select
                                value={hasAccountFilter}
                                onChange={(e) => setHasAccountFilter(e.target.value)}
                                className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Có tài khoản</option>
                                <option value="false">Chưa có</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-4 text-slate-600">Đang tải...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                                    <tr>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">Tên Nhân Viên</th>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">SĐT</th>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">Chi Nhánh</th>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">Phòng Ban</th>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">Chức Vụ</th>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">Trạng Thái</th>
                                        <th className="px-2 py-1.5 text-left font-bold text-[9px] uppercase tracking-wider">Tài Khoản</th>
                                        <th className="px-2 py-1.5 text-center font-bold text-[9px] uppercase tracking-wider">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-6 text-center text-slate-500 italic text-[11px]">
                                                Không tìm thấy nhân viên nào
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-2 py-1.5 font-semibold text-slate-900 text-[11px]">{emp.fullName}</td>
                                                <td className="px-2 py-1.5 text-slate-600 text-[11px]">{emp.phone || '-'}</td>
                                                <td className="px-2 py-1.5 text-slate-600 font-medium text-[11px]">{emp.branch.name}</td>
                                                <td className="px-2 py-1.5 text-slate-600 font-medium text-[11px]">{emp.department || '-'}</td>
                                                <td className="px-2 py-1.5">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                                                        {emp.position}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.status === 'Đang làm việc'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {emp.status || 'Không rõ'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    {emp.user ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[11px] font-semibold text-slate-900">{emp.user.username}</span>
                                                            <span className={`text-[9px] ${emp.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                                {emp.user.isActive ? '✓ Hoạt động' : '✗ Bị khóa'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">Chưa có TK</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => router.push(`/employees/${emp.id}`)}
                                                            className="px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-colors"
                                                        >
                                                            Xem
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-2 text-center text-[11px] text-slate-600">
                    Tổng số: <span className="font-bold text-slate-900">{filteredEmployees.length}</span> nhân viên
                </div>
            </div>
        </div>
    );
}
