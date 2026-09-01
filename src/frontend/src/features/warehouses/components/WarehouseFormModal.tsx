import React, { useEffect } from 'react';
import { X, Warehouse, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { createWarehouseSchema, updateWarehouseSchema, type CreateWarehouseFormValues, type UpdateWarehouseFormValues } from '../schemas/warehouse.schema';
import { useCreateWarehouse, useUpdateWarehouse } from '../hooks/useWarehouses';
import { useBranches } from '../../branches/hooks/useBranches';
import type { WarehouseDto } from '../types/warehouse.types';
import { Button } from '@/components/ui/Button';

interface WarehouseFormModalProps {
  warehouse?: WarehouseDto | null;
  onClose: () => void;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({ warehouse, onClose }) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;
  const isEditing = !!warehouse;

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();

  // We use any here because Create and Update have different schemas
  const {
    control,
    handleSubmit,
    reset,
    setError,
  } = useForm<any>({
    resolver: zodResolver(isEditing ? updateWarehouseSchema : createWarehouseSchema) as any,
    defaultValues: {
      branchId: '',
      code: '',
      name: '',
    }
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        branchId: warehouse.branchId,
        code: warehouse.code,
        name: warehouse.name,
      });
    }
  }, [warehouse, reset]);

  const onSubmit = async (data: import("../schemas/warehouse.schema").CreateWarehouseFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: warehouse.id,
          name: data.name
        });
      } else {
        await createMutation.mutateAsync({
          branchId: data.branchId,
          code: data.code,
          name: data.name,
        });
      }
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          const fieldKey = (key.charAt(0).toLowerCase() + key.slice(1));
          setError(fieldKey, {
            type: 'server',
            message: backendErrors[key][0]
          });
        });
      } else if (error?.response?.data?.message) {
         setError('code', { type: 'server', message: error.response.data.message });
      }
    }
  };

  const branchOptions = branches.map(b => ({
    value: b.id,
    label: b.name
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-400/20 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-indigo-500 border border-indigo-500/30">
              <Warehouse className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">
              {isEditing 
                ? (language === 'vi' ? 'Sửa Thông Tin Kho' : 'Edit Warehouse')
                : (language === 'vi' ? 'Thêm Kho Mới' : 'Add New Warehouse')}
            </h2>
          </div>
          <Button variant="outline"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-500/10 transition-colors cursor-pointer"
           disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <form id="warehouse-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {!isEditing && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">
                    {language === 'vi' ? 'Chi Nhánh Quản Lý *' : 'Branch *'}
                  </label>
                  <select
                    {...control.register('branchId')}
                    className="w-full bg-card border border-slate-300/40 rounded-2xl px-4 py-3 text-xs text-foreground shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    disabled={isLoadingBranches}
                  >
                    <option value="">{language === 'vi' ? '-- Chọn chi nhánh --' : '-- Select branch --'}</option>
                    {branchOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {control._formState.errors.branchId && (
                    <p className="text-xs text-rose-500 mt-1">{(control._formState.errors.branchId as any).message}</p>
                  )}
                </div>

                <ControlledInput
                  name="code"
                  control={control}
                  label={language === 'vi' ? 'Mã Kho' : 'Warehouse Code'}
                  placeholder="KHO_Q1"
                  rules={{ required: true }}
                />
              </>
            )}

            {isEditing && (
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-400/20 space-y-2 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{language === 'vi' ? 'Chi Nhánh Quản Lý:' : 'Branch:'}</span>
                  <span className="font-medium text-slate-300">{warehouse.branchName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{language === 'vi' ? 'Mã Kho:' : 'Code:'}</span>
                  <span className="font-medium font-mono text-slate-300">{warehouse.code}</span>
                </div>
                <p className="text-[10px] text-amber-500/80 italic text-right mt-1">
                  * {language === 'vi' ? 'Mã kho và chi nhánh không thể thay đổi.' : 'Code and branch cannot be changed.'}
                </p>
              </div>
            )}

            <ControlledInput
              name="name"
              control={control}
              label={language === 'vi' ? 'Tên Kho Hàng' : 'Warehouse Name'}
              placeholder={language === 'vi' ? 'Kho Quận 1...' : 'Warehouse Q1...'}
              rules={{ required: true }}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-400/20 bg-card flex justify-end gap-3">
          <Button variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl font-medium text-xs text-foreground bg-card border border-slate-400/30 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {tCommon.cancel}
          </Button>
          
          <Button variant="outline"
            type="submit"
            form="warehouse-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-white font-medium text-xs shadow-sm hover:scale-[1.02] active:scale-95 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-70"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting 
              ? tCommon.loading 
              : (isEditing ? tCommon.save : (language === 'vi' ? 'Thêm' : 'Add'))}
          </Button>
        </div>

      </div>
    </div>
  );
};
