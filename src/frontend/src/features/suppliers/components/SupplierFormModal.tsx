import React, { useEffect } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { supplierSchema, type SupplierFormValues } from '../schemas/supplier.schema';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
import type { SupplierDto } from '../types/supplier.types';

// PC-03 Shared Components
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface SupplierFormModalProps {
  supplier?: SupplierDto | null;
  onClose: () => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  supplier,
  onClose
}) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;

  const isEditing = !!supplier;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setError,
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      code: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      debtAmount: 0,
      creditLimit: 500000000,
      paymentTermsDays: 30,
    }
  });

  useEffect(() => {
    if (supplier) {
      reset({
        code: supplier.code || '',
        name: supplier.name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        taxCode: supplier.taxCode || '',
        debtAmount: supplier.debtAmount || 0,
        creditLimit: supplier.creditLimit || 500000000,
        paymentTermsDays: supplier.paymentTermsDays || 30,
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: supplier.id,
          command: data
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          code: data.code || `NCC-${Date.now().toString().slice(-4)}`
        });
      }
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          const fieldKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof SupplierFormValues;
          setError(fieldKey, {
            type: 'server',
            message: backendErrors[key][0]
          });
        });
      }
    }
  };

  const title = isEditing 
    ? (language === 'vi' ? 'Cập Nhật Nhà Cung Cấp' : 'Edit Supplier')
    : (language === 'vi' ? 'Thêm Nhà Cung Cấp Mới' : 'Add New Supplier');

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title={title} className="max-w-2xl">
      <div className="py-4 overflow-y-auto max-h-[70vh]">
        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <ControlledInput
              name="name"
              control={control}
              label={language === 'vi' ? 'Tên Nhà Cung Cấp' : 'Supplier Name'}
              placeholder={language === 'vi' ? 'Nhập tên nhà cung cấp...' : 'Enter supplier name...'}
              rules={{ required: true }}
            />
          </div>

          <ControlledInput
            name="code"
            control={control}
            label={language === 'vi' ? 'Mã Code (Tự động nếu để trống)' : 'Supplier Code'}
            placeholder="NCC-..."
          />

          <ControlledInput
            name="phone"
            control={control}
            type="tel"
            label={language === 'vi' ? 'Số Điện Thoại' : 'Phone'}
            placeholder={language === 'vi' ? 'Ví dụ: 0912345678' : 'e.g. 0912345678'}
            rules={{ required: true }}
          />

          <ControlledInput
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder={language === 'vi' ? 'Nhập email...' : 'Enter email...'}
          />

          <ControlledInput
            name="taxCode"
            control={control}
            label={language === 'vi' ? 'Mã Số Thuế' : 'Tax Code'}
            placeholder={language === 'vi' ? 'Nhập mã số thuế...' : 'Enter tax code...'}
          />

          <div className="md:col-span-2">
            <ControlledInput
              name="address"
              control={control}
              label={language === 'vi' ? 'Địa Chỉ' : 'Address'}
              placeholder={language === 'vi' ? 'Nhập địa chỉ...' : 'Enter address...'}
            />
          </div>
          
          <ControlledInput
            name="creditLimit"
            control={control}
            type="number"
            label={language === 'vi' ? 'Hạn Mức Công Nợ (VNĐ)' : 'Credit Limit (VND)'}
            placeholder="500000000"
          />

          <ControlledInput
            name="paymentTermsDays"
            control={control}
            type="number"
            label={language === 'vi' ? 'Kỳ Hạn Thanh Toán (Ngày)' : 'Payment Terms (Days)'}
            placeholder="30"
          />
          
          {!isEditing && (
             <div className="md:col-span-2 mt-2 p-3 rounded-xl bg-muted/50 border border-border">
               <ControlledInput
                 name="debtAmount"
                 control={control}
                 type="number"
                 label={language === 'vi' ? 'Công Nợ Ban Đầu (VNĐ)' : 'Initial Debt (VND)'}
                 placeholder="0"
               />
               <p className="text-xs text-muted-foreground mt-1">
                 {language === 'vi' 
                  ? '* Chỉ nhập công nợ ban đầu khi chuyển đổi hệ thống phần mềm.' 
                  : '* Only enter initial debt when migrating from another system.'}
               </p>
             </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {tCommon.cancel}
        </Button>
        
        <Button
          type="submit"
          form="supplier-form"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? tCommon.loading 
            : (isEditing ? tCommon.save : (language === 'vi' ? 'Thêm' : 'Add'))}
        </Button>
      </div>
    </Dialog>
  );
};
