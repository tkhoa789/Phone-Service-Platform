import React, { useState } from 'react';
import { ArrowRightLeft, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { BatchProductSelectModal, type BatchSelectedItem } from './BatchProductSelectModal';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';
import { inventoryService } from '../services/inventory.service';

interface WarehouseTransferModalProps {
  branches: Array<{ id: string; name: string }>;
  inventoryList: Array<{ variantName: string; sku: string; quantity: number; productVariantId?: string; warehouseId?: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const WarehouseTransferModal: React.FC<WarehouseTransferModalProps> = ({
  branches,
  inventoryList,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  
  const [fromBranchId, setFromBranchId] = useState(branches[0]?.id || '');
  const [toBranchId, setToBranchId] = useState(branches[1]?.id || branches[0]?.id || '');
  const [selectedItems, setSelectedItems] = useState<BatchSelectedItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showBatchSelect, setShowBatchSelect] = useState(false);

  // Available items for the selected source warehouse with quantity > 0
  const availableInventoryList = inventoryList.filter(
    i => (!i.warehouseId || i.warehouseId === fromBranchId) && i.quantity > 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBranchId === toBranchId) {
      toast.error(language === 'vi' ? 'Kho nguồn và Kho đích không được trùng nhau!' : 'Source and destination cannot be the same!');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error(language === 'vi' ? 'Vui lòng chọn ít nhất 1 sản phẩm luân chuyển!' : 'Please select at least 1 item!');
      return;
    }

    setLoading(true);
    try {
      const code = `TR-${Date.now().toString().slice(-6)}`;
      const items = selectedItems.map(item => ({
        productVariantId: item.productVariantId || '',
        quantity: item.transferQuantity,
      }));

      await inventoryService.createTransfer({
        fromWarehouseId: fromBranchId,
        toWarehouseId: toBranchId,
        code,
        items,
      });

      const totalUnits = selectedItems.reduce((acc, curr) => acc + curr.transferQuantity, 0);
      toast.success(
        language === 'vi'
          ? `Đã tạo Phiếu Luân Chuyển [${code}] (${selectedItems.length} mặt hàng, ${totalUnits} sản phẩm)!`
          : `Created stock transfer [${code}] for ${selectedItems.length} items (${totalUnits} units)!`,
        { icon: '🚚' }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (language === 'vi' ? 'Tạo phiếu điều chuyển thất bại.' : 'Failed to create transfer.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const removeSelectedItem = (sku: string) => {
    setSelectedItems(prev => prev.filter(i => i.sku !== sku));
  };

  return (
    <>
      <Dialog
        open={true}
        onOpenChange={(v) => { if (!v) onClose(); }}
        title={language === 'vi' ? 'Luân Chuyển Nội Bộ (Inter-Branch Transfer)' : 'Inter-Branch Transfer'}
        description={language === 'vi' ? 'Tạo phiếu điều chuyển hàng hóa giữa các kho chi nhánh' : 'Transfer inventory between branches'}
        className="max-w-2xl"
      >
        <Alert variant="default" className="mb-4">
          <ShieldCheck className="w-4 h-4 mr-2" />
          {language === 'vi'
            ? 'Tài khoản của bạn có quyền tự động duyệt phiếu luân chuyển nội bộ.'
            : 'Your account has auto-approve permissions for internal transfers.'}
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-elevated/70 border-border/40">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                {language === 'vi' ? 'Kho Xuất Hàng (Kho Nguồn) *' : 'Source Warehouse *'}
              </label>
              <select
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full bg-card text-foreground border border-border/40 shadow-inset rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1">
                {language === 'vi' ? 'Kho Nhận Hàng (Kho Đích) *' : 'Destination Warehouse *'}
              </label>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full bg-card text-foreground border border-border/40 shadow-inset rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                {language === 'vi' ? 'Danh sách sản phẩm cần chuyển' : 'Items to transfer'}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBatchSelect(true)}
              >
                {language === 'vi' ? '+ Thêm sản phẩm' : '+ Add Products'}
              </Button>
            </div>

            <div className="border border-border/40 rounded-xl overflow-hidden bg-card max-h-60 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-elevated/70 border-b border-border/40 text-muted-foreground font-medium sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">{language === 'vi' ? 'Sản Phẩm' : 'Product'}</th>
                    <th className="p-3 text-center">{language === 'vi' ? 'SL Chuyển' : 'Transfer Qty'}</th>
                    <th className="p-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        {language === 'vi' ? 'Chưa có sản phẩm nào được chọn.' : 'No items selected.'}
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item, idx) => (
                      <tr key={`${item.sku}-${idx}`} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-center text-muted-foreground">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-mono text-xs text-primary font-bold mb-0.5">{item.sku}</div>
                          <div className="text-sm font-medium text-foreground">{item.variantName}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded bg-primary/10 text-primary font-bold">
                            {item.transferQuantity}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeSelectedItem(item.sku)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading || selectedItems.length === 0} ><ArrowRightLeft className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Tạo Phiếu & Bàn Giao' : 'Create Transfer'}
            </Button>
          </div>
        </form>
      </Dialog>

      {showBatchSelect && (
        <BatchProductSelectModal
          inventoryList={availableInventoryList}
          initialSelectedItems={selectedItems}
          onClose={() => setShowBatchSelect(false)}
          onConfirm={(items) => {
            setSelectedItems(items);
            setShowBatchSelect(false);
          }}
        />
      )}
    </>
  );
};
