import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-300 text-xs text-slate-700">
      <div className="font-medium text-slate-700">
        Hiển thị từ <span className="font-extrabold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
        <span className="font-extrabold text-slate-900">{Math.min(currentPage * pageSize, totalItems)}</span> trong tổng số{' '}
        <span className="font-extrabold text-emerald-700">{totalItems}</span> bản ghi
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 font-bold shadow-[3px_3px_7px_#b8c4d4,-3px_-3px_7px_#ffffff]"
        >
          <ChevronLeft className="w-4 h-4" /> Trước
        </Button>

        <span className="px-4 py-2 rounded-xl bg-slate-200 border border-emerald-500/40 text-emerald-800 font-extrabold shadow-[inset_2px_2px_5px_#b8c4d4,inset_-2px_-2px_5px_#ffffff]">
          Trang {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 font-bold shadow-[3px_3px_7px_#b8c4d4,-3px_-3px_7px_#ffffff]"
        >
          Sau <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
