import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { cn } from '../../../../utils/cn';

export interface SupportingBadgeItem {
  id: string | number;
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  onClick?: () => void;
  isLoading?: boolean;
}

export interface SupportingBadgesProps {
  title?: string;
  items: SupportingBadgeItem[];
  className?: string;
}

export const SupportingBadges: React.FC<SupportingBadgesProps> = ({
  title,
  items,
  className,
}) => {
  const variantStyles = {
    default: 'bg-card/70 border-border/40 text-foreground',
    primary: 'bg-primary/5 border-primary/20 text-primary',
    success: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400',
    info: 'bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
    muted: 'bg-muted/40 border-border/30 text-muted-foreground',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {title}
        </h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const style = variantStyles[item.variant || 'default'];
          return (
            <Card
              key={item.id}
              onClick={item.onClick}
              className={cn(
                'p-3 border neu-raised transition-all flex items-center justify-between gap-2.5',
                style,
                item.onClick ? 'hover:neu-raised-md cursor-pointer active:shadow-inset' : ''
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
                {item.isLoading ? (
                  <Skeleton className="h-5 w-16 mt-1 rounded" />
                ) : (
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-heading font-bold text-sm sm:text-base text-foreground truncate">
                      {item.value ?? '—'}
                    </span>
                    {item.unit && (
                      <span className="text-[11px] text-muted-foreground">{item.unit}</span>
                    )}
                  </div>
                )}
              </div>

              {item.icon && (
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg neu-inset flex items-center justify-center shrink-0 text-xs',
                    item.iconColor || 'text-primary'
                  )}
                >
                  {item.icon}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
