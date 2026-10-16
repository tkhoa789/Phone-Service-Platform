import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, PlusCircle, Package } from 'lucide-react';
import { productService } from '@/services/productService';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddRepairPart } from '../api/useRepairs';
import { useThemeStore } from '@/stores/themeStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { operationalNotificationService } from '@/services/operationalNotificationService';

interface AddRepairPartModalProps {
  repairTicketId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRepairPartModal: React.FC<AddRepairPartModalProps> = ({
  repairTicketId,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  
  const addPartMutation = useAddRepairPart();

  const { data: variantsData, isLoading } = useQuery({
    queryKey: ['repair-variants-all'],
    queryFn: () => productService.getAllVariants()
  });

  const variants = variantsData || [];

  const handleSelectVariant = (id: string) => {
    setSelectedVariantId(id);
    const selected = variants.find(v => v.id === id);
    if (selected) {
      setUnitPrice(selected.salePrice || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) return;

    addPartMutation.mutate({
      repairTicketId,
      productVariantId: selectedVariantId,
      quantity,
      unitPrice,
    }, {
      onSuccess: () => {
        toast.success(isVi ? 'Thêm linh kiện thành công!' : 'Part added successfully!');
        const selected = variants.find(v => v.id === selectedVariantId);
        const partName = selected ? `${selected.name} (${selected.sku})` : 'Linh kiện thay thế';

        operationalNotificationService.dispatchNotification({
          title: `📋 Yêu cầu cấp linh kiện sửa chữa: ${partName}`,
          content: `KTV đã đăng ký sử dụng ${quantity}x ${partName} cho phiếu sửa chữa. Thủ kho chuẩn bị linh kiện chuyển tới bàn kỹ thuật.`,
          type: 'PART_REQUESTED',
          targetRoles: ['Inventory'],
          link: '/inventory',
        });

        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || (isVi ? 'Không thể thêm linh kiện!' : 'Failed to add part!'));
      }
    });
  };

  const totalCost = quantity * unitPrice;

  return (
    <Dialog 
      open 
      onOpenChange={onClose} 
      title={isVi ? 'Thêm Linh Kiện Sửa Chữa' : 'Add Replacement Part'}
    >
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs">{isVi ? 'Đang tải danh mục linh kiện...' : 'Loading parts catalog...'}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {isVi ? 'Chọn Linh Kiện Thay Thế *' : 'Select Replacement Part *'}
            </label>
            <SearchableSelect
              options={variants.map(v => ({ 
                value: v.id, 
                label: `${v.name} (${v.sku}) - ${formatCurrency(v.salePrice || 0)}` 
              }))}
              value={selectedVariantId}
              onChange={handleSelectVariant}
              placeholder={isVi ? 'Tìm linh kiện theo tên, SKU...' : 'Search by part name or SKU...'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {isVi ? 'Số Lượng' : 'Quantity'}
              </label>
              <Input
                type="number"
                min="1"
                value={quantity.toString()}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {isVi ? 'Đơn Giá Linh Kiện (₫)' : 'Unit Price (₫)'}
              </label>
              <Input
                type="number"
                min="0"
                value={unitPrice.toString()}
                onChange={e => setUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                required
              />
            </div>
          </div>

          {selectedVariantId && (
            <div className="p-3 rounded-xl neu-inset bg-card flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                {isVi ? 'Tổng tiền linh kiện dự kiến:' : 'Subtotal:'}
              </span>
              <span className="font-mono font-bold text-primary text-sm">
                {formatCurrency(totalCost)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button type="button" variant="secondary" onClick={onClose} className="neu-raised">
              {isVi ? 'Hủy' : 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!selectedVariantId || addPartMutation.isPending}
              className="shadow-md"
            >
              {addPartMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {isVi ? 'Đang xuất...' : 'Issuing...'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  {isVi ? 'Xuất Linh Kiện' : 'Add Part'}
                </span>
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};
