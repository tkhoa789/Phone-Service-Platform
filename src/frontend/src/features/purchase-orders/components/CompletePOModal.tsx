import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, CheckCircle2, AlertCircle, ScanLine, Trash2 } from 'lucide-react';
import { useCompletePurchaseOrder, usePurchaseOrder } from '../api/queries';
import { completePurchaseOrderSchema, type CompletePurchaseOrderFormValues } from '../schemas/purchaseOrderSchema';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CompletePOModalProps {
  poId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompletePOModal: React.FC<CompletePOModalProps> = ({ poId, onClose, onSuccess }) => {
  const { language } = useThemeStore();
  const { data: po } = usePurchaseOrder(poId);
  const completeMutation = useCompletePurchaseOrder();

  // For simplicity, we assume we need to enter IMEIs for ALL items in the UI.
  // In a real scenario, we might check if item.category === 'MOBILE'.
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompletePurchaseOrderFormValues>({
    resolver: zodResolver(completePurchaseOrderSchema),
    defaultValues: {
      variantImeis: po?.items.map(i => ({
        productVariantId: i.productVariantId,
        imeis: [] as string[]
      })) || []
    }
  });

  const onSubmit = async (data: CompletePurchaseOrderFormValues) => {
    // Validate quantities
    let valid = true;
    po?.items.forEach((item, idx) => {
      const enteredImeis = data.variantImeis[idx]?.imeis || [];
      if (enteredImeis.length !== item.quantity) {
        toast.error(`Sản phẩm ${item.variantName} yêu cầu ${item.quantity} IMEI, nhưng mới nhập ${enteredImeis.length}`);
        valid = false;
      }
      
      // Check duplicates within the same item
      const uniqueImeis = new Set(enteredImeis);
      if (uniqueImeis.size !== enteredImeis.length) {
        toast.error(`Có IMEI trùng lặp trong sản phẩm ${item.variantName}`);
        valid = false;
      }
    });

    if (!valid) return;

    try {
      await completeMutation.mutateAsync({ id: poId, data: { ...data, id: poId } as any });
      toast.success('Hoàn tất nhập kho thành công!');
      onSuccess();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error('Lỗi Concurrency: Phiếu nhập đã được người khác xử lý!');
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Lỗi hoàn tất phiếu nhập');
      }
    }
  };

  if (!po) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-[var(--neu-bg-base)] w-full max-w-3xl rounded-3xl shadow-[var(--neu-shadow-outer)] border border-[var(--neu-border)] flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-[var(--neu-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--neu-text-title)]">Nhận Hàng (Complete PO)</h2>
              <p className="text-xs text-[var(--neu-text-sub)]">Quét IMEI để nhập kho ({po.code})</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Lưu ý: Hành động này sẽ cộng Tồn kho, tăng Công nợ nhà cung cấp và KHÔNG THỂ HOÀN TÁC.</p>
          </div>

          <form id="complete-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {po.items.map((item, idx) => (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800">{item.variantName}</h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    Cần nhập: {item.quantity} IMEI
                  </span>
                </div>

                <Controller
                  control={control}
                  name={`variantImeis.${idx}.imeis`}
                  render={({ field: { value, onChange } }) => (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Quét mã IMEI và nhấn Enter..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (!val) return;
                                if (value.includes(val)) {
                                  toast.error('IMEI này đã được quét!');
                                  return;
                                }
                                onChange([...value, val]);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {value.map((imei, iIdx) => (
                            <span key={iIdx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono">
                              {imei}
                              <Button variant="outline"
                                type="button"
                                onClick={() => onChange(value.filter((_, i) => i !== iIdx))}
                                className="text-slate-400 hover:text-rose-500"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500">Đã nhập: {value.length}/{item.quantity}</p>
                    </div>
                  )}
                />
              </div>
            ))}
          </form>
        </div>

        <div className="p-6 border-t border-[var(--neu-border)] bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="outline"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 bg-[var(--neu-bg-base)] border border-slate-300 shadow-[var(--neu-shadow-button)] hover:scale-[1.02] active:scale-95 transition-all text-xs"
          >
            Đóng
          </Button>
          <Button variant="outline"
            type="submit"
            form="complete-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-[var(--neu-shadow-button)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Xác Nhận & Hoàn Tất
          </Button>
        </div>

      </div>
    </div>
  );
};
