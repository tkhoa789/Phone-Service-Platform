import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';

// PC-06 Shared & PC-03 UI
import { PageHeader } from '../../components/shared/PageHeader';
import { SearchInput } from '../../components/shared/SearchInput';
import { DataTable } from '../../components/shared/DataTable';
import { AppPagination } from '../../components/shared/AppPagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

import { Users, Phone, MapPin, Edit, Trash2, Plus, Gem, Star, Medal, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { useCustomers, useDeleteCustomer } from '../../features/customers/hooks/useCustomers';
import { CustomerFormModal } from '../../features/customers/components/CustomerFormModal';
import type { CustomerDto } from '../../features/customers/types/customer.types';
import { useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../constants/permissions';

export const CustomerListPage: React.FC = () => {
  const { language } = useThemeStore();
  const { can } = useAuthStore();
  const canCreate = can(PERMISSIONS.Customer_Create);
  const canEdit = can(PERMISSIONS.Customer_Update);
  const canDelete = can(PERMISSIONS.Customer_Delete);
  const tCust = i18nDictionary[language].customers;
  const tCommon = i18nDictionary[language].common;

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '10', 10);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | undefined>(undefined);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const { data: pagedData, isLoading } = useCustomers({
    page: currentPage,
    pageSize,
    keyword: searchTerm || undefined, // Use searchTerm from state which is driven by user input
  });
  const deleteMutation = useDeleteCustomer();

  const totalItems = pagedData?.totalCount || 0;
  const customers = pagedData?.items || [];

  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    updateSearchParams({ search: val, page: '1' });
  };

  const handleCreate = () => {
    setEditingCustomer(undefined);
    setShowModal(true);
  };

  const handleEdit = (customer: CustomerDto) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success(language === 'vi' ? 'Xóa khách hàng thành công!' : 'Customer deleted successfully!');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      if (customers.length === 1 && currentPage > 1) {
        updateSearchParams({ page: (currentPage - 1).toString() });
      }
    } catch {
      toast.error(language === 'vi' ? 'Xóa khách hàng thất bại!' : 'Failed to delete customer!');
    }
  };

  const getVipBadge = (points: number) => {
    if (points > 7000) return <Badge variant="info" className="bg-purple-500/10 text-purple-500 border-purple-500/20"><Gem className="w-3 h-3 mr-1" /> Kim Cương</Badge>;
    if (points > 2000) return <Badge variant="info" className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Star className="w-3 h-3 mr-1" /> Vàng</Badge>;
    if (points > 500) return <Badge variant="info" className="bg-slate-400/10 text-slate-400 border-slate-400/20"><Shield className="w-3 h-3 mr-1" /> Bạc</Badge>;
    return <Badge variant="default"><Medal className="w-3 h-3 mr-1" /> Đồng</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tCust.customersTitle}
        description={tCust.customersSubtitle}
        icon={<Users className="w-6 h-6 text-primary" />}
        actions={
          canCreate ? (
            <Button onClick={handleCreate} className="gap-2" variant="danger">
              <Plus className="w-4 h-4" />
              {language === 'vi' ? 'Thêm Khách Hàng' : 'Add Customer'}
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm theo tên, SĐT, email...' : 'Search customers...'}
            />
          </div>
        </div>

        <DataTable
          isLoading={isLoading}
          isEmpty={customers.length === 0}
          emptyTitle={language === 'vi' ? 'Không có khách hàng' : 'No customers'}
          emptyDescription={language === 'vi' ? 'Chưa có dữ liệu khách hàng hoặc không tìm thấy kết quả.' : 'No customer data available or no results found.'}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="h-10 px-4 font-medium">{tCust.colName}</th>
                <th className="h-10 px-4 font-medium">{tCust.colPhone}</th>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Hạng' : 'Tier'}</th>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Điểm' : 'Points'}</th>
                <th className="h-10 px-4 font-medium hidden md:table-cell">{tCust.colAddress}</th>
                <th className="h-10 px-4 text-right font-medium">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c, idx) => {
                const demoPointsList = [450, 1850, 3200, 7800, 250, 5200, 8900, 1100];
                const demoPoints = (c as any).rewardPoints || demoPointsList[idx % demoPointsList.length];

                return (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{c.fullName}</div>
                      <div className="text-xs text-muted-foreground">{c.email || '—'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="p-4">{getVipBadge(demoPoints)}</td>
                    <td className="p-4 font-mono font-medium">{(demoPoints ?? 0).toLocaleString()}</td>
                    <td className="p-4 hidden md:table-cell max-w-[200px] truncate" title={c.address}>
                      {c.address ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">{tCust.unupdated}</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title={tCommon.edit}>
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(c.id, c.fullName)} title={tCommon.delete}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {!canEdit && !canDelete && (
                        <span className="text-xs text-muted-foreground italic">{language === 'vi' ? 'Chỉ xem' : 'Read-only'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTable>

        <div className="mt-4">
          <AppPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => updateSearchParams({ page: p.toString() })}
          />
        </div>
      </Card>

      {showModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title={language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
        description={`${language === 'vi' ? 'Bạn có chắc chắn muốn xóa khách hàng' : 'Are you sure you want to delete customer'} "${deleteConfirm.name}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
