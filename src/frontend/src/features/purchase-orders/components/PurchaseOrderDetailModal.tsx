import React, { useState } from 'react';
import { X, Edit, Trash2, CheckCircle2, Ban, Package, Store, Clock } from 'lucide-react';
import { usePurchaseOrder, useCancelPurchaseOrder, useDeletePurchaseOrder } from '../api/queries';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { CompletePOModal } from './CompletePOModal';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '../../../utils/formatCurrency';

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  onEdit: () => void;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  isOpen,
  onClose,
  poId,
  onEdit
}) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;

  const { data: po, isLoading } = usePurchaseOrder(poId);
  const cancelMutation = useCancelPurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();

  const [showCompleteModal, setShowCompleteModal] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!po) return;
    if (!window.confirm('Bạn có chắc muốn hủy phiếu nhập này?')) return;
    try {
      await cancelMutation.mutateAsync({ id: po.id, rowVersion: po.rowVersion });
      toast.success('Hủy phiếu nhập thành công');
    } catch (e: any) {
      if (e?.response?.status === 409) {
        toast.error('Lỗi Concurrency (409): Phiếu nhập đã bị thay đổi bởi người khác!');
      } else {
        toast.error(e.response?.data?.message || 'Lỗi hủy phiếu');
      }
    }
  };

  const handleDelete = async () => {
    if (!po) return;
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn phiếu này? (Chỉ áp dụng cho phiếu Nháp)')) return;
    try {
      await deleteMutation.mutateAsync({ id: po.id, rowVersion: po.rowVersion });
      toast.success('Xóa phiếu thành công');
      onClose();
    } catch (e: any) {
      if (e?.response?.status === 409) {
        toast.error('Lỗi Concurrency (409): Phiếu nhập đã bị thay đổi bởi người khác!');
      } else {
        toast.error(e.response?.data?.message || 'Lỗi xóa phiếu');
      }
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl rounded-3xl shadow-md border border-border/50 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">
              Chi Tiết Phiếu Nhập
            </h2>
            {po && (
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                po.status === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                po.status === 'Confirmed' ? 'bg-primary/10 text-blue-700 border-blue-200' :
                po.status === 'Received' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                'bg-rose-100 text-rose-700 border-rose-200'
              }`}>
                {po.status}
              </span>
            )}
          </div>
          <Button variant="danger" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : !po ? (
            <div className="text-center py-10 text-slate-500">Không tìm thấy dữ liệu.</div>
          ) : (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-500 font-bold mb-1">Mã Phiếu</div>
                  <div className="font-mono font-bold text-slate-800">{po.code}</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-500 font-bold mb-1">Tổng Tiền</div>
                  <div className="font-mono font-bold text-primary">{formatCurrency(po.totalAmount)}</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1"><Package className="w-3 h-3"/> Nhà Cung Cấp</div>
                  <div className="font-medium text-slate-800">{po.supplierName}</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1"><Store className="w-3 h-3"/> Kho Nhập</div>
                  <div className="font-medium text-slate-800">{po.warehouseName}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Danh Sách Sản Phẩm</h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="px-4 py-3 font-bold">Mặt Hàng</th>
                        <th className="px-4 py-3 font-bold">Mã SKU</th>
                        <th className="px-4 py-3 font-bold">Số Lượng</th>
                        <th className="px-4 py-3 font-bold">Đơn Giá</th>
                        <th className="px-4 py-3 font-bold">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {po.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-medium">{item.variantName}</td>
                          <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 font-mono text-primary font-bold">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
          <div className="flex gap-2">
            {po?.status === 'Draft' && (
              <Button variant="outline"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Xóa Phiếu
              </Button>
            )}
            {(po?.status === 'Draft' || po?.status === 'Confirmed') && (
              <Button variant="outline"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1 bg-white"
              >
                <Ban className="w-4 h-4" /> Hủy Phiếu
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 bg-card border border-slate-300 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-xs"
            >
              Đóng
            </Button>
            {po?.status === 'Draft' && (
              <Button variant="outline"
                onClick={onEdit}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Chỉnh Sửa
              </Button>
            )}
            {(po?.status === 'Draft' || po?.status === 'Confirmed') && (
              <Button variant="outline"
                onClick={() => setShowCompleteModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Nhận Hàng (Hoàn Tất)
              </Button>
            )}
          </div>
        </div>

      </div>

      {showCompleteModal && po && (
        <CompletePOModal 
          poId={po.id} 
          onClose={() => setShowCompleteModal(false)}
          onSuccess={() => {
            setShowCompleteModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
