import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

const FOCUSABLE_ELEMENTS_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full'
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  size = 'md',
  children,
  className,
  hideCloseButton
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  // Handle body scroll locking
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Handle focus trap, escape key, and restore focus
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const drawerNode = drawerRef.current;
    if (!drawerNode) return;

    const focusable = Array.from(drawerNode.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)).filter(
      (el) => !el.hasAttribute('disabled')
    );

    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      drawerNode.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = Array.from(
          drawerNode.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === drawerNode) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || document.activeElement === drawerNode) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        try {
          previousFocusRef.current.focus();
        } catch {
          // Ignore focus restore error
        }
      }
    };
  }, [open]);

  if (!open) return null;

  const isRight = side === 'right';

  const content = (
    <div className="fixed inset-0 z-50 flex bg-black/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Clickable backdrop overlay */}
      <div className="absolute inset-0 cursor-pointer" onClick={() => onOpenChange(false)} />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? 'drawer-title' : undefined}
        aria-describedby={description ? 'drawer-description' : undefined}
        className={cn(
          'relative z-10 w-full h-full bg-card border-border/40 neu-raised-lg text-foreground shadow-2xl flex flex-col',
          'focus:outline-none overflow-hidden duration-300',
          sizeMap[size],
          isRight ? 'ml-auto border-l animate-in slide-in-from-right' : 'mr-auto border-r animate-in slide-in-from-left',
          className
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/30 shrink-0">
          <div>
            {title && (
              <h2 id="drawer-title" className="text-lg font-heading font-semibold text-foreground tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id="drawer-description" className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all neu-raised active:shadow-inset cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ml-4 shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
