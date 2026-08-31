import React, { useState, useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';

interface StockAuditModalProps {
  inventoryItem: { variantName: string; sku: string; quantity: number };
  onClose: () => void;
  onSuccess: (newQty: number) => void;
}

export const StockAuditModal: React.FC<StockAuditModalProps> = ({
  inventoryItem,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const [actualQuantity, setActualQuantity] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // pre-fill with current system quantity to make adjustment easier
    setActualQuantity(inventoryItem.quantity);
  }, [inventoryItem]);

  const diff = typeof actualQuantity === 'number' ? actualQuantity - inventoryItem.quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualQuantity === '' || actualQuantity < 0) {
      toast.error(language === 'vi' ? 'Số lượng thực tế không hợp lệ!' : 'Actual stock is invalid!');
      return;
    }
    
    setLoading(true);

    // MOCK BEHAVIOR PRESERVED AS REQUIRED BY PC-09B INVARIANT
    setTimeout(() => {
      setLoading(false);
      toast.success(
        language === 'vi'
          ? `Đã cân bằng tồn kho [${inventoryItem.sku}]: ${inventoryItem.quantity} ➔ ${actualQuantity} (${diff >= 0 ? '+' : ''}${diff})!`
          : `Reconciled stock [${inventoryItem.sku}]: ${inventoryItem.quantity} ➔ ${actualQuantity}!`,
        { icon: '⚖️' }
      );
      onSuccess(actualQuantity);
      onClose();
    }, 400);
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={language === 'vi' ? 'Kiểm Kê Nhanh (Quick Audit)' : 'Quick Stock Audit'}
      description={language === 'vi' ? 'Cập nhật số lượng thực tế trong kho cho một sản phẩm cụ thể.' : 'Reconcile actual physical stock for a single item.'}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        <Card className="p-4 bg-slate-50 border-slate-200">
          <div className="text-xs font-mono font-bold text-primary mb-1">{inventoryItem.sku}</div>
          <h4 className="font-medium text-sm text-slate-800 mb-2">{inventoryItem.variantName}</h4>
          <p className="text-sm text-slate-500">
            {language === 'vi' ? 'Tồn kho trên hệ thống:' : 'System Stock:'} <strong className="text-slate-800">{inventoryItem.quantity}</strong>
          </p>
        </Card>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            {language === 'vi' ? 'Số lượng kiểm đếm thực tế trong kết kho *' : 'Actual Physical Count *'}
          </label>
          <Input
            type="number"
            value={actualQuantity}
            onChange={(e: any) => setActualQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            className="font-mono font-bold text-primary text-lg"
            required
            min={0}
          />
          {typeof actualQuantity === 'number' && diff !== 0 && (
            <p className={`text-xs mt-2 font-medium ${diff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {language === 'vi' ? 'Độ lệch:' : 'Variance:'} {diff > 0 ? '+' : ''}{diff}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={loading} ><ClipboardCheck className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Xác Nhận Cân Bằng' : 'Confirm Reconcile'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
