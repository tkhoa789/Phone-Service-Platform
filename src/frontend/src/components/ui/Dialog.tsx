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
        onOpenChange(false);
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
  }, [open, onOpenChange]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'relative w-full max-w-lg bg-[var(--neu-bg-base)] border border-[var(--neu-border)] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-none',
          className
        )}
      >
        {!hideCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {(title || description) && (
          <div className="mb-6 pr-8">
            {title && (
              <h2 id="dialog-title" className="text-xl font-heading font-bold text-[var(--neu-text-title)]">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-description" className="text-sm text-[var(--neu-text-sub)] mt-1">
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
