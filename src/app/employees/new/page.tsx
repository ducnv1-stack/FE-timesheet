'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Branch {
    id: string;
    name: string;
}

export default function NewEmployeePage() {
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const [saving, setSaving] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        branchId: '',
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
        const allowedRoles = ['DIRECTOR', 'CHIEF_ACCOUNTANT', 'MANAGER', 'ACCOUNTANT', 'BRANCH_ACCOUNTANT'];
        if (!allowedRoles.includes(roleCode)) {
            router.push('/dashboard');
            return;
        }

        // Auto-set branch for MANAGER
        if (roleCode === 'MANAGER' && parsedUser.employee?.branchId) {
            setForm(prev => ({ ...prev, branchId: parsedUser.employee.branchId }));
        }

        fetchBranches();
    }, []);

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
        if (!form.position) {
            toastError('Vui lòng chọn chức vụ');
            return;
        }

        setSaving(true);
        try {
            // Build payload, convert empty strings to undefined
            const payload: any = {
                fullName: form.fullName.trim(),
                branchId: form.branchId,
                position: form.position,
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
                        className="p-1.5 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
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
                            value={form.position}
                            onChange={(val) => setForm({ ...form, position: val })}
                            options={[
                                { label: 'Giám đốc (GĐ)', value: 'GĐ' },
                                { label: 'Giám đốc KD (GĐKD)', value: 'GĐKD' },
                                { label: 'Trợ lý Giám đốc', value: 'Trợ lý GĐ' },
                                { label: 'Quản Lý', value: 'Quản Lý' },
                                { label: 'Nhân viên bán hàng (NVBH)', value: 'NVBH' },
                                { label: 'Kế toán', value: 'Kế toán' },
                                { label: 'Media', value: 'Media' },
                                { label: 'ADS', value: 'ADS' },
                                { label: 'HCNS', value: 'HCNS' },
                                { label: 'Nhân viên KT (NVKT)', value: 'NVKT' },
                                { label: 'Lái xe (Driver)', value: 'Driver' },
                                { label: 'Marketing', value: 'Marketing' },
                                { label: 'Nhân viên (Khác)', value: 'Nhân viên' },
                            ]}
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
                            value={form.department}
                            onChange={(val) => setForm({ ...form, department: val })}
                            options={[
                                { label: 'BGĐ', value: 'BGĐ' },
                                { label: 'MKT', value: 'MKT' },
                                { label: 'HCKT', value: 'HCKT' },
                                { label: 'Kỹ Thuật', value: 'Kỹ Thuật' },
                                { label: 'Kho', value: 'Kho' },
                                { label: 'Lái xe', value: 'Lái xe' },
                                { label: 'Phòng KD', value: 'Phòng KD' },
                            ]}
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
                                className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                            />
                            <label htmlFor="isInternalDriver" className="text-[11px] font-semibold text-slate-700">
                                Là tài xế nội bộ
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push('/employees')}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
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
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                >
                    <option value="">{placeholder || 'Chọn...'}</option>
                    {options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : type === 'date' ? (
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
            )}
        </div>
    );
}
