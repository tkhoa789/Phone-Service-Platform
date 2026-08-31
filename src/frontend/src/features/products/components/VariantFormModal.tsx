import React from 'react';
import { Layers } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { FormField } from '../../../components/forms/FormField';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { productVariantSchema, type ProductVariantFormValues } from '../schemas/product.schema';
import { useCreateVariant, useUpdateVariant } from '../hooks/useProducts';
import type { ProductDto, ProductVariantDto } from '../types/product.types';

// PC-03 UI
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface VariantFormModalProps {
  variant?: ProductVariantDto | null;
  presetProductId?: string;
  products: ProductDto[];
  onClose: () => void;
}

export const VariantFormModal: React.FC<VariantFormModalProps> = ({
  variant,
  presetProductId,
  products,
  onClose,
}) => {
  const { language } = useThemeStore();
  const tProd = i18nDictionary[language].products;
  const tCommon = i18nDictionary[language].common;

  const createMutation = useCreateVariant();
  const updateMutation = useUpdateVariant();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<ProductVariantFormValues>({
    resolver: zodResolver(productVariantSchema) as any,
    defaultValues: {
      productId: variant?.productId || presetProductId || (products[0]?.id || ''),
      sku: variant?.sku || `SKU_${Date.now().toString().slice(-6)}`,
      name: (variant as any)?.variantName || variant?.name || '',
      color: variant?.color || '',
      capacity: variant?.capacity || '256GB',
      costPrice: variant?.costPrice || 15000000,
      salePrice: variant?.salePrice || (variant as any)?.price || 18500000,
    },
  });

  const onSubmit = async (data: ProductVariantFormValues) => {
    try {
      if (variant?.id) {
        await updateMutation.mutateAsync({ id: variant.id, command: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const serverErrors = err.response.data.errors;
        Object.keys(serverErrors).forEach((key) => {
          const field = key.charAt(0).toLowerCase() + key.slice(1);
          setError(field as any, { message: serverErrors[key][0] });
        });
      }
    }
  };

  const title = variant ? tProd.modalVariantEditTitle : tProd.modalVariantCreateTitle;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 text-sm">
        <FormField label={tProd.selectProductLabel} error={errors.productId?.message} required>
          <Controller
            name="productId"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={products.map(p => ({ value: p.id, label: p.name }))}
                value={field.value}
                onChange={field.onChange}
                placeholder={language === 'vi' ? '-- Chọn dòng sản phẩm --' : '-- Select product --'}
                disabled={!!presetProductId || !!variant}
              />
            )}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <ControlledInput
            name="sku"
            control={control}
            label={language === 'vi' ? 'Mã SKU' : 'SKU'}
            placeholder="IP16PM-256-BLK"
          />
          <ControlledInput
            name="name"
            control={control}
            label={language === 'vi' ? 'Tên biến thể' : 'Variant Name'}
            placeholder="Titan Đen 256GB"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ControlledInput
            name="color"
            control={control}
            label={language === 'vi' ? 'Màu sắc' : 'Color'}
            placeholder="Đen"
          />
          <ControlledInput
            name="capacity"
            control={control}
            label={language === 'vi' ? 'Dung lượng/Kích thước' : 'Capacity'}
            placeholder="256GB"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ControlledInput
            name="costPrice"
            control={control}
            label={language === 'vi' ? 'Giá nhập (VND)' : 'Cost Price (VND)'}
            type="number"
          />
          <ControlledInput
            name="salePrice"
            control={control}
            label={language === 'vi' ? 'Giá bán (VND)' : 'Sale Price (VND)'}
            type="number"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {tCommon.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon.loading : tCommon.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
