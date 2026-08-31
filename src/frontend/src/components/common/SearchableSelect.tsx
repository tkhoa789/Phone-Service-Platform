import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Chọn một tùy chọn --',
  searchPlaceholder = 'Gõ để tìm kiếm...',
  label,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchLabel = opt.label.toLowerCase().includes(query);
    const matchSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(query) : false;
    return matchLabel || matchSublabel;
  });

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative w-full text-xs font-sans ${className}`} ref={containerRef}>
      {label && (
        <label className="text-slate-800 font-bold mb-1 block">
          {label} {required && <span className="text-emerald-600">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-200 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-left text-slate-800 flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-[inset_3px_3px_7px_#b8c4d4,inset_-3px_-3px_7px_#ffffff] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={selectedOption ? 'text-slate-900 font-bold truncate' : 'text-slate-600 font-medium truncate'}>
          {selectedOption ? (
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] font-mono text-slate-600 font-semibold shrink-0">({selectedOption.sublabel})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
      </button>

      {/* Dropdown Panel with Search Bar */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-200 border border-white/80 rounded-3xl shadow-[10px_10px_25px_#b8c4d4,-10px_-10px_25px_#ffffff] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2">
          {/* Search Bar Input */}
          <div className="p-2 border-b border-slate-300 bg-slate-200 sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-200 border border-slate-300 rounded-xl pl-9 pr-7 py-2 text-xs text-slate-900 font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-[inset_2px_2px_5px_#b8c4d4]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs italic font-semibold">
                Không tìm thấy tùy chọn phù hợp với "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 shadow-[inset_2px_2px_5px_#b8c4d4]'
                        : opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'text-slate-800 hover:bg-slate-300/60 font-semibold'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-600 font-mono font-medium truncate">{opt.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
