import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy Bỏ',
  variant = 'warning',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-indigo-500" />;
    }
  };

  const getConfirmVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'success':
      case 'info':
      case 'warning':
      default:
        return 'primary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()} hideCloseButton={isLoading}>
      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-16 h-16 rounded-2xl bg-card shadow-inset border border-border/40 flex items-center justify-center mb-4">
          {getIcon()}
        </div>
        <h2 className="text-xl font-heading font-semibold text-foreground tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
        
        <div className="flex w-full gap-3 mt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelText}
          </Button>
          <Button variant={getConfirmVariant()} onClick={onConfirm} loading={isLoading} className="flex-1">
            {isLoading ? 'Đang xử lý...' : confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
