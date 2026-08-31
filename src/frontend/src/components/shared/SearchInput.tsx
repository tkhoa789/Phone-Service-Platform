import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import type { InputProps } from '../ui/Input';
import { cn } from '../../utils/cn';

interface SearchInputProps extends Omit<InputProps, 'type'> {
  // Can add specific search props here if needed later (like onDebouncedChange)
}

export const SearchInput: React.FC<SearchInputProps> = ({ className, ...props }) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
      <Input
        type="text"
        className={cn("pl-10", className)}
        {...props}
      />
    </div>
  );
};
