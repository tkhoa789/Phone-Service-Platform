import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

const FOCUSABLE_ELEMENTS_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, title, description, children, className, hideCloseButton }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
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

  // Handle focus management (trap, initial focus, restore) & Escape key
  useEffect(() => {
    if (!open) return;

    // Save previous active element for restoration
    previousFocusRef.current = document.activeElement as HTMLElement;

    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    // Focus first element or fallback to dialog container
    const focusableElements = Array.from(dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)).filter(el => !el.hasAttribute('disabled'));
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      dialogNode.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)).filter(el => !el.hasAttribute('disabled'));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === dialogNode) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || document.activeElement === dialogNode) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        try {
          previousFocusRef.current.focus();
        } catch (err) {
          // Ignore focus errors
        }
      }
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'relative w-full max-w-lg bg-card border border-border/40 rounded-3xl p-6 sm:p-7 neu-raised-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 focus:outline-none',
          className
        )}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4.5 right-4.5 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all neu-raised active:shadow-inset cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {(title || description) && (
          <div className="mb-5 pr-8">
            {title && (
              <h2 id="dialog-title" className="text-xl font-heading font-semibold text-foreground tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-description" className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6', className)} {...props} />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-heading font-semibold leading-none tracking-tight text-foreground', className)} {...props} />
);

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);
