import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className, fullWidth = false }) => {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'inline-flex h-12 items-center justify-center rounded-2xl bg-card p-1 text-muted-foreground shadow-inner',
        fullWidth && 'w-full flex',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
              fullWidth && 'flex-1',
              isActive
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-sm'
                : 'hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            )}
          >
            {tab.icon && <span className="mr-2 shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export const TabPanel: React.FC<{ activeTab: string; id: string; children: React.ReactNode; className?: string }> = ({
  activeTab,
  id,
  children,
  className,
}) => {
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={cn('mt-4 focus-visible:outline-none', className)}
      tabIndex={0}
    >
      {children}
    </div>
  );
};
