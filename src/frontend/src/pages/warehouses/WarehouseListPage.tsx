import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Warehouse, Search, Plus, MapPin, Building2, Trash2, Edit, Calendar } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { Pagination } from '../../components/common/Pagination';
import { PageSkeleton } from '../../components/common/PageSkeleton';

import { useWarehouses, useDeleteWarehouse } from '../../features/warehouses/hooks/useWarehouses';
import { WarehouseFormModal } from '../../features/warehouses/components/WarehouseFormModal';
import { useBranches } from '../../features/branches/hooks/useBranches';
import type { WarehouseDto } from '../../features/warehouses/types/warehouse.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const WarehouseListPage: React.FC = () => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;

  // URL State Management
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '8', 10);
  const searchTerm = searchParams.get('search') || '';
  const branchFilter = searchParams.get('branchId') || '';

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

  // Queries
  const { data: allWarehouses = [], isLoading } = useWarehouses({
    page: currentPage,
    pageSize,
    keyword: searchTerm,
    branchId: branchFilter
  });
  const { data: branches = [] } = useBranches();

  // Client-side pagination (since backend GetAll doesn't paginate)
  const totalItems = allWarehouses.length;
  const paginatedWarehouses = allWarehouses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Mutations
  const deleteMutation = useDeleteWarehouse();

  // Modal States
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDto | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Handlers
  const handleCreate = () => {
    setEditingWarehouse(null);
    setShowFormModal(true);
  };

  const handleEdit = (warehouse: WarehouseDto) => {
    setEditingWarehouse(warehouse);
    setShowFormModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(language === 'vi' ? `Xóa kho hàng [${name}]?` : `Delete warehouse [${name}]?`)) return;
    deleteMutation.mutate(id);
  };

  if (isLoading && !allWarehouses.length) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans text-muted-foreground">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-indigo-500 border border-indigo-500/30">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">
              {language === 'vi' ? 'Quản Lý Kho Hàng' : 'Warehouse Management'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">
              {language === 'vi' ? 'Quản lý danh sách kho bãi của các chi nhánh' : 'Manage branch warehouses'}
            </p>
          </div>
        </div>
        <Button variant="danger"
          onClick={handleCreate}
          className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-white font-medium text-xs shadow-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {language === 'vi' ? 'Thêm Kho Mới' : 'Add Warehouse'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-card border border-border/50 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
              {language === 'vi' ? 'Tổng Số Kho' : 'Total Warehouses'}
            </p>
            <h3 className="text-2xl font-bold font-mono text-foreground">{allWarehouses.length}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner border border-border/50 bg-muted/20 border border-indigo-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-card border border-border/50 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
              {language === 'vi' ? 'Chi Nhánh Đang Hoạt Động' : 'Active Branches'}
            </p>
            <h3 className="text-2xl font-bold font-mono text-foreground">{branches.length}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner border border-border/50 bg-muted/20 border border-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => updateSearchParams({ search: e.target.value, page: '1' })}
            placeholder={language === 'vi' ? 'Tìm kiếm kho hàng...' : 'Search warehouses...'}
            className="w-full bg-card border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-foreground placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-normal"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={branchFilter}
            onChange={(e) => updateSearchParams({ branchId: e.target.value, page: '1' })}
            className="w-full bg-card border border-slate-300/40 rounded-2xl px-4 py-3 text-xs text-foreground shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          >
            <option value="">{language === 'vi' ? 'Tất cả chi nhánh' : 'All Branches'}</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="xl:col-span-2 p-8 text-center text-slate-400 border border-dashed border-slate-400/30 rounded-3xl">
            {tCommon.loading}
          </div>
        ) : paginatedWarehouses.length === 0 ? (
          <div className="xl:col-span-2 p-8 text-center text-slate-400 border border-dashed border-slate-400/30 rounded-3xl">
            {language === 'vi' ? 'Không tìm thấy kho hàng nào.' : 'No warehouses found.'}
          </div>
        ) : (
          paginatedWarehouses.map((w) => (
            <div key={w.id} className="p-5 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 text-indigo-500 flex items-center justify-center font-bold text-lg border border-indigo-500/30 shrink-0">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{w.name}</h3>
                    <p className="font-mono text-[10px] text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded-md inline-block mt-1">
                      {w.code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="outline"
                    onClick={() => handleEdit(w)}
                    className="p-2 rounded-xl bg-card text-indigo-500 shadow-sm active:shadow-inner border border-border/50 bg-muted/20 transition-colors cursor-pointer"
                    title={tCommon.edit}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline"
                    onClick={() => handleDelete(w.id, w.name)}
                    className="p-2 rounded-xl bg-card text-rose-500 hover:text-rose-600 shadow-sm active:shadow-inner border border-border/50 bg-muted/20 transition-colors cursor-pointer"
                    title={tCommon.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-500/5 rounded-xl p-3 border border-slate-400/20 shadow-inner border border-border/50 bg-muted/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {language === 'vi' ? 'Chi Nhánh' : 'Branch'}
                    </span>
                  </div>
                  <div className="font-medium text-foreground flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{w.branchName || '—'}</span>
                  </div>
                </div>
                <div className="bg-slate-500/5 rounded-xl p-3 border border-slate-400/20 shadow-inner border border-border/50 bg-muted/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {language === 'vi' ? 'Ngày Tạo' : 'Created At'}
                    </span>
                  </div>
                  <div className="font-medium text-foreground flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(w.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => updateSearchParams({ page: p.toString() })}
      />

      {showFormModal && (
        <WarehouseFormModal
          warehouse={editingWarehouse}
          onClose={() => setShowFormModal(false)}
        />
      )}
    </div>
  );
};
