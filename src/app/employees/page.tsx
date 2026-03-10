'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Filter, FileSpreadsheet, Download } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import * as XLSX from 'xlsx';
import { formatDate } from '@/lib/utils';

interface Employee {
    id: string;
    avatarUrl: string | null;
    fullName: string;
    phone: string | null;
    position: string;
    department: string | null;
    status: string | null;
    email: string | null;
    idCardNumber: string | null;
    birthday: string | null;
    joinDate: string | null;
    contractSigningDate: string | null;
    branch: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        username: string;
        passwordHash: string;
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
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [hasAccountFilter, setHasAccountFilter] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(user);

        // RBAC: Only allowed roles can access this page
        const roleCode = parsedUser.role?.code;
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'HR', 'ADMIN'];

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

    const handleExportExcel = async () => {
        try {
            // Fetch all employees for export
            const res = await fetch(`${API_URL}/employees/export`);
            if (!res.ok) throw new Error('Không thể tải dữ liệu xuất');
            const data: Employee[] = await res.json();

            const exportData = data.map(emp => ({
                'Họ và tên': emp.fullName,
                'Số điện thoại': emp.phone || '',
                'Email': emp.email || '',
                'CCCD/CMND': emp.idCardNumber || '',
                'Ngày sinh': emp.birthday ? formatDate(emp.birthday) : '',
                'Giới tính': (emp as any).gender || '',
                'Chi nhánh': emp.branch.name,
                'Phòng ban': emp.department || '',
                'Chức vụ': emp.position,
                'Trạng thái': emp.status || '',
                'Ngày vào làm': emp.joinDate ? formatDate(emp.joinDate) : '',
                'Hợp đồng': (emp as any).contractType || '',
                'Tên đăng nhập': emp.user?.username || 'Chưa có',
                'Mật khẩu (mã hóa)': emp.user?.passwordHash || '',
                'Trạng thái TK': emp.user ? (emp.user.isActive ? 'Hoạt động' : 'Bị khóa') : 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhân viên');

            // Set column widths
            ws['!cols'] = [
                { wch: 25 }, // Họ tên
                { wch: 15 }, // SĐT
                { wch: 25 }, // Email
                { wch: 15 }, // CCCD
                { wch: 12 }, // Ngày sinh
                { wch: 10 }, // Giới tính
                { wch: 15 }, // Chi nhánh
                { wch: 15 }, // Phòng ban
                { wch: 15 }, // Chức vụ
                { wch: 15 }, // Trạng thái
                { wch: 12 }, // Ngày vào làm
                { wch: 15 }, // Hợp đồng
                { wch: 15 }, // Username
                { wch: 15 }  // TK Status
            ];

            XLSX.writeFile(wb, `Danh_sach_Nhan_vien_Ohari_${formatDate(new Date()).replace(/\//g, '-')}.xlsx`);
        } catch (error: any) {
            console.error('Export error:', error);
            toastError(error.message || 'Lỗi khi xuất file');
        }
    };

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
            if (selectedDepartment) params.append('department', selectedDepartment);
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

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedPosition('');
        setSelectedDepartment('');
        setSelectedStatus('');
        setHasAccountFilter('');

        const userRole = currentUser?.role?.code;
        const userBranchId = currentUser?.employee?.branchId;
        if (userRole === 'MANAGER' && userBranchId) {
            setSelectedBranch(userBranchId);
        } else {
            setSelectedBranch('');
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchEmployees();
        }
    }, [currentUser, selectedBranch, selectedPosition, selectedDepartment, selectedStatus, hasAccountFilter]);

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

    // Check permissions
    const userRole = currentUser?.role?.code;
    const isGlobal = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'HR', 'ADMIN'].includes(userRole);
    const isBranch = ['MANAGER'].includes(userRole);

    const canCreate = isGlobal || isBranch;
    const canEdit = isGlobal || isBranch;
    const canDelete = isGlobal;

    // HR can view AND manage (create/edit/delete)
    const canManage = true; // Everyone who can access this page (already filtered by allowedRoles)

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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all cursor-pointer"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Xuất Excel
                        </button>
                        {canManage && canCreate && (
                            <button
                                onClick={() => router.push('/employees/new')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Thêm Nhân Viên
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-2.5 mb-3 border border-slate-200">
                    {/* PC Header */}
                    <div className="hidden lg:flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-slate-600" />
                            <h2 className="text-xs font-bold text-slate-900">Bộ Lọc</h2>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-2 py-1 bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                            ✕ Reset
                        </button>
                    </div>

                    {/* Mobile Header & Search Toggles */}
                    <div className="flex lg:hidden items-center gap-2 mb-2">
                        <div className="relative flex-1">
                            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${searchTerm ? 'text-rose-500' : 'text-slate-400'}`} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tên, SĐT..."
                                className={`w-full pl-8 pr-3 py-1.5 text-[11px] font-bold border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all ${searchTerm ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-slate-50'}`}
                            />
                        </div>
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer",
                                showMobileFilters || selectedBranch || selectedPosition || selectedDepartment || selectedStatus || hasAccountFilter
                                    ? "bg-rose-600 text-white border-rose-600 shadow-md"
                                    : "bg-white text-slate-600 border-slate-200"
                            )}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {showMobileFilters ? 'ĐÓNG' : 'BỘ LỌC'}
                        </button>
                    </div>

                    <div className={cn(
                        "transition-all duration-300 overflow-hidden",
                        showMobileFilters ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
                    )}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 pt-1 lg:pt-0">
                            {/* Search (Desktop Only) */}
                            <div className="hidden lg:block">
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
                                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <option value="">Tất cả</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                {currentUser?.role?.code === 'MANAGER' && (
                                    <p className="text-[9px] text-slate-500 mt-0.5 lg:hidden">Bạn chỉ có thể xem nhân viên chi nhánh của mình</p>
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
                                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="GĐ">Giám đốc (GĐ)</option>
                                    <option value="GĐKD">Giám đốc kinh doanh (GĐKD)</option>
                                    <option value="Trợ lý GĐ">Trợ lý Giám đốc</option>
                                    <option value="Quản Lý">Quản Lý</option>
                                    <option value="NVBH">Nhân viên bán hàng (NVBH)</option>
                                    <option value="NVGH">Nhân viên giao hàng (NVGH)</option>
                                    <option value="Kế toán">Kế toán</option>
                                    <option value="Media">Media</option>
                                    <option value="ADS">ADS</option>
                                    <option value="HCNS">Hành chính nhân sự (HCNS)</option>
                                    <option value="NVKT">Nhân viên kỹ thuật (NVKT)</option>
                                    <option value="Driver">Lái xe (Driver)</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Nhân viên">Nhân viên (Khác)</option>
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                                    Phòng Ban
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="BGĐ">BGĐ</option>
                                    <option value="MKT">MKT</option>
                                    <option value="HCKT">HCKT</option>
                                    <option value="Kỹ Thuật">Kỹ Thuật</option>
                                    <option value="Kho">Kho</option>
                                    <option value="Lái xe">Lái xe</option>
                                    <option value="Phòng KD">Phòng KD</option>
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
                                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
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
                                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="true">Có tài khoản</option>
                                    <option value="false">Chưa có</option>
                                </select>
                            </div>

                            {/* Mobile Reset Button */}
                            <div className="lg:hidden pt-2 border-t border-slate-100 mt-1">
                                <button
                                    onClick={resetFilters}
                                    className="w-full py-2 bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-wider rounded-lg border border-rose-100 cursor-pointer"
                                >
                                    ✕ Xóa Tất Cả Bộ Lọc
                                </button>
                            </div>
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
                                    <tr className="whitespace-nowrap">
                                        <th className="px-2 py-1.5 text-center w-10"></th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">Tên Nhân Viên</th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">SĐT</th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">Chi Nhánh</th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">Phòng Ban</th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">Chức Vụ</th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">Trạng Thái</th>
                                        <th className="px-2 py-1.5 pr-6 text-left font-bold text-[9px] uppercase tracking-wider">Tài Khoản</th>
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
                                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors whitespace-nowrap">
                                                <td className="px-2 py-1.5 text-center">
                                                    <div className="w-7 h-7 rounded-sm overflow-hidden border border-slate-200 bg-slate-100 mx-auto flex items-center justify-center shrink-0">
                                                        {emp.avatarUrl ? (
                                                            <img
                                                                src={emp.avatarUrl.startsWith('http') ? emp.avatarUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')}${emp.avatarUrl}`}
                                                                alt="Avatar"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                {emp.fullName.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 pr-6 font-semibold text-slate-900 text-[11px] text-left">{emp.fullName}</td>
                                                <td className="px-2 py-1.5 pr-6 text-slate-600 text-[11px] text-left">{emp.phone || '-'}</td>
                                                <td className="px-2 py-1.5 pr-6 text-slate-600 font-medium text-[11px] text-left">{emp.branch.name}</td>
                                                <td className="px-2 py-1.5 pr-6 text-slate-600 font-medium text-[11px] text-left">{emp.department || '-'}</td>
                                                <td className="px-2 py-1.5 pr-6 text-left">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                                                        {emp.position}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-1.5 pr-6 text-left">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.status === 'Đang làm việc'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {emp.status || 'Không rõ'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-1.5 pr-6 text-left">
                                                    {emp.user ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[11px] font-semibold text-slate-900 leading-none">{emp.user.username}</span>
                                                            <span className={`text-[9px] leading-none ${emp.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
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
                                                            className="px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
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
