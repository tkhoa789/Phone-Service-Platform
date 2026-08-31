import React, { useState } from 'react';
import { ArrowRightLeft, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { BatchProductSelectModal, type BatchSelectedItem } from './BatchProductSelectModal';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';

interface WarehouseTransferModalProps {
  branches: Array<{ id: string; name: string }>;
  inventoryList: Array<{ variantName: string; sku: string; quantity: number }>;
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
  const [toBranchId, setToBranchId] = useState(branches[1]?.id || '');
  const [selectedItems, setSelectedItems] = useState<BatchSelectedItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showBatchSelect, setShowBatchSelect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    // MOCK BEHAVIOR PRESERVED AS REQUIRED BY PC-09B INVARIANT
    setTimeout(() => {
      setLoading(false);
      const totalUnits = selectedItems.reduce((acc, curr) => acc + curr.transferQuantity, 0);
      toast.success(
        language === 'vi'
          ? `Đã tạo Phiếu Luân Chuyển ${selectedItems.length} mặt hàng (${totalUnits} sản phẩm) & Bàn giao Shipper!`
          : `Created stock transfer for ${selectedItems.length} items (${totalUnits} units)!`,
        { icon: '🚚' }
      );
      onSuccess();
      onClose();
    }, 800);
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
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border-slate-200">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                {language === 'vi' ? 'Kho Xuất Hàng (Kho Nguồn) *' : 'Source Warehouse *'}
              </label>
              <select
                value={fromBranchId}
                onChange={(e: any) => setFromBranchId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                onChange={(e: any) => setToBranchId(e.target.value)}
                className="w-full bg-white border border-primary/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">
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

            <div className="border border-slate-200 rounded-md overflow-hidden bg-white max-h-60 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">{language === 'vi' ? 'Sản Phẩm' : 'Product'}</th>
                    <th className="p-3 text-center">{language === 'vi' ? 'SL Chuyển' : 'Transfer Qty'}</th>
                    <th className="p-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        {language === 'vi' ? 'Chưa có sản phẩm nào được chọn.' : 'No items selected.'}
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item, idx) => (
                      <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-mono text-xs text-primary font-bold mb-0.5">{item.sku}</div>
                          <div className="text-sm font-medium text-slate-800">{item.variantName}</div>
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
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
          inventoryList={inventoryList}
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
