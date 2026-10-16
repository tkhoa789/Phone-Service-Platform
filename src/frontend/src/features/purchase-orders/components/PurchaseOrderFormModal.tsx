import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, Package, Search } from 'lucide-react';
import { useCreatePurchaseOrder, useUpdatePurchaseOrder, usePurchaseOrder } from '../api/queries';
import { createPurchaseOrderSchema, type CreatePurchaseOrderFormValues } from '../schemas/purchaseOrderSchema';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useProducts, useProductVariants } from '../../products/hooks/useProducts';
import toast from 'react-hot-toast';
import type { PurchaseOrderItemDto } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ProductDto, ProductVariantDto } from '../../../types/api.types';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId?: string | null;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  isOpen,
  onClose,
  poId
}) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;
  const isEdit = !!poId;

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { data: poDetail, isLoading: isLoadingDetail } = usePurchaseOrder(poId || '');

  const { data: suppliers = [] } = useSuppliers({ page: 1, pageSize: 100 });
  const { data: warehouses = [] } = useWarehouses({ page: 1, pageSize: 100 });
  const { data: productsResult } = useProducts({ page: 1, pageSize: 500 });
  const products = Array.isArray(productsResult) ? productsResult : ((productsResult as any)?.items || []);

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { data: variants = [] } = useProductVariants(selectedProductId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreatePurchaseOrderFormValues>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      warehouseId: '',
      code: `PO-${Date.now().toString().slice(-6)}`,
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const totalAmount = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  useEffect(() => {
    if (isEdit && poDetail) {
      reset({
        supplierId: poDetail.supplierId,
        warehouseId: poDetail.warehouseId,
        code: poDetail.code,
        items: poDetail.items.map(i => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          _name: i.variantName // internal tracking
        })) as any
      });
    }
  }, [isEdit, poDetail, reset]);

  const handleAddVariant = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    // Check if already exists
    const exists = fields.findIndex(f => f.productVariantId === variantId);
    if (exists >= 0) {
      toast.error('Sản phẩm này đã có trong danh sách!');
      return;
    }

    append({
      productVariantId: variant.id,
      quantity: 1,
      unitPrice: variant.costPrice || 0,
    });
  };

  const onSubmit = async (data: CreatePurchaseOrderFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: poId!,
          data: {
            ...data,
            id: poId!,
            rowVersion: poDetail?.rowVersion || ''
          } as import("../types").UpdatePurchaseOrderCommand
        });
        toast.success('Cập nhật phiếu nhập kho thành công!');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Tạo phiếu nhập kho thành công!');
      }
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error('Lỗi Concurrency (409): Phiếu nhập đã bị thay đổi bởi người khác!');
      } else if (error?.response?.data?.message) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      } else {
        toast.error(isEdit ? 'Lỗi cập nhật phiếu nhập' : 'Lỗi tạo phiếu nhập');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl rounded-3xl shadow-md border border-border/50 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isEdit ? 'Cập Nhật Phiếu Nhập Kho' : 'Tạo Phiếu Nhập Kho'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEdit ? 'Chỉnh sửa thông tin đơn hàng nháp' : 'Nhập hàng mới từ nhà cung cấp'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {(isEdit && isLoadingDetail) ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <form id="po-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">Mã Phiếu</label>
                  <Input
                    {...register('code')}
                    disabled={isEdit}
                    className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground shadow-inner border border-border/50 bg-muted/20 focus:ring-2 focus:ring-blue-500/30 outline-none disabled:opacity-50"
                  />
                  {errors.code && <p className="text-rose-500 text-xs mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">Nhà Cung Cấp *</label>
                  <select
                    {...register('supplierId')}
                    className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground shadow-inner border border-border/50 bg-muted/20 focus:ring-2 focus:ring-blue-500/30 outline-none"
                  >
                    <option value="">-- Chọn Nhà Cung Cấp --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.supplierId && <p className="text-rose-500 text-xs mt-1">{errors.supplierId.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">Kho Nhập *</label>
                  <select
                    {...register('warehouseId')}
                    className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground shadow-inner border border-border/50 bg-muted/20 focus:ring-2 focus:ring-blue-500/30 outline-none"
                  >
                    <option value="">-- Chọn Kho --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  {errors.warehouseId && <p className="text-rose-500 text-xs mt-1">{errors.warehouseId.message}</p>}
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Chi tiết mặt hàng</h3>
                
                {/* Product Selector */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-card border border-border/50 rounded-2xl px-4 py-2.5 text-sm shadow-inner border border-border/50 bg-muted/20 outline-none"
                    >
                      <option value="">-- Chọn Sản Phẩm --</option>
                      {products.map((p: ProductDto) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <select
                      onChange={(e) => handleAddVariant(e.target.value)}
                      value=""
                      disabled={!selectedProductId}
                      className="w-full bg-card border border-border/50 rounded-2xl px-4 py-2.5 text-sm shadow-inner border border-border/50 bg-muted/20 outline-none disabled:opacity-50"
                    >
                      <option value="">-- Chọn Biến Thể để Thêm --</option>
                      {variants.map((v: ProductVariantDto) => <option key={v.id} value={v.id}>{v.sku || v.id}</option>)}
                    </select>
                  </div>
                </div>

                {errors.items && <p className="text-rose-500 text-xs mb-2">{errors.items.message}</p>}

                {/* Items Table */}
                <div className="bg-slate-50/50 rounded-2xl border border-border/50 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-4 py-3 font-bold text-slate-500">Mặt Hàng</th>
                        <th className="px-4 py-3 font-bold text-slate-500 w-32">Số Lượng</th>
                        <th className="px-4 py-3 font-bold text-slate-500 w-40">Đơn Giá</th>
                        <th className="px-4 py-3 font-bold text-slate-500 w-40">Thành Tiền</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--neu-border)]">
                      {fields.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có mặt hàng nào.</td></tr>
                      )}
                      {fields.map((field: Record<string, any>, index) => {
                        const qty = watch(`items.${index}.quantity`) || 0;
                        const price = watch(`items.${index}.unitPrice`) || 0;
                        const amount = qty * price;
                        return (
                          <tr key={field.id} className="bg-white">
                            <td className="px-4 py-3 font-medium">
                              {field._name || 'Biến thể đã chọn'}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-primary">
                              {amount.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="outline" type="button" onClick={() => remove(index)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100/50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs">Tổng Cộng:</td>
                        <td colSpan={2} className="px-4 py-3 font-mono text-lg text-blue-700">
                          {totalAmount.toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="outline"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 bg-card border border-slate-300 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-xs"
          >
            {tCommon.cancel}
          </Button>
          <Button variant="outline"
            type="submit"
            form="po-form"
            disabled={isSubmitting || (isEdit && isLoadingDetail)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {tCommon.save}
          </Button>
        </div>

      </div>
    </div>
  );
};
