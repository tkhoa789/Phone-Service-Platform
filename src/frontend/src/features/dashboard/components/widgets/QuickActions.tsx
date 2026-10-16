import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import { cn } from '../../../../utils/cn';

export interface QuickActionItem {
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconColor?: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'outline';
  onClick: () => void;
  permission?: string;
  allowedRoles?: string[];
}

export interface QuickActionsProps {
  title?: string;
  description?: string;
  actions: QuickActionItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  title,
  description,
  actions,
  columns = 4,
  className,
}) => {
  const { hasPermission, roles } = useAuthStore();

  const filteredActions = actions.filter((action) => {
    if (action.permission && !hasPermission(action.permission)) {
      return false;
    }
    if (action.allowedRoles && action.allowedRoles.length > 0) {
      const isAllowed = action.allowedRoles.some((r) => roles.includes(r));
      if (!isAllowed) return false;
    }
    return true;
  });

  if (filteredActions.length === 0) {
    return null;
  }

  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('space-y-3', className)}>
      {(title || description) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}

      <div className={cn('grid gap-4', gridColsClass)}>
        {filteredActions.map((action, idx) => (
          <Card
            key={idx}
            onClick={action.onClick}
            className="p-5 neu-raised border border-border/40 hover:neu-raised-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl neu-inset flex items-center justify-center transition-transform group-hover:scale-105',
                    action.iconColor || 'text-primary'
                  )}
                >
                  {action.icon}
                </div>
                {action.badge && (
                  <Badge variant={action.badgeVariant || 'primary'} className="text-[10px]">
                    {action.badge}
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h4>
                {action.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {action.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-xs text-primary font-bold">
              <span>Thao tác nhanh</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
