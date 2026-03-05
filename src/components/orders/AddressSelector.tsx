import React, { useState, useEffect } from 'react';
import { Province, Ward } from '@/types/order';
import { MapPin, ChevronDown, Loader2, X } from 'lucide-react';

interface AddressSelectorProps {
    provinceId?: string;
    wardId?: string;
    customerAddress?: string;
    initialProvince?: Province;
    initialWard?: Ward;
    onChange: (data: { provinceId: string; wardId: string; customerAddress: string }) => void;
}

export default function AddressSelector({
    provinceId,
    wardId,
    customerAddress,
    initialProvince,
    initialWard,
    onChange
}: AddressSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    // Fetch provinces once when expanded
    useEffect(() => {
        if (isExpanded && provinces.length === 0) {
            fetchProvinces();
        }
    }, [isExpanded]);

    // Fetch wards when provinceId changes
    useEffect(() => {
        if (provinceId) {
            fetchWards(provinceId);
        } else {
            setWards([]);
        }
    }, [provinceId]);

    const fetchProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/addresses/provinces`);
            const data = await res.json();
            setProvinces(data);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const fetchWards = async (pId: string) => {
        setLoadingWards(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/addresses/provinces/${pId}/wards`);
            const data = await res.json();
            setWards(data);
        } catch (error) {
            console.error('Error fetching wards:', error);
        } finally {
            setLoadingWards(false);
        }
    };

    const selectedProvince = (provinceId && provinces.find(p => p.id === provinceId)) || (provinceId ? initialProvince : undefined);
    const selectedWard = (wardId && wards.find(w => w.id === wardId)) || (wardId ? initialWard : undefined);

    const displayAddress = [
        customerAddress,
        selectedWard?.name,
        selectedProvince?.name
    ].filter(Boolean).join(', ');

    return (
        <div className="relative w-full">
            {!isExpanded ? (
                <div
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 transition-colors p-1 -m-1 rounded w-full"
                >
                    <input
                        type="text"
                        readOnly
                        value={displayAddress || ''}
                        placeholder="Số nhà, đường, phường/xã..."
                        className="bg-transparent border-none font-medium focus:ring-0 p-0 text-slate-900 w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-sm print:text-sm print:placeholder-transparent"
                    />
                    {displayAddress && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ provinceId: '', wardId: '', customerAddress: '' });
                            }}
                            className="p-1 hover:bg-rose-50 rounded-full text-rose-500 transition-colors shrink-0 print:hidden cursor-pointer"
                            title="Xóa địa chỉ"
                        >
                            <X size={12} />
                        </button>
                    )}
                    <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 print:hidden" />
                </div>
            ) : (
                <>
                    {/* Backdrop to close when clicking outside */}
                    <div
                        className="fixed inset-0 z-40 bg-black/5"
                        onClick={() => setIsExpanded(false)}
                    />

                    <div className="absolute top-0 left-0 w-full md:w-[400px] bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5 tracking-widest">
                                <MapPin size={12} className="text-rose-600" /> Vị trí khách hàng
                            </span>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-rose-50 rounded-full text-rose-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Tỉnh/Thành phố</label>
                                <div className="relative">
                                    <select
                                        value={provinceId || ''}
                                        onChange={(e) => {
                                            const pId = e.target.value;
                                            onChange({ provinceId: pId, wardId: '', customerAddress: customerAddress || '' });
                                        }}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Chọn Tỉnh --</option>
                                        {provinces.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {loadingProvinces && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <Loader2 size={14} className="animate-spin text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Phường/Xã/Thị trấn</label>
                                <div className="relative">
                                    <select
                                        value={wardId || ''}
                                        disabled={!provinceId || loadingWards}
                                        onChange={(e) => {
                                            onChange({ provinceId: provinceId!, wardId: e.target.value, customerAddress: customerAddress || '' });
                                        }}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 transition-all appearance-none disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="">-- Chọn Xã --</option>
                                        {wards.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    {loadingWards && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <Loader2 size={14} className="animate-spin text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase px-1">Số nhà, tên đường</label>
                            <input
                                type="text"
                                value={customerAddress || ''}
                                onChange={(e) => {
                                    onChange({ provinceId: provinceId || '', wardId: wardId || '', customerAddress: e.target.value });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsExpanded(false);
                                }}
                                placeholder="VD: 1012 Đường Láng..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 transition-all placeholder:font-normal"
                            />
                        </div>

                        <button
                            onClick={() => {
                                // Blur any active input to help mobile browser reset zoom
                                if (document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur();
                                }
                                setIsExpanded(false);
                            }}
                            className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all mt-2 active:scale-[0.98] cursor-pointer"
                        >
                            Xác nhận địa chỉ
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
