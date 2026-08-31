import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';

// Shared Components
import { PageHeader } from '../../components/shared/PageHeader';
import { SearchInput } from '../../components/shared/SearchInput';
import { DataTable } from '../../components/shared/DataTable';
import { AppPagination } from '../../components/shared/AppPagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import { Building2, Plus, Edit, Trash2, Phone, Mail, MapPin, ShieldAlert, BookOpen, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

import { useSuppliers, useDeleteSupplier } from '../../features/suppliers/hooks/useSuppliers';
import { SupplierFormModal } from '../../features/suppliers/components/SupplierFormModal';
import { SupplierPaymentModal } from '../../features/suppliers/components/SupplierPaymentModal';
import { SupplierDebtLedgerModal } from '../../features/suppliers/components/SupplierDebtLedgerModal';
import type { SupplierDto } from '../../features/suppliers/types/supplier.types';

export const SupplierListPage: React.FC = () => {
  const { language } = useThemeStore();
  const tSup = i18nDictionary[language].suppliers;
  const tCommon = i18nDictionary[language].common;

  // URL State Management
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '8', 10);
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

  // Queries
  const { data: allSuppliers = [], isLoading } = useSuppliers({
    page: currentPage, // passed to queryKey but backend may ignore
    pageSize,
    keyword: searchTerm
  });

  // Client-side pagination (since backend GetAll doesn't paginate)
  const totalItems = allSuppliers.length;
  const paginatedSuppliers = allSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Mutations
  const deleteMutation = useDeleteSupplier();

  // Modal States
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  
  const [paymentSupplier, setPaymentSupplier] = useState<SupplierDto | null>(null);
  const [ledgerSupplier, setLedgerSupplier] = useState<SupplierDto | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      if (paginatedSuppliers.length === 1 && currentPage > 1) {
        updateSearchParams({ page: (currentPage - 1).toString() });
      }
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tSup.suppliersTitle}
        description={tSup.suppliersSubtitle}
        icon={<Building2 className="w-6 h-6 text-blue-500" />}
        actions={
          <Button onClick={() => { setEditingSupplier(null); setShowFormModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            {tSup.btnAddSupplier}
          </Button>
        }
      />

      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-4">
        <div className="w-full md:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={tSup.searchPlaceholder}
          />
        </div>

        <DataTable
          isLoading={isLoading}
          isEmpty={paginatedSuppliers.length === 0}
          emptyTitle={language === 'vi' ? 'Không có dữ liệu' : 'No suppliers'}
          emptyDescription={language === 'vi' ? 'Không tìm thấy nhà cung cấp nào.' : 'No suppliers found.'}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Nhà Cung Cấp' : 'Supplier'}</th>
                <th className="h-10 px-4 font-medium">{language === 'vi' ? 'Liên Hệ' : 'Contact'}</th>
                <th className="h-10 px-4 font-medium text-right">{language === 'vi' ? 'Công Nợ' : 'Debt'}</th>
                <th className="h-10 px-4 text-right font-medium">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedSuppliers.map((s) => {
                const isOverLimit = s.debtAmount > (s.creditLimit || 500000000);
                return (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{s.name}</div>
                          <div className="font-mono text-xs text-muted-foreground mt-0.5">{s.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-xs truncate max-w-[200px]" title={s.phone}>
                          <Phone className="w-3 h-3 shrink-0" />
                          <span className="font-mono">{s.phone}</span>
                        </div>
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-xs truncate max-w-[200px]" title={s.email}>
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>{s.email}</span>
                          </div>
                        )}
                        {s.address && (
                          <div className="flex items-center gap-1.5 text-xs truncate max-w-[200px]" title={s.address}>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{s.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right align-top">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          {isOverLimit && <div title="Vượt hạn mức nợ"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /></div>}
                          <span className={`font-mono font-bold ${s.debtAmount > 0 ? (isOverLimit ? 'text-amber-500' : 'text-rose-500') : 'text-emerald-500'}`}>
                            {formatCurrency(s.debtAmount)}
                          </span>
                        </div>
                        <Badge variant="default">Hạn {s.paymentTermsDays || 30} ngày</Badge>
                      </div>
                    </td>
                    <td className="p-4 text-right align-top space-x-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" onClick={() => setLedgerSupplier(s)} title="Sổ Giao Dịch">
                        <BookOpen className="w-3.5 h-3.5 mr-1" />
                        Sổ Nợ
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setPaymentSupplier(s)} title={language === 'vi' ? 'Trả Nợ' : 'Pay Debt'}>
                        <CreditCard className="w-3.5 h-3.5 mr-1" />
                        {language === 'vi' ? 'Trả Nợ' : 'Pay'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingSupplier(s); setShowFormModal(true); }} title={tCommon.edit}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ isOpen: true, id: s.id, name: s.name })} title={tCommon.delete}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
      </div>

      {showFormModal && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setShowFormModal(false)}
        />
      )}

      {paymentSupplier && (
        <SupplierPaymentModal
          supplier={paymentSupplier}
          onClose={() => setPaymentSupplier(null)}
        />
      )}

      {ledgerSupplier && (
        <SupplierDebtLedgerModal
          supplier={ledgerSupplier}
          onClose={() => setLedgerSupplier(null)}
          onPayClick={() => {
            setLedgerSupplier(null);
            setPaymentSupplier(ledgerSupplier);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title={language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
        description={`${language === 'vi' ? 'Bạn có chắc chắn muốn xóa nhà cung cấp' : 'Are you sure you want to delete supplier'} "${deleteConfirm.name}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
