import React from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { 
  Keyboard, 
  Barcode, 
  Users, 
  Tag, 
  CreditCard, 
  CheckCircle2, 
  X, 
  Sparkles
} from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';

interface PosShortcutModalProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  descriptionVi: string;
  descriptionEn: string;
  icon: React.ElementType;
  badgeColor?: string;
  category: 'catalog' | 'checkout' | 'navigation';
}

const SHORTCUTS: ShortcutItem[] = [
  {
    key: 'F1',
    descriptionVi: 'Mở / Đóng bảng trợ giúp phím tắt này',
    descriptionEn: 'Open / Close this keyboard shortcuts guide',
    icon: Keyboard,
    category: 'navigation',
  },
  {
    key: 'F2',
    descriptionVi: 'Focus ô Barcode / Quét mã vạch sản phẩm (Enter để thêm vào giỏ)',
    descriptionEn: 'Focus Barcode input (Scan & Enter to add to cart)',
    icon: Barcode,
    badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    category: 'catalog',
  },
  {
    key: 'F3',
    descriptionVi: 'Focus ô chọn khách hàng (SĐT / Họ tên)',
    descriptionEn: 'Focus customer search select (Phone / Name)',
    icon: Users,
    badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    category: 'catalog',
  },
  {
    key: 'F4',
    descriptionVi: 'Focus ô nhập mã khuyến mãi (Voucher)',
    descriptionEn: 'Focus discount voucher code input',
    icon: Tag,
    badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    category: 'catalog',
  },
  {
    key: 'F9',
    descriptionVi: 'Mở cửa sổ Thanh toán / Xác nhận thanh toán & In hóa đơn K80',
    descriptionEn: 'Open Payment Modal / Confirm & Print K80 Receipt',
    icon: CreditCard,
    badgeColor: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30 font-bold',
    category: 'checkout',
  },
  {
    key: 'Alt + 0',
    descriptionVi: '[Trong popup thanh toán] Khách trả đúng số tiền cần thanh toán',
    descriptionEn: '[Inside payment modal] Tender exact total amount',
    icon: CheckCircle2,
    category: 'checkout',
  },
  {
    key: 'Alt + 1/2/5',
    descriptionVi: '[Trong popup thanh toán] Chọn nhanh 100k, 200k, 500k tiền mặt',
    descriptionEn: '[Inside payment modal] Quick select 100k, 200k, 500k cash',
    icon: Sparkles,
    category: 'checkout',
  },
  {
    key: 'Esc',
    descriptionVi: 'Đóng modal hiện tại / Hủy trạng thái chọn',
    descriptionEn: 'Close active modal / Cancel selection',
    icon: X,
    category: 'navigation',
  },
];

export const PosShortcutModal: React.FC<PosShortcutModalProps> = ({ open, onClose }) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={isVi ? 'Bảng Phím Tắt Thu Ngân (POS Hotkeys)' : 'POS Cashier Keyboard Shortcuts'}
      description={
        isVi
          ? 'Tối ưu tốc độ bán hàng 100% bằng bàn phím – không cần dùng chuột khi quầy đông khách.'
          : 'High-speed keyboard-only retail workflow – no mouse required during rush hours.'
      }
      className="max-w-2xl"
    >
      <div className="space-y-6 pt-3">
        {/* Banner Quick Tip */}
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isVi ? (
              <>
                <strong className="text-foreground">Mẹo thao tác 3 bước:</strong> Bấm <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">F2</kbd> quét mã vạch ➔ <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">F9</kbd> mở thanh toán ➔ <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">F9</kbd> hoặc <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">Enter</kbd> in bill K80 ngay lập tức!
              </>
            ) : (
              <>
                <strong className="text-foreground">3-Step Fast Workflow:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">F2</kbd> scan barcode ➔ <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">F9</kbd> open checkout ➔ <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">F9</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px] text-foreground font-bold">Enter</kbd> print K80 receipt instantly!
              </>
            )}
          </p>
        </div>

        {/* Shortcuts Table */}
        <div className="space-y-2">
          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">
                    {isVi ? item.descriptionVi : item.descriptionEn}
                  </span>
                </div>
                <kbd className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-card border border-border/70 shadow-sm text-primary shrink-0 tracking-wider">
                  {item.key}
                </kbd>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-border/40">
          <Button variant="outline" onClick={onClose} className="px-5">
            {isVi ? 'Đóng (Esc)' : 'Close (Esc)'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
