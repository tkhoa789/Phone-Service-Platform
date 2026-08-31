import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { ControlledInput } from '../../../components/forms/ControlledInput';

import { customerSchema, type CustomerFormValues } from '../schemas/customer.schema';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import type { CustomerDto } from '../types/customer.types';

// PC-03 UI Components
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface CustomerFormModalProps {
  customer?: CustomerDto | null;
  onClose: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, onClose }) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;
  const isEditing = !!customer;

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
    }
  });

  useEffect(() => {
    if (customer) {
      reset({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: customer.id,
          command: data
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          const fieldKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof CustomerFormValues;
          setError(fieldKey, {
            type: 'server',
            message: backendErrors[key][0]
          });
        });
      }
    }
  };

  const title = isEditing 
    ? (language === 'vi' ? 'Cập Nhật Khách Hàng' : 'Edit Customer')
    : (language === 'vi' ? 'Thêm Khách Hàng Mới' : 'Add New Customer');

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title={title}>
      <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
        <ControlledInput
          name="fullName"
          control={control}
          label={language === 'vi' ? 'Tên Khách Hàng' : 'Full Name'}
          placeholder={language === 'vi' ? 'Nhập tên khách hàng...' : 'Enter customer name...'}
          rules={{ required: true }}
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
          placeholder={language === 'vi' ? 'Nhập email (không bắt buộc)...' : 'Enter email (optional)...'}
        />

        <ControlledInput
          name="address"
          control={control}
          label={language === 'vi' ? 'Địa Chỉ' : 'Address'}
          placeholder={language === 'vi' ? 'Nhập địa chỉ (không bắt buộc)...' : 'Enter address (optional)...'}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? tCommon.loading 
              : (isEditing ? tCommon.save : (language === 'vi' ? 'Thêm' : 'Add'))}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
