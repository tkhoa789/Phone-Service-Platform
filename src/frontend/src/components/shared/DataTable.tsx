import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Database } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DataTableProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  loadingRows?: number;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  children,
  isLoading,
  isEmpty,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyAction,
  loadingRows = 5,
  className
}) => {
  return (
    <Card className={cn("overflow-hidden flex flex-col w-full", className)}>
      {isLoading ? (
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: loadingRows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={<Database className="w-8 h-8" />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          className="border-0 shadow-none m-4"
        />
      ) : (
        <div className="w-full overflow-x-auto scrollbar-hide">
          {children}
        </div>
      )}
    </Card>
  );
};
