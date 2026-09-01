import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Wrench, PlusCircle } from 'lucide-react';
import { productService } from '@/services/productService';
import type { ProductVariantDto } from '@/types/api.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddRepairPart } from '../api/useRepairs';
import { useThemeStore } from '@/stores/themeStore';

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
        toast.success(language === 'vi' ? 'Thêm linh kiện thành công!' : 'Part added successfully!');
        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || (language === 'vi' ? 'Không thể thêm linh kiện!' : 'Failed to add part!'));
      }
    });
  };

  return (
    <Dialog open onOpenChange={onClose} title={language === 'vi' ? 'Th�m Linh Ki?n S?a Ch?a' : 'Add Repair Part'}>
      
        
          
        

        {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4" />
          <p>{language === 'vi' ? 'Đang tải danh sách linh kiện...' : 'Loading parts list...'}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'vi' ? 'Chọn Linh Kiện' : 'Select Part'}
            </label>
            <SearchableSelect
              options={variants.map(v => ({ value: v.id, label: `${v.name} (${v.sku})` }))}
              value={selectedVariantId}
              onChange={handleSelectVariant}
              placeholder={language === 'vi' ? 'Tìm theo tên hoặc SKU...' : 'Search by name or SKU...'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'vi' ? 'Số Lượng' : 'Quantity'}
              </label>
              <Input
                type="number"
                min="1"
                value={quantity.toString()}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'vi' ? 'Đơn Giá' : 'Unit Price'}
              </label>
              <Input
                type="number"
                min="0"
                value={unitPrice.toString()}
                onChange={e => setUnitPrice(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" disabled={!selectedVariantId || addPartMutation.isPending}>
              {addPartMutation.isPending ? (
                 <span className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                   {language === 'vi' ? 'Đang thêm...' : 'Adding...'}
                 </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  {language === 'vi' ? 'Thêm Linh Kiện' : 'Add Part'}
                </span>
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};







