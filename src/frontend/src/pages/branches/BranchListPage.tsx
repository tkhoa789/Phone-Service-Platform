import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { BranchDto } from '../../types/api.types';

// Shared Components
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { AppPagination } from '../../components/shared/AppPagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import { Building2, Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import { useBranches, useDeleteBranch } from '../../features/branches/hooks/useBranches';
import { BranchFormModal } from '../../features/branches/components/BranchFormModal';
import { useAuthStore } from '../../stores/authStore';

export const BranchListPage: React.FC = () => {
  const { language } = useThemeStore();
  const { roles } = useAuthStore();
  const isOwner = roles.includes('Owner');
  const tBr = i18nDictionary[language].branches;
  const tCommon = i18nDictionary[language].common;

  // URL State for Pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '10', 10);

  // TanStack Query
  const { data: allBranches = [], isLoading, isError } = useBranches();
  const deleteMutation = useDeleteBranch();

  // Local UI State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  const handleOpenModal = (branch?: BranchDto) => {
    setEditingBranch(branch || null);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      toast.success(language === 'vi' ? 'Xóa chi nhánh thành công!' : 'Branch deleted!');
    } catch {
      // Error handled by hook
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
  };

  // Client-side pagination implementation for now since backend /Branch doesn't support PagedResult yet.
  // In a real scenario for FE-3.5, if backend didn't support it, we document the discrepancy but keep UI pagination.
  // [TECHNICAL DEBT / TEMPORARY COMPATIBILITY]
  const paginatedBranches = allBranches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load branches.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tBr.branchesTitle}
        description={tBr.branchesSubtitle}
        icon={<Building2 className="w-6 h-6 text-emerald-500" />}
        actions={
          isOwner ? (
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="w-4 h-4" /> {tBr.btnAddBranch}
            </Button>
          ) : (
            <div className="text-xs px-3 py-1.5 rounded-lg neu-inset text-muted-foreground border border-border/50">
              {language === 'vi' ? 'Chỉ xem & cập nhật (Chỉ Owner mới có quyền tạo mới)' : 'View & update only (Owner required to create)'}
            </div>
          )
        }
      />

      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-4">
        <DataTable
          isLoading={isLoading}
          isEmpty={paginatedBranches.length === 0}
          emptyTitle={language === 'vi' ? 'Không có chi nhánh' : 'No branches'}
          emptyDescription={tBr.emptyBranches}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Chi Nhánh' : 'Branch'}</th>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Địa Chỉ' : 'Address'}</th>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Liên Hệ' : 'Contact'}</th>
                <th className="h-10 px-4 font-medium text-center">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                <th className="h-10 px-4 text-right font-medium">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 align-top">
                    <div className="font-medium text-foreground">{branch.name}</div>
                    <div className="font-mono text-xs text-muted-foreground mt-0.5">{branch.code}</div>
                  </td>
                  <td className="p-4 align-top max-w-[250px]">
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="truncate" title={branch.address}>{branch.address || tBr.unupdatedAddress}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono font-medium">{branch.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{branch.email || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-center">
                    <Badge variant="success">{tBr.statusActive}</Badge>
                  </td>
                  <td className="p-4 text-right align-top space-x-2 whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(branch)} title={tCommon.edit}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {isOwner && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ isOpen: true, id: branch.id, name: branch.name })} title={tCommon.delete}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>

        <div className="mt-4">
          <AppPagination
            currentPage={currentPage}
            totalItems={allBranches.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {showModal && (
        <BranchFormModal
          branch={editingBranch}
          onClose={() => setShowModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title={language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
        description={`${language === 'vi' ? 'Bạn có chắc chắn muốn xóa chi nhánh' : 'Are you sure you want to delete branch'} "${deleteConfirm.name}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
