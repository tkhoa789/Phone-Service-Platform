import React from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-muted/60 dark:bg-muted/40 shadow-inset',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col gap-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex flex-col gap-2 mt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
