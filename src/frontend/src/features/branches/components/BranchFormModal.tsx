import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import type { BranchDto } from '../../../types/api.types';
import { branchSchema, type BranchFormValues } from '../schemas/branch.schema';
import { useCreateBranch, useUpdateBranch } from '../hooks/useBranches';
import { FormWrapper } from '../../../components/forms/FormWrapper';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import toast from 'react-hot-toast';

// PC-03 Shared Components
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface BranchFormModalProps {
  branch: BranchDto | null;
  onClose: () => void;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({ branch, onClose }) => {
  const { language } = useThemeStore();
  const tBr = i18nDictionary[language].branches;
  const tCommon = i18nDictionary[language].common;

  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        code: branch.code,
        name: branch.name,
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
      });
    }
  }, [branch, form]);

  const onSubmit = async (data: BranchFormValues) => {
    try {
      const commandData = {
        ...data,
        phone: data.phone || '',
        email: data.email || '',
      };

      if (branch) {
        await updateMutation.mutateAsync({ id: branch.id, data: commandData });
        toast.success(language === 'vi' ? 'Cập nhật chi nhánh thành công!' : 'Branch profile updated!');
      } else {
        await createMutation.mutateAsync(commandData);
        toast.success(language === 'vi' ? 'Tạo chi nhánh thành công!' : 'New branch created!', { icon: '🏢' });
      }
      onClose();
    } catch (e: any) {
      if (e.response?.status === 400 && e.response?.data?.errors) {
        Object.entries(e.response.data.errors).forEach(([field, messages]) => {
          form.setError(field.toLowerCase() as keyof BranchFormValues, { 
            type: 'server', 
            message: (messages as string[])[0] 
          });
        });
      } else if (e.response?.status !== 409 && e.response?.status !== 401 && e.response?.status !== 403) {
        toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi lưu chi nhánh!');
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const title = branch ? tBr.modalEditTitle : tBr.modalCreateTitle;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title={title} className="max-w-md">
      <div className="py-4">
        <FormWrapper form={form} onSubmit={onSubmit} className="space-y-4">
          <ControlledInput
            control={form.control}
            name="code"
            label={tBr.codeLabel}
            placeholder="CN_HA_NOI..."
            className="uppercase"
          />

          <ControlledInput
            control={form.control}
            name="name"
            label={tBr.nameLabel}
            placeholder={language === 'vi' ? 'Chi Nhánh Hà Nội...' : 'Hanoi Branch...'}
          />

          <ControlledInput
            control={form.control}
            name="address"
            label={tBr.addressLabel}
            placeholder={language === 'vi' ? '123 Nguyễn Trãi...' : '123 Nguyen Trai...'}
          />

          <div className="grid grid-cols-2 gap-4">
            <ControlledInput
              control={form.control}
              name="phone"
              label={tBr.phoneLabel}
              placeholder="024 3888 9999"
            />
            <ControlledInput
              control={form.control}
              name="email"
              label={tBr.emailLabel}
              placeholder="hanoi@psp.vn"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {tCommon.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? tCommon.loading : tCommon.save}
            </Button>
          </div>
        </FormWrapper>
      </div>
    </Dialog>
  );
};
