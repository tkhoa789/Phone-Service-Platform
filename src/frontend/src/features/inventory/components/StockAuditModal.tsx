import React, { useState, useEffect } from 'react';
import { ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { inventoryService } from '../services/inventory.service';
import { inventorySandboxService } from '../services/inventorySandboxService';

interface StockAuditModalProps {
  inventoryItem: { variantName: string; sku: string; quantity: number; productVariantId: string; warehouseId: string };
  onClose: () => void;
  onSuccess: (newQty: number) => void;
}

export const StockAuditModal: React.FC<StockAuditModalProps> = ({
  inventoryItem,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const [actualQuantity, setActualQuantity] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // pre-fill with current system quantity to make adjustment easier
    setActualQuantity(inventoryItem.quantity);
  }, [inventoryItem]);

  const diff = typeof actualQuantity === 'number' ? actualQuantity - inventoryItem.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualQuantity === '' || actualQuantity < 0) {
      toast.error(language === 'vi' ? 'Số lượng thực tế không hợp lệ!' : 'Actual stock is invalid!');
      return;
    }

    if (diff === 0) {
      toast(
        language === 'vi'
          ? 'Số lượng thực tế khớp với tồn kho hệ thống, không cần điều chỉnh.'
          : 'Physical stock matches system stock, no change needed.',
        { icon: 'ℹ️' }
      );
      onClose();
      return;
    }
    
    // Check if running in Sandbox mode or on demo item
    const isSandbox =
      window.location.search.includes('mode=training') ||
      window.location.search.includes('sandbox=true') ||
      inventoryItem.sku?.includes('DEMO') ||
      inventoryItem.sku?.startsWith('BAT-IP15PM') ||
      inventoryItem.productVariantId?.includes('demo');

    if (isSandbox) {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      inventorySandboxService.auditItem(inventoryItem.sku, Number(actualQuantity));
      toast.success(
        language === 'vi'
          ? `[Sandbox] Đã cân bằng kiểm kho [${inventoryItem.sku}]: ${inventoryItem.quantity} ➔ ${actualQuantity} (${diff > 0 ? '+' : ''}${diff})!`
          : `[Sandbox] Reconciled stock for [${inventoryItem.sku}]: ${inventoryItem.quantity} ➔ ${actualQuantity}!`,
        { icon: '⚖️' }
      );
      onSuccess(Number(actualQuantity));
      onClose();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const code = `STK-AUD-${Date.now().toString().slice(-6)}`;
      const stockTakeId = await inventoryService.createStockTake({
        warehouseId: inventoryItem.warehouseId,
        code,
        items: [
          {
            productVariantId: inventoryItem.productVariantId,
            actualQuantity: Number(actualQuantity),
          },
        ],
      });

      await inventoryService.startStockTake(stockTakeId);
      await inventoryService.completeStockTake(stockTakeId);

      toast.success(
        language === 'vi'
          ? `Đã tạo & hoàn tất Phiếu Kiểm Kê [${code}]. Tồn kho [${inventoryItem.sku}]: ${inventoryItem.quantity} ➔ ${actualQuantity} (${diff > 0 ? '+' : ''}${diff})!`
          : `Reconciled stock via [${code}] for [${inventoryItem.sku}]: ${inventoryItem.quantity} ➔ ${actualQuantity}!`,
        { icon: '⚖️' }
      );
      onSuccess(Number(actualQuantity));
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (language === 'vi' ? 'Cân bằng tồn kho thất bại.' : 'Failed to reconcile stock.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
        <Card className="p-4 bg-surface-elevated/70 border-border/40">
          <div className="text-xs font-mono font-bold text-primary mb-1">{inventoryItem.sku}</div>
          <h4 className="font-medium text-sm text-foreground mb-2">{inventoryItem.variantName}</h4>
          <p className="text-sm text-muted-foreground">
            {language === 'vi' ? 'Tồn kho trên hệ thống:' : 'System Stock:'} <strong className="text-foreground">{inventoryItem.quantity}</strong>
          </p>
        </Card>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            {language === 'vi' ? 'Số lượng kiểm đếm thực tế trong kết kho *' : 'Actual Physical Count *'}
          </label>
          <Input
            type="number"
            value={actualQuantity}
            onChange={(e) => setActualQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            className="font-mono font-bold text-primary text-lg"
            required
            min={0}
          />
          {typeof actualQuantity === 'number' && diff !== 0 && (
            <p className={`text-xs mt-2 font-medium ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {language === 'vi' ? 'Độ lệch:' : 'Variance:'} {diff > 0 ? '+' : ''}{diff}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/stock-take');
            }}
            className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
          >
            {language === 'vi' ? 'Mở trang Kiểm Kê Kho Toàn Diện' : 'Open Full Stock Take'}
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Xác Nhận Cân Bằng' : 'Confirm Reconcile'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
