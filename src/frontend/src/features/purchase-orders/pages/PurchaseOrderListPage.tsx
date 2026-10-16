import React, { useState, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Search, Plus, Filter, Package, AlertCircle, GraduationCap, Sparkles, RotateCcw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { Pagination } from '../../../components/common/Pagination';
import { PageSkeleton } from '../../../components/common/PageSkeleton';

import { usePurchaseOrders } from '../api/queries';
import { usePurchaseOrdersTour } from '../hooks/usePurchaseOrdersTour';
import { inventorySandboxService } from '../../inventory/services/inventorySandboxService';
import { operationalNotificationService } from '../../../services/operationalNotificationService';
import { PurchaseOrderFormModal } from '../components/PurchaseOrderFormModal';
import { PurchaseOrderDetailModal } from '../components/PurchaseOrderDetailModal';
import type { PurchaseOrderDto } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '../../../utils/formatCurrency';

export const PurchaseOrderListPage: React.FC = () => {
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const tCommon = i18nDictionary[language].common;

  // URL State Management
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isSandboxMode = searchParams.get('mode') === 'training' || location.search.includes('sandbox=true');
  const [sandboxTick, setSandboxTick] = useState(0);

  const { startTour } = usePurchaseOrdersTour();

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
  const { data: apiPOs = [], isLoading: apiLoading } = usePurchaseOrders(
    statusFilter ? { status: statusFilter } : undefined
  );

  const allPOs: PurchaseOrderDto[] = useMemo(() => {
    if (isSandboxMode) {
      let pos = inventorySandboxService.getPurchaseOrders();
      if (statusFilter) {
        pos = pos.filter(p => p.status === statusFilter);
      }
      return pos;
    }
    return apiPOs;
  }, [isSandboxMode, apiPOs, statusFilter, sandboxTick]);

  const isLoading = isSandboxMode ? false : apiLoading;

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


  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Confirmed': return 'bg-primary/10 text-blue-700 border-blue-200';
      case 'Received': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading && !allPOs.length) {
    return <PageSkeleton />;
  }

  return (
    <div id="tour-po-header" className="space-y-6 font-sans text-muted-foreground">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary border border-blue-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">
              {language === 'vi' ? 'Phiếu Nhập Kho' : 'Purchase Orders'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">
              {language === 'vi' ? 'Quản lý đơn đặt hàng và tiếp nhận linh kiện tại dock từ nhà cung cấp' : 'Manage supplier purchase orders and stock receiving'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            id="tour-po-guide-btn"
            type="button"
            onClick={() => {
              if (!isSandboxMode) {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('mode', 'training');
                setSearchParams(newParams);
                toast.success(
                  language === 'vi'
                    ? 'Đã bật Chế độ Thực hành & Khởi động Hướng dẫn!'
                    : 'Sandbox Mode & Guided Tour activated!',
                  { icon: '🌊' }
                );
              }
              setTimeout(() => {
                startTour();
              }, 250);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
            <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
          </Button>

          <Button
            id="tour-po-create-btn"
            variant="outline"
            onClick={handleCreate}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-medium text-xs shadow-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {language === 'vi' ? 'Tạo Phiếu Nhập' : 'Create PO'}
          </Button>
        </div>
      </div>

      {/* Amber Sandbox Banner */}
      {isSandboxMode && (
        <div
          id="tour-sandbox-banner"
          className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  {language === 'vi' ? 'CHẾ ĐỘ THỰC HÀNH NHẬP KHO (SANDBOX)' : 'PURCHASE ORDER SANDBOX MODE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ZERO-DB FOOTPRINT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi'
                  ? 'Toàn bộ đơn mua hàng mẫu lưu trong Shadow Store. Bạn có thể tự do bấm nút "Nhập kho" để thực hành đón shipper tiếp nhận hàng mà không ảnh hưởng đơn thật.'
                  : 'Sample purchase orders running in isolated Shadow Store with zero writes to live database.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={startTour}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{language === 'vi' ? 'Bắt đầu Hướng dẫn' : 'Start Tour'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                inventorySandboxService.reset();
                operationalNotificationService.clearSandboxNotifications();
                setSandboxTick(t => t + 1);
                toast.success(language === 'vi' ? 'Đã khôi phục dữ liệu đơn mua hàng mẫu!' : 'Reset demo purchase orders successfully!', { icon: '🔄' });
              }}
              className="px-3.5 py-2 rounded-xl bg-card border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Demo'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                exitSandboxMode({
                  searchParams,
                  setSearchParams,
                  navigate,
                  language,
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-card border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Thoát Sandbox' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => updateSearchParams({ search: e.target.value, page: '1' })}
            placeholder={language === 'vi' ? 'Tìm theo mã phiếu, NCC, kho...' : 'Search code, supplier, warehouse...'}
            className="w-full bg-card border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-foreground placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-normal"
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <select
            value={statusFilter}
            onChange={(e) => updateSearchParams({ status: e.target.value, page: '1' })}
            className="w-full appearance-none bg-card border border-slate-300/40 rounded-2xl pl-11 pr-10 py-3 text-xs text-foreground shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer"
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
      <div className="rounded-3xl bg-card border border-border/50 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border/50">
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
                paginatedPOs.map((po, index) => (
                  <tr 
                    key={po.id} 
                    onClick={() => handleView(po)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-foreground group-hover:text-primary transition-colors">{po.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{po.supplierName}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {po.warehouseName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(po.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-foreground">{formatCurrency(po.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span 
                          id={index === 0 ? 'tour-po-status-badge' : undefined}
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(po.status)}`}
                        >
                          {po.status}
                        </span>
                        {isSandboxMode && po.status === 'Confirmed' && (
                          <Button
                            id="tour-po-receive-action"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const res = inventorySandboxService.receivePurchaseOrder(po.id);
                              if (res.success) {
                                setSandboxTick(t => t + 1);
                                toast.success(res.message, { icon: '📦' });
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                          >
                            {language === 'vi' ? 'Nhập kho' : 'Receive'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t border-border/50 bg-slate-50/30">
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
