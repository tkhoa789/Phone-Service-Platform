import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, UserPlus, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import type { UserDto } from '../../../types/api.types';
import { userSchema, type UserFormValues } from '../schemas/user.schema';
import { useCreateUser, useUpdateUser } from '../hooks/useUsers';
import type { CreateUserCommand, UpdateUserCommand } from '../../../services/userService';
import { FormWrapper } from '../../../components/forms/FormWrapper';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { useBranches } from '../../branches/hooks/useBranches';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';

// PC-03 Components
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface UserFormModalProps {
  initialUser: UserDto | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const USER_ROLES = [
  { id: 'Owner', name: 'Chủ Cửa Hàng (Owner)', desc: 'Toàn quyền hệ thống' },
  { id: 'Admin', name: 'Quản Lý (Admin)', desc: 'Quản trị chi nhánh' },
  { id: 'Technician', name: 'Kỹ Thuật Viên', desc: 'Sửa chữa, nhận máy' },
  { id: 'Sales', name: 'Nhân Viên Bán Hàng', desc: 'Lên đơn, POS' },
];

export const UserFormModal: React.FC<UserFormModalProps> = ({ initialUser, onClose, onSuccess }) => {
  const { language } = useThemeStore();
  const { roles } = useAuthStore();
  const isOwner = roles.includes('Owner');
  const availableRoles = isOwner ? USER_ROLES : USER_ROLES.filter((r) => r.id !== 'Owner');
  const t = i18nDictionary[language].users;
  const tCommon = i18nDictionary[language].common;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const { data: branches = [] } = useBranches();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      branchId: '',
      role: 'Sales',
      fullName: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (initialUser) {
      form.reset({
        branchId: initialUser.branchId || '',
        role: initialUser.roles?.[0] || 'Sales',
        fullName: initialUser.fullName,
        username: initialUser.username,
        password: '',
        email: initialUser.email,
        phone: initialUser.phone,
        status: initialUser.status as 'Active' | 'Inactive' | 'Locked',
      });
    }
  }, [initialUser, form]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      const command = {
        ...data,
        branchId: data.branchId || undefined,
        roleIds: [data.role],
        password: data.password || undefined,
      };

      if (initialUser) {
        await updateMutation.mutateAsync({ id: initialUser.id, command: { ...command, id: initialUser.id } as UpdateUserCommand });
        toast.success(language === 'vi' ? 'Cập nhật nhân viên thành công!' : 'User updated!');
      } else {
        await createMutation.mutateAsync(command as CreateUserCommand);
        toast.success(language === 'vi' ? 'Tạo nhân viên thành công!' : 'New user created!');
      }
      onSuccess?.();
      onClose();
    } catch (e: any) {
      if (e.response?.status === 400 && e.response?.data?.errors) {
        Object.entries(e.response.data.errors).forEach(([field, messages]) => {
          form.setError(field.toLowerCase() as keyof UserFormValues, { 
            type: 'server', 
            message: (messages as string[])[0] 
          });
        });
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const title = initialUser ? t.modalEditTitle : t.modalCreateTitle;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title={title} className="max-w-xl">
      <div className="py-4">
        <FormWrapper form={form} onSubmit={onSubmit} className="space-y-4">
          
          <div className="p-3.5 rounded-xl border bg-muted/50 shadow-sm space-y-3">
            <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
              <Shield className="w-4 h-4 text-emerald-500" />
              {t.roleLabel}
            </label>
            <select
              {...form.register('role')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground italic">
              * {availableRoles.find((r) => r.id === form.watch('role'))?.desc || USER_ROLES.find((r) => r.id === form.watch('role'))?.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t.branchLabel}
              </label>
              <SearchableSelect
                options={branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                  sublabel: `Mã: ${b.code} | ${b.address || ''}`,
                }))}
                value={form.watch('branchId') || ''}
                onChange={(val: string) => form.setValue('branchId', val, { shouldValidate: true })}
                placeholder="-- Áp dụng toàn hệ thống --"
                searchPlaceholder="Tìm theo tên chi nhánh..."
              />
            </div>

            <ControlledInput
              control={form.control}
              name="fullName"
              label={t.fullNameLabel}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ControlledInput
              control={form.control}
              name="username"
              label={t.usernameLabel}
              placeholder="nv_banhang01"
              disabled={!!initialUser}
            />

            <ControlledInput
              control={form.control}
              name="password"
              type="password"
              label={initialUser ? t.passwordEditLabel : t.passwordLabel}
              placeholder="********"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ControlledInput
              control={form.control}
              name="email"
              type="email"
              label={t.emailLabel}
              placeholder="email@psp.vn"
            />

            <ControlledInput
              control={form.control}
              name="phone"
              label={t.phoneLabel}
              placeholder="0912345678"
            />
          </div>

          {initialUser && (
            <div>
              <label className="text-sm font-medium leading-none mb-2 block">
                {t.accountStatusLabel}
              </label>
              <select
                {...form.register('status')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="Active">{t.statusActive}</option>
                <option value="Inactive">{t.statusInactive}</option>
                <option value="Locked">{t.statusLocked}</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
             
            >
              {tCommon.cancel}
            </Button>
            <Button
              type="submit"
             
            >
              {isPending ? tCommon.loading : tCommon.save}
            </Button>
          </div>
        </FormWrapper>
      </div>
    </Dialog>
  );
};
