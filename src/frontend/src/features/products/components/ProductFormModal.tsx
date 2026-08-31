import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle2, Camera, Sparkles, Bot, Cpu } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { FormField } from '../../../components/forms/FormField';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { cn } from '../../../utils/cn';

// PC-03 Shared
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';

import { productSchema, type ProductFormValues } from '../schemas/product.schema';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import type { ProductDto, CategoryDto, BrandDto } from '../types/product.types';
import { Input } from '@/components/ui/Input';

interface ProductFormModalProps {
  product?: ProductDto | null;
  categories: CategoryDto[];
  brands: BrandDto[];
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  brands,
  onClose
}) => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [aiSourceBadge, setAiSourceBadge] = useState<string | null>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: product?.code || `PROD_${Date.now().toString().slice(-4)}`,
      name: product?.name || '',
      categoryId: product?.categoryId || (categories[0]?.id || ''),
      brandId: product?.brandId || (brands[0]?.id || ''),
      description: product?.description || '',
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        code: product.code || '',
        name: product.name || '',
        categoryId: product.categoryId || '',
        brandId: product.brandId || '',
        description: product.description || '',
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    if (product) {
      await updateMutation.mutateAsync({ id: product.id, command: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    setTimeout(() => {
      setValue('name', `iPhone 15 Pro Max (${barcodeInput.slice(-4)})`);
      setValue('description', 'AI Auto-filled from external database.');
      setAiSourceBadge('AI_KNOWLEDGE');
      setBarcodeInput('');
    }, 600);
  };

  const title = product 
    ? (language === 'vi' ? 'Cập nhật Dòng sản phẩm' : 'Update Product Model') 
    : (language === 'vi' ? 'Thêm mới Dòng sản phẩm' : 'Add Product Model');

  const description = language === 'vi' 
    ? 'Nhập thông tin cấu hình chung của sản phẩm.' 
    : 'Enter general configuration of the product.';

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title={title} description={description} className="max-w-2xl">
      <div className="py-4">
        {!product && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="w-4 h-4" />
                <span>{language === 'vi' ? 'AI Auto-Fill qua Barcode Box' : 'AI Auto-Fill via Barcode'}</span>
              </div>
              <Button
                variant={isCameraActive ? "primary" : "outline"}
                size="sm"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className="h-8"
              >
                <Camera className="w-4 h-4 mr-2" /> {language === 'vi' ? 'Quét Camera' : 'Scan Camera'}
              </Button>
            </div>
            {isCameraActive && (
              <div className="w-full h-40 bg-slate-900 rounded-xl mb-4 relative flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-primary border-dashed opacity-50 m-4 rounded-lg animate-pulse" />
                <span className="text-white/60 text-sm">Webcam Feed Placeholder...</span>
              </div>
            )}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <Input
                ref={barcodeInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={language === 'vi' ? 'Dùng súng quét mã vạch hộp hoặc nhập ID...' : 'Scan box barcode or enter ID...'}
                className="flex-1 px-4 py-2 rounded-md border bg-background text-sm"
              />
              <Button type="submit">Enter</Button>
            </form>
          </Card>
        )}

        <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ControlledInput
              name="code"
              control={control}
              label={language === 'vi' ? 'Mã Code (Tự động)' : 'Product Code (Auto)'}
              placeholder="PROD_1234"
            />
            
            <div className="relative">
              <ControlledInput
                name="name"
                control={control}
                label={language === 'vi' ? 'Tên dòng sản phẩm (VD: iPhone 16)' : 'Product Model Name'}
                placeholder="iPhone 16 Pro Max 256GB..."
              />
              {aiSourceBadge && (
                <div className="absolute right-2 top-8 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500 text-white text-[10px] font-bold">
                  {aiSourceBadge === 'AI_KNOWLEDGE' ? <Bot className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                  {aiSourceBadge === 'AI_KNOWLEDGE' ? 'AI RAG' : 'DB'}
                </div>
              )}
            </div>

            <FormField label={language === 'vi' ? 'Thương hiệu' : 'Brand'} error={errors.brandId?.message} required>
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={brands.map(b => ({ value: b.id, label: b.name }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={language === 'vi' ? '-- Chọn thương hiệu --' : '-- Select Brand --'}
                  />
                )}
              />
            </FormField>

            <FormField label={language === 'vi' ? 'Danh mục' : 'Category'} error={errors.categoryId?.message} required>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={language === 'vi' ? '-- Chọn danh mục --' : '-- Select Category --'}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField label={language === 'vi' ? 'Mô tả thêm (Không bắt buộc)' : 'Description (Optional)'} error={errors.description?.message}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={3}
                  placeholder={language === 'vi' ? 'Nhập đặc điểm nổi bật...' : 'Enter key features...'}
                />
              )}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {tCommon.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon.loading : tCommon.save}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
