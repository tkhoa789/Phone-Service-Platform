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
  variant?: 'primary' | 'tactile';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  fullWidth = false,
  variant = 'primary'
}) => {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'inline-flex h-12 items-center justify-center rounded-2xl bg-card border border-border/40 p-1 text-muted-foreground shadow-inset select-none',
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
              'inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              fullWidth && 'flex-1',
              isActive
                ? variant === 'primary'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-primary/20 font-semibold'
                  : 'bg-surface-elevated text-foreground neu-raised shadow-sm font-semibold border border-border/40'
                : 'hover:text-foreground hover:bg-muted/30'
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
