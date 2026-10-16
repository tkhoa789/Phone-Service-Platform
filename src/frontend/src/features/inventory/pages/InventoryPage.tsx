import React, { useState, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Warehouse, Search, AlertTriangle, CheckCircle2, ClipboardCheck, ArrowRightLeft, Filter, Truck, GraduationCap, RotateCcw, Sparkles, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { Pagination } from '../../../components/common/Pagination';
import { StockAuditModal } from '../components/StockAuditModal';
import { WarehouseTransferModal } from '../components/WarehouseTransferModal';
import { TransferTrackerModal } from '../components/TransferTrackerModal';
import { useInventoryList, useWarehouses } from '../hooks/useInventory';
import { useInventoryPageTour } from '../hooks/useInventoryPageTour';
import { inventorySandboxService } from '../services/inventorySandboxService';
import { operationalNotificationService } from '../../../services/operationalNotificationService';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { InventoryDto } from '../../../types/api.types';

export const InventoryPage: React.FC = () => {
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSandboxMode = searchParams.get('mode') === 'training' || location.search.includes('sandbox=true');
  const [sandboxTick, setSandboxTick] = useState(0);

  const tInv = i18nDictionary[language].inventory;
  const tCommon = i18nDictionary[language].common;

  const { data: liveInventories = [], isLoading: liveLoading } = useInventoryList();
  const { data: apiWarehouses = [] } = useWarehouses();

  const inventories: InventoryDto[] = useMemo(() => {
    if (isSandboxMode) {
      return inventorySandboxService.getInventory();
    }
    return liveInventories;
  }, [isSandboxMode, liveInventories, sandboxTick]);

  const isLoading = isSandboxMode ? false : liveLoading;

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedAuditItem, setSelectedAuditItem] = useState<InventoryDto | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // Fallback if warehouses API is empty
  const branches = apiWarehouses.length > 0 ? apiWarehouses : [
    { id: 'b1', name: 'Trụ sở chính (HQ)' },
    { id: 'b2', name: 'Chi nhánh Quận 1' },
    { id: 'b3', name: 'Chi nhánh Thủ Đức' },
  ];

  // Client-side filtering & pagination (TECHNICAL DEBT / TEMPORARY COMPATIBILITY)
  const filteredInventories = inventories.filter(inv => {
    if (showLowStockOnly && !inv.isLowStock) return false;
    if (selectedBranchId !== 'all' && inv.warehouseId !== selectedBranchId) return false;
    if (searchTerm && !inv.variantName.toLowerCase().includes(searchTerm.toLowerCase()) && !inv.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const paginatedInventories = filteredInventories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { startTour } = useInventoryPageTour();


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div id="tour-inv-header">
        <PageHeader 
          title={tInv.inventoryTitle || "Kho Hàng"}
          description={tInv.inventorySubtitle || "Quản lý tồn kho thực tế & vị trí tủ kệ linh kiện"}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                id="tour-inv-page-guide-btn"
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
                id="tour-inv-tracker-btn"
                variant="outline"
                onClick={() => setShowTrackerModal(true)}
              >
                {language === 'vi' ? 'Theo Dõi Vận Chuyển' : 'Transfer Tracker'}
              </Button>
              <Button
                id="tour-inv-transfer-btn"
                onClick={() => setShowTransferModal(true)}
              >
                {language === 'vi' ? 'Luân Chuyển Hàng' : 'Transfer Stock'}
              </Button>
            </div>
          }
        />
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
                  {language === 'vi' ? 'CHẾ ĐỘ THỰC HÀNH TỒN KHO (SANDBOX)' : 'INVENTORY SANDBOX MODE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ZERO-DB FOOTPRINT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi'
                  ? 'Dữ liệu linh kiện mẫu lưu trong Shadow Store. Bạn có thể tự do bấm nút "Kiểm Kho" để thực hành đối soát mà không sợ sai lệch tồn kho thật.'
                  : 'Sample inventory running in isolated Shadow Store with zero writes to live database.'}
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
                toast.success(language === 'vi' ? 'Đã khôi phục dữ liệu mẫu ban đầu!' : 'Reset demo inventory data successfully!', { icon: '🔄' });
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

      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder={tInv.searchPlaceholder}
            className="flex-1"
          />

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => { setSelectedBranchId(e.target.value); setCurrentPage(1); }}
              className="bg-card text-foreground border border-border/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto shadow-inset"
            >
              <option value="all">⚡ {language === 'vi' ? 'Tất cả Kho Chi Nhánh' : 'All Branch Warehouses'}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <Button
            id="tour-inv-filter-lowstock"
            variant={showLowStockOnly ? 'primary' : 'outline'}
            onClick={() => { setShowLowStockOnly(!showLowStockOnly); setCurrentPage(1); }}
            className={showLowStockOnly ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}
          >
            {language === 'vi' ? 'Hàng Sắp Hết Kho (< Định Mức)' : 'Low Stock Alert'}
          </Button>
        </div>

        <div className="border border-border/40 rounded-2xl overflow-hidden bg-card neu-raised">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-elevated/70 border-b border-border/40 text-muted-foreground font-medium">
              <tr>
                <th className="p-3">{tInv.colVariantName || 'Sản Phẩm'}</th>
                <th className="p-3">{tInv.colSku || 'SKU'}</th>
                <th className="p-3 text-center">{tInv.colAvailableStock || 'Tồn Kho'}</th>
                <th className="p-3 text-center">{tInv.colMinStock || 'Định Mức'}</th>
                <th className="p-3 text-center">{tInv.colStockStatus || 'Trạng Thái'}</th>
                <th className="p-3 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : paginatedInventories.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{tInv.emptyInventory || 'Trống'}</td></tr>
              ) : (
                paginatedInventories.map((inv: InventoryDto, idx: number) => (
                  <tr key={inv.id || `${inv.sku}-${idx}`} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{inv.variantName}</td>
                    <td className="p-3 font-mono font-bold text-primary">{inv.sku}</td>
                    <td className="p-3 text-center font-bold text-primary">{inv.quantity}</td>
                    <td className="p-3 text-center font-mono text-muted-foreground">{inv.minimumStock || 5}</td>
                    <td className="p-3 text-center">
                      {inv.isLowStock ? (
                        <Badge variant="warning"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> {tInv.statusLowStock || 'Sắp hết'}</Badge>
                      ) : (
                        <Badge variant="success"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {tInv.statusSafe || 'Đủ hàng'}</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        id={idx === 0 ? 'tour-inv-audit-btn' : undefined}
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAuditItem(inv)}
                      >
                        <ClipboardCheck className="w-4 h-4 mr-2" /> {language === 'vi' ? 'Kiểm Kho' : 'Audit'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


        <Pagination
          currentPage={currentPage}
          totalItems={filteredInventories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {selectedAuditItem && (
        <StockAuditModal
          inventoryItem={selectedAuditItem}
          onClose={() => setSelectedAuditItem(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
          }}
        />
      )}

      {showTransferModal && (
        <WarehouseTransferModal
          branches={branches}
          inventoryList={inventories}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
          }}
        />
      )}

      {showTrackerModal && (
        <TransferTrackerModal
          onClose={() => setShowTrackerModal(false)}
          onRefreshInventory={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
          }}
        />
      )}
    </div>
  );
};
