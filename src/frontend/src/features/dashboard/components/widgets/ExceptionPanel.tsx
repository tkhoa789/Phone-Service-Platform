import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface ExceptionItem {
  id: string | number;
  title: string;
  subtitle?: string;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
}

export interface ExceptionPanelProps {
  title: string;
  description?: string;
  count?: number;
  severity?: 'warning' | 'danger' | 'info';
  items?: ExceptionItem[];
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ExceptionPanel: React.FC<ExceptionPanelProps> = ({
  title,
  description,
  count,
  severity = 'warning',
  items,
  actionText,
  onActionClick,
  className,
  children,
}) => {
  const severityConfig = {
    warning: {
      border: 'border-amber-500/40 dark:border-amber-500/30',
      bg: 'bg-amber-500/5 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeVariant: 'warning' as const,
      Icon: AlertTriangle,
    },
    danger: {
      border: 'border-rose-500/40 dark:border-rose-500/30',
      bg: 'bg-rose-500/5 dark:bg-rose-500/10',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badgeVariant: 'danger' as const,
      Icon: AlertCircle,
    },
    info: {
      border: 'border-blue-500/40 dark:border-blue-500/30',
      bg: 'bg-blue-500/5 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeVariant: 'primary' as const,
      Icon: Info,
    },
  }[severity];

  const { Icon, border, bg, iconColor, badgeVariant } = severityConfig;

  return (
    <Card className={cn('p-4 sm:p-5 border neu-raised transition-all space-y-3', border, bg, className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-xl neu-inset flex items-center justify-center shrink-0', iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-bold text-sm text-foreground">{title}</h4>
              {typeof count === 'number' && (
                <Badge variant={badgeVariant} className="text-[11px] font-mono font-bold px-2 py-0.5">
                  {count}
                </Badge>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>

        {actionText && onActionClick && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onActionClick}
            className="text-xs h-8 px-3 gap-1.5 neu-raised active:shadow-inset ml-auto"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {children}

      {items && items.length > 0 && (
        <div className="space-y-2 pt-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card/80 border border-border/40 text-xs hover:border-border/80 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{item.title}</span>
                  {item.badge && (
                    <Badge variant={badgeVariant} className="text-[10px] shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.subtitle && <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>}
              </div>

              {item.actionText && item.onAction && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={item.onAction}
                  className="text-xs h-7 px-2 shrink-0 text-primary hover:text-primary/80"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
