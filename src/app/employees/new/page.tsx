'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import FixedDatePicker from '@/components/ui/FixedDatePicker';

interface Branch {
    id: string;
    name: string;
}

export default function NewEmployeePage() {
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const [saving, setSaving] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [allDepartments, setAllDepartments] = useState<any[]>([]);
    const [allPositions, setAllPositions] = useState<any[]>([]);

    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        branchId: '',
        positionId: '',
        departmentId: '',
        position: '',
        department: '',
        birthday: '',
        gender: '',
        status: 'Đang làm việc',
        workingType: '',
        joinDate: '',
        contractType: '',
        contractSigningDate: '',
        idCardNumber: '',
        permanentAddress: '',
        email: '',
        socialInsuranceNumber: '',
        isInternalDriver: false,
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(user);
        const roleCode = parsedUser.role?.code;
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT', 'HR', 'ADMIN'];
        if (!allowedRoles.includes(roleCode)) {
            router.push('/dashboard');
            return;
        }

        // Auto-set branch for MANAGER
        if (roleCode === 'MANAGER' && parsedUser.employee?.branchId) {
            setForm(prev => ({ ...prev, branchId: parsedUser.employee.branchId }));
        }

        fetchBranches();
        fetchDepartments();
        fetchPositions();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_URL}/departments`);
            const data = await res.json();
            setAllDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchPositions = async () => {
        try {
            const res = await fetch(`${API_URL}/positions`);
            const data = await res.json();
            setAllPositions(data);
        } catch (error) {
            console.error('Error fetching positions:', error);
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

    const handleSubmit = async () => {
        if (!form.fullName.trim()) {
            toastError('Vui lòng nhập họ tên nhân viên');
            return;
        }
        if (!form.branchId) {
            toastError('Vui lòng chọn chi nhánh');
            return;
        }
        if (!form.positionId) {
            toastError('Vui lòng chọn chức vụ');
            return;
        }

        setSaving(true);
        try {
            // Build payload, convert empty strings to undefined
            // Find position name for legacy 'position' field
            const selectedPos = allPositions.find(p => p.id === form.positionId);
            const payload: any = {
                fullName: form.fullName.trim(),
                branchId: form.branchId,
                positionId: form.positionId,
                position: selectedPos?.name || 'Nhân viên', // Fallback to 'Nhân viên' if not found
                departmentId: form.departmentId || null,
            };

            if (form.phone.trim()) payload.phone = form.phone.trim();
            if (form.department) payload.department = form.department;
            if (form.birthday) payload.birthday = form.birthday;
            if (form.gender) payload.gender = form.gender;
            if (form.status) payload.status = form.status;
            if (form.workingType) payload.workingType = form.workingType;
            if (form.joinDate) payload.joinDate = form.joinDate;
            if (form.contractType) payload.contractType = form.contractType;
            if (form.contractSigningDate) payload.contractSigningDate = form.contractSigningDate;
            if (form.idCardNumber?.trim()) payload.idCardNumber = form.idCardNumber.trim();
            if (form.permanentAddress?.trim()) payload.permanentAddress = form.permanentAddress.trim();
            if (form.email?.trim()) payload.email = form.email.trim();
            if (form.socialInsuranceNumber?.trim()) payload.socialInsuranceNumber = form.socialInsuranceNumber.trim();
            if (form.isInternalDriver) payload.isInternalDriver = true;

            const res = await fetch(`${API_URL}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Lỗi tạo nhân viên');
            }

            const newEmployee = await res.json();
            success('Thêm nhân viên thành công!');
            router.push(`/employees/${newEmployee.id}`);
        } catch (error: any) {
            toastError('Lỗi: ' + (Array.isArray(error.message) ? error.message.join(', ') : error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.push('/employees')}
                        className="p-1.5 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900">Thêm Nhân Viên Mới</h1>
                        <p className="text-[10px] text-slate-500">Điền thông tin nhân viên</p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 mb-3">Thông Tin Bắt Buộc</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <FormField
                            label="Họ tên *"
                            value={form.fullName}
                            onChange={(val) => setForm({ ...form, fullName: val })}
                            placeholder="Nhập họ tên đầy đủ"
                        />
                        <FormField
                            label="Chi nhánh *"
                            type="select"
                            value={form.branchId}
                            onChange={(val) => setForm({ ...form, branchId: val })}
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                            placeholder="Chọn chi nhánh"
                        />
                        <FormField
                            label="Chức vụ *"
                            type="select"
                            value={form.positionId}
                            onChange={(val) => setForm({ ...form, positionId: val })}
                            options={allPositions.map(p => ({ label: p.name, value: p.id }))}
                            placeholder="Chọn chức vụ"
                        />
                        <FormField
                            label="SĐT"
                            value={form.phone}
                            onChange={(val) => setForm({ ...form, phone: val })}
                            placeholder="Số điện thoại"
                        />
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 mb-3 mt-5 pt-3 border-t border-slate-100">Thông Tin Bổ Sung</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                            label="Phòng ban"
                            type="select"
                            value={form.departmentId}
                            onChange={(val) => setForm({ ...form, departmentId: val })}
                            options={allDepartments.map(d => ({ label: d.name, value: d.id }))}
                            placeholder="Chọn phòng ban"
                        />
                        <FormField
                            label="Trạng thái"
                            type="select"
                            value={form.status}
                            onChange={(val) => setForm({ ...form, status: val })}
                            options={[
                                { label: 'Đang làm việc', value: 'Đang làm việc' },
                                { label: 'Nghỉ việc', value: 'Nghỉ việc' },
                            ]}
                        />
                        <FormField
                            label="Giới tính"
                            type="select"
                            value={form.gender}
                            onChange={(val) => setForm({ ...form, gender: val })}
                            options={[
                                { label: 'Nam', value: 'Nam' },
                                { label: 'Nữ', value: 'Nữ' },
                            ]}
                            placeholder="Chọn giới tính"
                        />
                        <FormField
                            label="Loại công việc"
                            value={form.workingType}
                            onChange={(val) => setForm({ ...form, workingType: val })}
                            placeholder="VD: Full time, Hành chính..."
                        />
                        <FormField
                            label="Ngày sinh"
                            type="date"
                            value={form.birthday}
                            onChange={(val) => setForm({ ...form, birthday: val })}
                        />
                        <FormField
                            label="Ngày vào làm"
                            type="date"
                            value={form.joinDate}
                            onChange={(val) => setForm({ ...form, joinDate: val })}
                        />
                        <FormField
                            label="Loại hợp đồng"
                            value={form.contractType}
                            onChange={(val) => setForm({ ...form, contractType: val })}
                            placeholder="VD: 1 năm, Không xác định..."
                        />
                        <FormField
                            label="Ngày ký HĐ"
                            type="date"
                            value={form.contractSigningDate}
                            onChange={(val) => setForm({ ...form, contractSigningDate: val })}
                        />
                        <FormField
                            label="CMND/CCCD"
                            value={form.idCardNumber}
                            onChange={(val) => setForm({ ...form, idCardNumber: val })}
                            placeholder="Số CMND/CCCD"
                        />
                        <FormField
                            label="Email"
                            value={form.email}
                            onChange={(val) => setForm({ ...form, email: val })}
                            placeholder="Email"
                        />
                        <FormField
                            label="Địa chỉ thường trú"
                            value={form.permanentAddress}
                            onChange={(val) => setForm({ ...form, permanentAddress: val })}
                            placeholder="Địa chỉ"
                        />
                        <FormField
                            label="Số BHXH"
                            value={form.socialInsuranceNumber}
                            onChange={(val) => setForm({ ...form, socialInsuranceNumber: val })}
                            placeholder="Số bảo hiểm xã hội"
                        />
                        <div className="flex items-center gap-2 pt-4">
                            <input
                                type="checkbox"
                                id="isInternalDriver"
                                checked={form.isInternalDriver}
                                onChange={(e) => setForm({ ...form, isInternalDriver: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary-light"
                            />
                            <label htmlFor="isInternalDriver" className="text-[11px] font-semibold text-slate-700 cursor-pointer">
                                Là tài xế nội bộ
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push('/employees')}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-primary text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Đang lưu...' : 'Lưu Nhân Viên'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Reusable Form Field Component
function FormField({
    label,
    value,
    onChange,
    type = 'text',
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    type?: 'text' | 'select' | 'date';
    options?: { label: string; value: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">{label}</label>
            {type === 'select' ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent bg-white cursor-pointer"
                >
                    <option value="">{placeholder || 'Chọn...'}</option>
                    {options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : type === 'date' ? (
                <FixedDatePicker
                    value={value}
                    onChange={(val) => onChange(val)}
                    className="h-[34px] text-[11px]"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent"
                />
            )}
        </div>
    );
}
