import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface MetricCardProps {
  title: string;
  value?: React.ReactNode;
  subtitle?: string;
  unit?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'outline';
  };
  isRestricted?: boolean;
  restrictedTitle?: string;
  restrictedMessage?: string;
  restrictedCode?: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  unit,
  icon,
  iconColor = 'text-primary',
  trend,
  badge,
  isRestricted = false,
  restrictedTitle = 'Bảo mật cấp Doanh nghiệp',
  restrictedMessage = 'Chỉ số giới hạn quyền truy cập theo chính sách phân quyền',
  restrictedCode = 'RBAC-04',
  isLoading = false,
  onClick,
  className,
}) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-5 space-y-3 neu-raised border border-border/40 transition-all flex flex-col justify-between',
        onClick ? 'hover:neu-raised-md cursor-pointer group' : '',
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <Badge variant={badge.variant || 'primary'} className="text-[10px] font-semibold">
                {badge.text}
              </Badge>
            )}
            {icon && (
              <div
                className={cn(
                  'w-8 h-8 rounded-xl neu-inset flex items-center justify-center transition-transform',
                  iconColor,
                  onClick ? 'group-hover:scale-105' : ''
                )}
              >
                {icon}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
          </div>
        ) : isRestricted ? (
          <div className="space-y-1.5 py-1">
            <div className="flex items-center gap-1.5 text-amber-500">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-heading font-bold text-sm tracking-tight">
                {restrictedTitle}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {restrictedMessage}
            </p>
            {restrictedCode && (
              <Badge variant="outline" className="text-[9px] font-mono text-amber-500 border-amber-500/30">
                {restrictedCode}
              </Badge>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl font-bold font-heading text-foreground tracking-tight">
                {value}
              </span>
              {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {!isLoading && !isRestricted && trend && (
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
          <div
            className={cn(
              'flex items-center gap-1 font-semibold',
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
          {trend.label && (
            <span className="text-[11px] text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </Card>
  );
};
