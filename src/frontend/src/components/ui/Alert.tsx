import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

const icons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const variants = {
  default: 'bg-card text-foreground border-border/40',
  info: 'bg-sky-500/5 text-sky-800 dark:text-sky-300 border-sky-500/30',
  success: 'bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/5 text-amber-800 dark:text-amber-300 border-amber-500/30',
  error: 'bg-rose-500/5 text-rose-800 dark:text-rose-300 border-rose-500/30',
};

const iconColors = {
  default: 'text-muted-foreground',
  info: 'text-sky-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-rose-500',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, children, ...props }, ref) => {
    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-2xl border p-4 flex gap-3.5 shadow-inset transition-all',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="shrink-0 mt-0.5">
          <Icon className={cn('w-5 h-5', iconColors[variant])} />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          {title && <h5 className="font-semibold text-sm leading-tight tracking-tight text-foreground">{title}</h5>}
          <div className="text-xs leading-relaxed opacity-90">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';
