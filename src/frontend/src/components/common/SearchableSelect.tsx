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
        <label className="text-sm font-medium text-foreground mb-1 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-card border border-border/40 rounded-2xl px-3.5 py-2.5 text-left text-foreground flex items-center justify-between transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 shadow-inset ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={selectedOption ? 'text-foreground font-semibold truncate' : 'text-muted-foreground/70 font-medium truncate'}>
          {selectedOption ? (
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] font-mono text-muted-foreground font-normal shrink-0">({selectedOption.sublabel})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Dropdown Panel with Search Bar */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-card border border-border/50 rounded-2xl neu-raised-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2 shadow-2xl">
          {/* Search Bar Input */}
          <div className="p-1.5 border-b border-border/30 sticky top-0 z-10 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-surface-elevated/70 border border-border/40 rounded-xl pl-9 pr-7 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 shadow-inset"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-1 mt-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-xs italic">
                Không tìm thấy tùy chọn phù hợp với "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'bg-primary/15 text-primary font-semibold border border-primary/30 shadow-inset'
                        : opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'text-foreground hover:bg-muted/40 font-medium'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate">{opt.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
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
