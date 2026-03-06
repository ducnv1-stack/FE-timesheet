import React, { useState, useEffect, useRef } from 'react';
import { Province, Ward } from '@/types/order';
import { MapPin, ChevronDown, Loader2, X, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                        className="fixed inset-0 z-[60] bg-black/5"
                        onClick={() => setIsExpanded(false)}
                    />

                    <div className="absolute top-0 left-0 w-full md:w-[450px] bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-[70] p-4 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5 tracking-widest">
                                <MapPin size={12} className="text-rose-600" /> Vị trí khách hàng
                            </span>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-rose-50 rounded-full text-rose-600 transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Tỉnh/Thành phố</label>
                                <SearchableDropdown
                                    options={provinces.map(p => ({ id: p.id, name: p.name }))}
                                    value={provinceId || ''}
                                    onChange={(val) => onChange({ provinceId: val, wardId: '', customerAddress: customerAddress || '' })}
                                    placeholder="Tìm Tỉnh/Thành..."
                                    loading={loadingProvinces}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Phường/Xã/Thị trấn</label>
                                <SearchableDropdown
                                    options={wards.map(w => ({ id: w.id, name: w.name }))}
                                    value={wardId || ''}
                                    disabled={!provinceId}
                                    onChange={(val) => onChange({ provinceId: provinceId!, wardId: val, customerAddress: customerAddress || '' })}
                                    placeholder="Tìm Xã/Phường..."
                                    loading={loadingWards}
                                />
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

function SearchableDropdown({
    options,
    value,
    onChange,
    placeholder,
    loading,
    disabled
}: {
    options: { id: string; name: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    loading?: boolean;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (disabled) {
        return (
            <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-300 opacity-50 cursor-not-allowed">
                {placeholder}
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:border-slate-200 transition-all cursor-pointer group",
                    isOpen && "border-rose-500 bg-white"
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-slate-400 font-normal")}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <div className="flex items-center gap-1.5">
                    {loading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />}
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px]">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 sticky top-0">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            placeholder="Gõ để tìm..."
                            autoFocus
                            className="w-full bg-transparent border-none text-[11px] font-bold text-slate-700 placeholder:font-normal focus:ring-0 p-0"
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={cn(
                                        "px-3 py-2 text-[11px] hover:bg-rose-50 flex items-center justify-between cursor-pointer transition-colors group",
                                        value === opt.id ? "bg-rose-50 text-rose-700 font-bold" : "text-slate-700"
                                    )}
                                >
                                    <span className="truncate">{opt.name}</span>
                                    {value === opt.id && <Check size={12} className="text-rose-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-[10px] text-slate-400">Không tìm thấy kết quả</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
