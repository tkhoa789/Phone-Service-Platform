import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { UserDto } from '../../types/api.types';

// Shared Components
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { AppPagination } from '../../components/shared/AppPagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { SearchInput } from '../../components/shared/SearchInput';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import { Users, UserPlus, Building2, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useUsers, useDeleteUser } from '../../features/users/hooks/useUsers';
import { UserFormModal } from '../../features/users/components/UserFormModal';

export const UserListPage: React.FC = () => {
  const { language } = useThemeStore();
  const t = i18nDictionary[language].users;
  const tCommon = i18nDictionary[language].common;

  // URL State for Pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '10', 10);
  const searchTerm = searchParams.get('search') || '';

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  const handleSearch = (val: string) => {
    updateSearchParams({ search: val, page: '1' });
  };

  // TanStack Query
  const { data: allUsers = [], isLoading, isError } = useUsers();
  const deleteMutation = useDeleteUser();

  // Local UI State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  const handleOpenModal = (user?: UserDto) => {
    setEditingUser(user || null);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      toast.success(language === 'vi' ? 'Xóa nhân viên thành công!' : 'User deleted!');
    } catch {
      // Error handled by hook
    }
  };

  // Filter & Pagination implementation
  // [TECHNICAL DEBT / TEMPORARY COMPATIBILITY]
  const filteredUsers = allUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success">{t.statusActive}</Badge>;
      case 'Inactive':
        return <Badge variant="warning">{t.statusInactive}</Badge>;
      case 'Locked':
        return <Badge variant="danger">{t.statusLocked}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load users.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.usersTitle}
        description={t.usersSubtitle}
        icon={<Users className="w-6 h-6 text-emerald-500" />}
        actions={
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <UserPlus className="w-4 h-4" /> {t.btnAddUser}
          </Button>
        }
      />

      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-4">
        <div className="w-full md:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
          />
        </div>

        <DataTable
          isLoading={isLoading}
          isEmpty={paginatedUsers.length === 0}
          emptyTitle={language === 'vi' ? 'Không có nhân viên' : 'No users'}
          emptyDescription={t.emptyUsers}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="h-10 px-4 font-medium">{t.colFullName}</th>
                <th className="h-10 px-4 font-medium">{t.colUsername}</th>
                <th className="h-10 px-4 font-medium">{t.colBranch}</th>
                <th className="h-10 px-4 font-medium">{t.colContact}</th>
                <th className="h-10 px-4 font-medium">{t.colStatus}</th>
                <th className="h-10 px-4 text-right font-medium">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <span className="font-mono text-emerald-600 font-bold">{u.username}</span>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{u.branchName || t.allBranches}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono">{u.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    {getStatusBadge(u.status)}
                  </td>
                  <td className="p-4 text-right align-top space-x-2 whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(u)} title={tCommon.edit}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ isOpen: true, id: u.id, name: u.fullName })} title={tCommon.delete}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>

        <div className="mt-4">
          <AppPagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={(p) => updateSearchParams({ page: p.toString() })}
          />
        </div>
      </div>

      {showModal && (
        <UserFormModal
          initialUser={editingUser}
          onClose={() => setShowModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title={language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
        description={`${language === 'vi' ? 'Bạn có chắc chắn muốn xóa nhân viên' : 'Are you sure you want to delete user'} "${deleteConfirm.name}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
