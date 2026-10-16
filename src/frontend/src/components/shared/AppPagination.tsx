import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface AppPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const AppPagination: React.FC<AppPaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalPages <= 1 && totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 pb-2 gap-4 text-xs text-muted-foreground select-none">
      <div className="font-medium">
        Hiển thị từ <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
        <span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, totalItems)}</span> trong tổng số{' '}
        <span className="font-bold text-primary">{totalItems}</span> bản ghi
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Trước
        </Button>

        <span className="px-3.5 py-1.5 rounded-xl bg-card border border-border/40 shadow-inset text-foreground font-semibold text-xs">
          Trang {currentPage} / {totalPages || 1}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 font-medium"
        >
          Sau <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
