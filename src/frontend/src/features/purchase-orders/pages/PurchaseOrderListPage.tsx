import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Search, Plus, Filter, Package, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { Pagination } from '../../../components/common/Pagination';
import { PageSkeleton } from '../../../components/common/PageSkeleton';

import { usePurchaseOrders } from '../api/queries';
import { PurchaseOrderFormModal } from '../components/PurchaseOrderFormModal';
import { PurchaseOrderDetailModal } from '../components/PurchaseOrderDetailModal';
import type { PurchaseOrderDto } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const PurchaseOrderListPage: React.FC = () => {
  const { language } = useThemeStore();
  const tCommon = i18nDictionary[language].common;

  // URL State Management
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '10', 10);
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';

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
  const { data: allPOs = [], isLoading } = usePurchaseOrders(
    statusFilter ? { status: statusFilter } : undefined
  );

  // Client-side filtering by search term (since backend GetList only supports Supplier/Warehouse/Status)
  const filteredPOs = allPOs.filter(po => 
    !searchTerm || 
    po.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side pagination
  const totalItems = filteredPOs.length;
  const paginatedPOs = filteredPOs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Handlers
  const handleCreate = () => {
    setEditingPOId(null);
    setShowFormModal(true);
  };

  const handleEdit = (id: string) => {
    setEditingPOId(id);
    setShowFormModal(true);
  };

  const handleView = (po: PurchaseOrderDto) => {
    setSelectedPO(po);
    setShowDetailModal(true);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0 ₫';
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Received': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading && !allPOs.length) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans text-[var(--neu-text-sub)]">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--neu-bg-base)] shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-blue-600 border border-blue-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-[var(--neu-text-title)] tracking-tight">
              {language === 'vi' ? 'Phiếu Nhập Kho' : 'Purchase Orders'}
            </h1>
            <p className="text-xs text-[var(--neu-text-sub)] mt-0.5 font-normal">
              {language === 'vi' ? 'Quản lý đơn đặt hàng và nhập kho từ nhà cung cấp' : 'Manage supplier purchase orders and stock receiving'}
            </p>
          </div>
        </div>
        <Button variant="outline"
          onClick={handleCreate}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-medium text-xs shadow-[var(--neu-shadow-button)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {language === 'vi' ? 'Tạo Phiếu Nhập' : 'Create PO'}
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => updateSearchParams({ search: e.target.value, page: '1' })}
            placeholder={language === 'vi' ? 'Tìm theo mã phiếu, NCC, kho...' : 'Search code, supplier, warehouse...'}
            className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-[var(--neu-text-title)] placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-normal"
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
          <select
            value={statusFilter}
            onChange={(e) => updateSearchParams({ status: e.target.value, page: '1' })}
            className="w-full appearance-none bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-11 pr-10 py-3 text-xs text-[var(--neu-text-title)] shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer"
          >
            <option value="">{language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</option>
            <option value="Draft">Draft (Nháp)</option>
            <option value="Confirmed">Confirmed (Xác nhận)</option>
            <option value="Received">Received (Đã nhập kho)</option>
            <option value="Cancelled">Cancelled (Đã hủy)</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-2 h-2 border-b-2 border-r-2 border-slate-400 transform rotate-45"></div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-[var(--neu-border)]">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Mã Phiếu' : 'PO Code'}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Nhà Cung Cấp' : 'Supplier'}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Kho Nhận' : 'Warehouse'}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Ngày Tạo' : 'Date'}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Tổng Tiền' : 'Total Amount'}</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {paginatedPOs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300 mb-3" />
                      <p>{language === 'vi' ? 'Không tìm thấy phiếu nhập kho nào.' : 'No purchase orders found.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPOs.map((po) => (
                  <tr 
                    key={po.id} 
                    onClick={() => handleView(po)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-[var(--neu-text-title)] group-hover:text-blue-600 transition-colors">{po.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--neu-text-title)]">{po.supplierName}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {po.warehouseName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(po.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[var(--neu-text-title)]">{formatCurrency(po.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-[var(--neu-border)] bg-slate-50/30">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => updateSearchParams({ page: page.toString() })}
            />
          </div>
        )}
      </div>

      {showFormModal && (
        <PurchaseOrderFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          poId={editingPOId}
        />
      )}

      {showDetailModal && selectedPO && (
        <PurchaseOrderDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          poId={selectedPO.id}
          onEdit={() => {
            setShowDetailModal(false);
            handleEdit(selectedPO.id);
          }}
        />
      )}
    </div>
  );
};
