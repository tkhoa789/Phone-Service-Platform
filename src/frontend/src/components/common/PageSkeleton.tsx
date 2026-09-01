import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-card">
      <div className="flex flex-col items-center space-y-4">
        {/* Loading Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border/50 border-t-[var(--neu-accent-mint)]"></div>
        <div className="text-sm font-medium text-muted-foreground">
          Đang tải giao diện...
        </div>
      </div>
    </div>
  );
};
