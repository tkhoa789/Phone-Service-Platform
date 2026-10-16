import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { ArrowRight, Inbox } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface WorkQueueTableProps<T> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'outline';
  };
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

export function WorkQueueTable<T extends { id?: string | number }>({
  title,
  description,
  icon,
  iconColor = 'text-primary',
  badge,
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu trong hàng đợi',
  onRowClick,
  actionText,
  onActionClick,
  className,
}: WorkQueueTableProps<T>) {
  return (
    <Card className={cn('p-5 neu-raised border border-border/40 space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className={cn('w-8 h-8 rounded-xl neu-inset flex items-center justify-center', iconColor)}>
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-foreground">{title}</h3>
              {badge && (
                <Badge variant={badge.variant || 'primary'} className="text-[10px]">
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>

        {actionText && onActionClick && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onActionClick}
            className="text-xs h-8 gap-1 neu-raised active:shadow-inset"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/30 shadow-inner bg-card/50">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/30">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'p-3 font-medium text-[11px] uppercase tracking-wider',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-3">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-muted-foreground space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl neu-inset flex items-center justify-center text-muted-foreground/60">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={item.id ?? rowIdx}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'transition-colors hover:bg-muted/40',
                    onRowClick ? 'cursor-pointer group' : ''
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'p-3 text-foreground',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      {col.render ? col.render(item, rowIdx) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
