import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Save, 
  AlertTriangle, 
  FileSpreadsheet, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  XCircle, 
  Eye, 
  Check, 
  Warehouse as WarehouseIcon,
  Layers,
  History,
  ArrowRight,
  GraduationCap,
  Sparkles,
  RotateCcw,
  LogOut
} from 'lucide-react';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import { useThemeStore } from '../../../stores/themeStore';
import { useBranchStore } from '../../../stores/branchStore';
import toast from 'react-hot-toast';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { 
  useInventoryList, 
  useWarehouses, 
  useStockTakes, 
  useStockTake, 
  useCreateStockTake, 
  useStartStockTake, 
  useCompleteStockTake, 
  useCancelStockTake,
  inventoryKeys
} from '../hooks/useInventory';
import { useStockTakeTour } from '../hooks/useStockTakeTour';
import { inventorySandboxService } from '../services/inventorySandboxService';
import { managerSandboxService } from '../../dashboard/services/managerSandboxService';
import { operationalNotificationService } from '../../../services/operationalNotificationService';
import { useQueryClient } from '@tanstack/react-query';
import type { StockTakeDto } from '../../../types/api.types';

export const StockTakePage: React.FC = () => {
  const { language } = useThemeStore();
  const { activeBranchId, activeBranchName } = useBranchStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isSandboxMode = searchParams.get('mode') === 'training' || location.search.includes('sandbox=true');
  const [sandboxTick, setSandboxTick] = useState(0);

  const { startTour } = useStockTakeTour();

  // Active Tab: 'audit' | 'history'
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');

  // Warehouses
  const { data: allWarehouses = [], isLoading: isLoadingWarehouses } = useWarehouses();
  
  // Filter warehouses belonging to active branch, fallback to all if no branch-specific
  const branchWarehouses = useMemo(() => {
    if (!activeBranchId) return allWarehouses;
    const filtered = allWarehouses.filter(w => !w.branchId || w.branchId === activeBranchId);
    return filtered.length > 0 ? filtered : allWarehouses;
  }, [allWarehouses, activeBranchId]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Auto-select first warehouse
  useEffect(() => {
    if (branchWarehouses.length > 0 && (!selectedWarehouseId || !branchWarehouses.some(w => w.id.toLowerCase() === selectedWarehouseId.toLowerCase()))) {
      setSelectedWarehouseId(branchWarehouses[0].id);
    }
  }, [branchWarehouses, selectedWarehouseId]);

  // Inventory items for selected warehouse
  const { 
    data: rawInventoryList, 
    isLoading: isLoadingInventory, 
    refetch: refetchInventory 
  } = useInventoryList(selectedWarehouseId || undefined);
  
  const inventoryList = useMemo(() => {
    if (isSandboxMode) {
      return inventorySandboxService.getInventory();
    }
    return rawInventoryList || [];
  }, [isSandboxMode, rawInventoryList, sandboxTick]);

  // Past Stock Takes for selected warehouse
  const { 
    data: rawStockTakes, 
    isLoading: isLoadingHistory, 
    refetch: refetchHistory 
  } = useStockTakes(selectedWarehouseId || undefined);
  
  const stockTakes = useMemo(() => {
    if (isSandboxMode) {
      return inventorySandboxService.getStockTakes(selectedWarehouseId);
    }
    return rawStockTakes || [];
  }, [isSandboxMode, rawStockTakes, selectedWarehouseId, sandboxTick]);

  // Mutations
  const { mutateAsync: createStockTake, isPending: isCreating } = useCreateStockTake();
  const { mutateAsync: startStockTake, isPending: isStarting } = useStartStockTake();
  const { mutateAsync: completeStockTake, isPending: isCompleting } = useCompleteStockTake();
  const { mutateAsync: cancelStockTake, isPending: isCancelling } = useCancelStockTake();

  // Stock Take Form State
  const [stockTakeCode, setStockTakeCode] = useState<string>(() => `ST-${Date.now().toString().slice(-6)}`);
  const [stockTakeList, setStockTakeList] = useState<Record<string, number>>({});
  const [isReconciling, setIsReconciling] = useState(false);

  // Detail Modal State
  const [selectedStockTakeId, setSelectedStockTakeId] = useState<string | null>(null);
  const { data: apiDetailStockTake, isLoading: isLoadingDetail } = useStockTake(selectedStockTakeId || '', !!selectedStockTakeId);

  const detailStockTake = useMemo(() => {
    if (isSandboxMode && selectedStockTakeId) {
      return inventorySandboxService.getStockTakeById(selectedStockTakeId);
    }
    return apiDetailStockTake;
  }, [isSandboxMode, selectedStockTakeId, apiDetailStockTake, sandboxTick]);

  // Initialize spreadsheet actual counts whenever inventory list loads
  useEffect(() => {
    if (inventoryList && inventoryList.length > 0) {
      const initialCounts: Record<string, number> = {};
      inventoryList.forEach(item => {
        initialCounts[item.sku] = item.quantity;
      });
      setStockTakeList(initialCounts);
    } else if (inventoryList) {
      setStockTakeList({});
    }
  }, [inventoryList]);

  const handleQtyChange = (sku: string, val: string) => {
    const num = parseInt(val, 10);
    setStockTakeList(prev => ({
      ...prev,
      [sku]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  // Summary statistics
  const summary = useMemo(() => {
    let modifiedCount = 0;
    let totalDifference = 0;
    inventoryList.forEach(item => {
      const actual = stockTakeList[item.sku] ?? item.quantity;
      const diff = actual - item.quantity;
      if (diff !== 0) {
        modifiedCount++;
        totalDifference += diff;
      }
    });
    return {
      totalItems: inventoryList.length,
      modifiedCount,
      totalDifference
    };
  }, [inventoryList, stockTakeList]);

  // Action: Save Draft (does not adjust inventory)
  const handleSaveDraft = async () => {
    if (!selectedWarehouseId) {
      toast.error(language === 'vi' ? 'Vui lòng chọn kho hàng!' : 'Please select a warehouse!');
      return;
    }
    if (inventoryList.length === 0) {
      toast.error(language === 'vi' ? 'Kho hàng hiện tại không có sản phẩm để kiểm kê!' : 'No items to audit in selected warehouse!');
      return;
    }

    const code = stockTakeCode.trim() || `ST-${Date.now().toString().slice(-6)}`;
    const items = inventoryList.map(item => ({
      productVariantId: item.productVariantId,
      actualQuantity: stockTakeList[item.sku] ?? item.quantity,
      note: (stockTakeList[item.sku] ?? item.quantity) !== item.quantity ? 'Chênh lệch kiểm đếm' : undefined
    }));

    try {
      await createStockTake({
        warehouseId: selectedWarehouseId,
        code,
        items
      });
      toast.success(
        language === 'vi' 
          ? `Đã tạo phiếu kiểm kê nháp [${code}] thành công!` 
          : `Draft stock take [${code}] saved successfully!`,
        { icon: '📝' }
      );
      setStockTakeCode(`ST-${Date.now().toString().slice(-6)}`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (e: any) {
      // Error handled by mutation onError
    }
  };

  // Action: Reconcile and Complete in one flow
  const handleReconcileAndComplete = async () => {
    if (!selectedWarehouseId) {
      toast.error(language === 'vi' ? 'Vui lòng chọn kho hàng!' : 'Please select a warehouse!');
      return;
    }
    if (inventoryList.length === 0) {
      toast.error(language === 'vi' ? 'Kho hàng hiện tại không có sản phẩm để kiểm kê!' : 'No items to audit in selected warehouse!');
      return;
    }

    setIsReconciling(true);
    const code = stockTakeCode.trim() || `ST-${Date.now().toString().slice(-6)}`;

    if (isSandboxMode) {
      const selectedWh = branchWarehouses.find(w => w.id === selectedWarehouseId);
      const res = inventorySandboxService.reconcileStockTake(
        selectedWarehouseId,
        selectedWh?.name || 'Kho Trụ Sở Chính',
        stockTakeList
      );
      managerSandboxService.resolveStockDiscrepancy(res.stockTake.code);
      setSandboxTick(t => t + 1);
      setIsReconciling(false);
      toast.success(
        language === 'vi' 
          ? `[THỰC HÀNH SANDBOX] Cân bằng tồn kho phiếu [${res.stockTake.code}] thành công!` 
          : `[SANDBOX] Stock reconciled and completed [${res.stockTake.code}] successfully!`,
        { icon: '⚖️' }
      );
      setStockTakeCode(`ST-${Date.now().toString().slice(-6)}`);
      return;
    }

    const items = inventoryList.map(item => ({
      productVariantId: item.productVariantId,
      actualQuantity: stockTakeList[item.sku] ?? item.quantity,
      note: (stockTakeList[item.sku] ?? item.quantity) !== item.quantity ? 'Cân bằng tồn kho thực tế' : undefined
    }));

    try {
      // Step 1: Create Stock Take
      const createdId = await createStockTake({
        warehouseId: selectedWarehouseId,
        code,
        items
      });

      // Step 2: Complete and Reconcile Stock Take
      await completeStockTake({
        id: createdId,
        command: {
          id: createdId,
          variantImeis: []
        }
      });

      toast.success(
        language === 'vi' 
          ? `Cân bằng tồn kho và hoàn tất phiếu [${code}] thành công!` 
          : `Stock reconciled and completed [${code}] successfully!`,
        { icon: '⚖️' }
      );

      // Refresh inventory and generate next code
      setStockTakeCode(`ST-${Date.now().toString().slice(-6)}`);
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (e: any) {
      // Error handled by mutation onError
    } finally {
      setIsReconciling(false);
    }
  };

  // Action: Start an existing draft stock take
  const handleStartExisting = async (st: StockTakeDto) => {
    try {
      await startStockTake(st.id);
      toast.success(
        language === 'vi' 
          ? `Phiếu [${st.code}] chuyển sang Đang kiểm kê!` 
          : `Stock take [${st.code}] is now in progress!`
      );
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (e) {
      // handled
    }
  };

  // Action: Complete an existing stock take
  const handleCompleteExisting = async (st: StockTakeDto) => {
    try {
      await completeStockTake({
        id: st.id,
        command: { id: st.id, variantImeis: [] }
      });
      toast.success(
        language === 'vi' 
          ? `Hoàn tất cân bằng tồn kho phiếu [${st.code}]!` 
          : `Completed stock take [${st.code}] successfully!`,
        { icon: '⚖️' }
      );
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      if (selectedStockTakeId === st.id) {
        setSelectedStockTakeId(null);
      }
    } catch (e) {
      // handled
    }
  };

  // Action: Cancel an existing stock take
  const handleCancelExisting = async (st: StockTakeDto) => {
    if (!window.confirm(language === 'vi' ? `Bạn có chắc muốn hủy phiếu [${st.code}]?` : `Cancel stock take [${st.code}]?`)) {
      return;
    }
    try {
      await cancelStockTake(st.id);
      toast.success(
        language === 'vi' 
          ? `Đã hủy phiếu [${st.code}]!` 
          : `Stock take [${st.code}] cancelled!`
      );
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      if (selectedStockTakeId === st.id) {
        setSelectedStockTakeId(null);
      }
    } catch (e) {
      // handled
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="warning">{language === 'vi' ? 'Bản Nháp' : 'Draft'}</Badge>;
      case 'InProgress':
        return <Badge variant="info">{language === 'vi' ? 'Đang Kiểm Kê' : 'In Progress'}</Badge>;
      case 'Completed':
        return <Badge variant="success">{language === 'vi' ? 'Đã Cân Bằng' : 'Completed'}</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">{language === 'vi' ? 'Đã Hủy' : 'Cancelled'}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isBusy = isCreating || isStarting || isCompleting || isCancelling || isReconciling;

  return (
    <div id="tour-stocktake-header" className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader 
        title={language === 'vi' ? 'Kiểm Kê Kho' : 'Stock Take & Audit'}
        description={language === 'vi' ? 'Kiểm đếm số lượng thực tế và đối soát cân bằng sổ cái tồn kho' : 'Count physical items and reconcile inventory variance'}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="tour-stocktake-guide-btn"
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
              variant="outline"
              onClick={() => {
                refetchInventory();
                refetchHistory();
              }}
              disabled={isBusy}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isBusy ? 'animate-spin' : ''}`} />
              {language === 'vi' ? 'Làm mới' : 'Refresh'}
            </Button>
            {activeTab === 'audit' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isBusy || isLoadingInventory || inventoryList.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Lưu Bản Nháp' : 'Save Draft'}
                </Button>
                <Button
                  id="tour-stocktake-reconcile"
                  onClick={handleReconcileAndComplete}
                  disabled={isBusy || isLoadingInventory || inventoryList.length === 0}
                  loading={isReconciling || isCompleting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {language === 'vi' ? 'Cân Bằng Kho (Hoàn Tất)' : 'Reconcile & Complete'}
                </Button>
              </>
            )}
          </div>
        }
      />

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
                  {language === 'vi' ? 'CHẾ ĐỘ THỰC HÀNH KIỂM KÊ (SANDBOX)' : 'STOCK TAKE SANDBOX MODE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ZERO-DB FOOTPRINT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi'
                  ? 'Đang chạy trên dữ liệu kiểm kê mẫu độc lập (Shadow Store). Bạn có thể tự do gõ số lượng thực tế và bấm "Cân Bằng Kho" mà không làm thay đổi dữ liệu thật.'
                  : 'Sample stock take running in isolated Shadow Store with zero writes to live database.'}
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
                toast.success(language === 'vi' ? 'Đã khôi phục dữ liệu mẫu kiểm kê ban đầu!' : 'Reset demo stock take data successfully!', { icon: '🔄' });
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

      {/* Warehouse Selector & Branch Context Bar */}
      <div id="tour-stocktake-mode" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {language === 'vi' ? 'Chi nhánh hoạt động' : 'Active Branch'}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-lg text-primary">{activeBranchName || '---'}</span>
          </div>
        </Card>
        
        <Card className="p-5 flex flex-col justify-center">
          <label htmlFor="warehouse-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {language === 'vi' ? 'Kho hàng kiểm kê *' : 'Audit Warehouse *'}
          </label>
          <div className="relative">
            <select
              id="warehouse-select"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border/40 bg-card px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-inset"
              disabled={isLoadingWarehouses || isBusy}
            >
              {branchWarehouses.length === 0 ? (
                <option value="">{language === 'vi' ? 'Chưa có kho hàng' : 'No warehouses'}</option>
              ) : (
                branchWarehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))
              )}
            </select>
          </div>
        </Card>

        {activeTab === 'audit' ? (
          <Card className="p-5 flex flex-col justify-center">
            <label htmlFor="stocktake-code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'vi' ? 'Mã phiếu kiểm kê' : 'Stock Take Code'}
            </label>
            <Input
              id="stocktake-code"
              value={stockTakeCode}
              onChange={(e) => setStockTakeCode(e.target.value)}
              className="font-mono font-bold text-primary"
              placeholder="ST-XXXXXX"
              maxLength={50}
              disabled={isBusy}
            />
          </Card>
        ) : (
          <Card className="p-5 flex flex-col justify-center bg-surface-elevated/50 border border-border/40">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'vi' ? 'Tổng số phiếu kiểm kê' : 'Total Stock Takes'}
            </span>
            <span className="font-heading font-bold text-2xl text-foreground">{stockTakes.length}</span>
          </Card>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/40 gap-4">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {language === 'vi' ? 'Bảng Kiểm Kê Thực Tế' : 'Physical Audit Grid'}
        </button>
        <button
          id="tour-stocktake-history"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4" />
          {language === 'vi' ? 'Lịch Sử Phiếu Kiểm Kê' : 'Stock Take History'}
          {stockTakes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-surface-elevated text-muted-foreground font-mono">
              {stockTakes.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AUDIT GRID */}
      {activeTab === 'audit' && (
        <div id="tour-stocktake-sheet" className="space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-surface-elevated/50 border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">{language === 'vi' ? 'Tổng mặt hàng' : 'Total Items'}</span>
              <span className="text-xl font-bold font-mono text-foreground">{summary.totalItems}</span>
            </Card>
            <Card className="p-4 bg-surface-elevated/50 border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">{language === 'vi' ? 'Khớp số lượng' : 'Matched Count'}</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{summary.totalItems - summary.modifiedCount}</span>
            </Card>
            <Card className="p-4 bg-surface-elevated/50 border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">{language === 'vi' ? 'Mặt hàng lệch' : 'Discrepant Items'}</span>
              <span className={`text-xl font-bold font-mono ${summary.modifiedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                {summary.modifiedCount}
              </span>
            </Card>
            <Card className="p-4 bg-surface-elevated/50 border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">{language === 'vi' ? 'Tổng chênh lệch' : 'Net Discrepancy'}</span>
              <span className={`text-xl font-bold font-mono ${
                summary.totalDifference > 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : summary.totalDifference < 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : 'text-foreground'
              }`}>
                {summary.totalDifference > 0 ? `+${summary.totalDifference}` : summary.totalDifference}
              </span>
            </Card>
          </div>

          <Card className="overflow-hidden neu-raised border border-border/40 bg-card">
            <div className="p-4 border-b border-border/40 bg-surface-elevated/70 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  {language === 'vi' ? 'Nhập số lượng kiểm đếm thực tế:' : 'Enter actual counted physical quantities:'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {language === 'vi' ? 'Độ lệch = Thực tế - Sổ sách' : 'Variance = Actual - System'}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-elevated/70 text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="p-3 pl-4">{language === 'vi' ? 'Mã SKU' : 'SKU'}</th>
                    <th className="p-3">{language === 'vi' ? 'Tên Sản Phẩm' : 'Product Name'}</th>
                    <th className="p-3 text-center">{language === 'vi' ? 'Tồn Sổ Sách' : 'System Stock'}</th>
                    <th className="p-3 text-center bg-primary/10 text-primary rounded-t-md">{language === 'vi' ? 'Kiểm Đếm Thực Tế' : 'Actual Count'}</th>
                    <th className="p-3 text-center">{language === 'vi' ? 'Chênh Lệch' : 'Variance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingInventory ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        {language === 'vi' ? 'Đang tải danh mục tồn kho...' : 'Loading inventory...'}
                      </td>
                    </tr>
                  ) : inventoryList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {language === 'vi' ? 'Kho hiện tại không có sản phẩm.' : 'Warehouse currently has no stock items.'}
                      </td>
                    </tr>
                  ) : (
                    inventoryList.map((item, idx) => {
                      const actualQty = stockTakeList[item.sku] ?? item.quantity;
                      const diff = actualQty - item.quantity;
                      const isModified = diff !== 0;

                      return (
                        <tr key={item.id || `${item.sku}-${idx}`} className={`transition-colors ${isModified ? 'bg-amber-500/10' : 'hover:bg-muted/20'}`}>
                          <td className="p-3 pl-4 font-mono text-primary font-bold">{item.sku}</td>
                          <td className="p-3 font-medium text-foreground">
                            {item.variantName}
                          </td>
                          <td className="p-3 text-center font-bold text-muted-foreground font-mono">
                            {item.quantity}
                          </td>
                          <td className="p-2 text-center bg-primary/5">
                            <Input
                              type="number"
                              min={0}
                              className="w-24 text-center font-mono font-bold text-primary bg-card border border-border/40 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-primary shadow-inset mx-auto"
                              value={stockTakeList[item.sku] ?? ''}
                              onChange={(e) => handleQtyChange(item.sku, e.target.value)}
                              disabled={isBusy}
                            />
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {isModified ? (
                              <span className={`px-2 py-0.5 rounded text-xs ${diff > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: STOCK TAKE HISTORY */}
      {activeTab === 'history' && (
        <Card className="overflow-hidden neu-raised border border-border/40 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated/70 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="p-3 pl-4">{language === 'vi' ? 'Mã Phiếu' : 'Code'}</th>
                  <th className="p-3">{language === 'vi' ? 'Kho Hàng' : 'Warehouse'}</th>
                  <th className="p-3 text-center">{language === 'vi' ? 'Số Mặt Hàng' : 'Items'}</th>
                  <th className="p-3 text-center">{language === 'vi' ? 'Thời Gian Tạo' : 'Created At'}</th>
                  <th className="p-3 text-center">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                  <th className="p-3 text-right pr-4">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      {language === 'vi' ? 'Đang tải lịch sử kiểm kê...' : 'Loading stock take history...'}
                    </td>
                  </tr>
                ) : stockTakes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {language === 'vi' ? 'Chưa có phiếu kiểm kê nào cho kho này.' : 'No stock takes found for this warehouse.'}
                    </td>
                  </tr>
                ) : (
                  stockTakes.map((st) => (
                    <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-primary">
                        {st.code}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {st.warehouseName}
                      </td>
                      <td className="p-3 text-center font-mono font-medium text-muted-foreground">
                        {st.items?.length ?? 0}
                      </td>
                      <td className="p-3 text-center text-muted-foreground font-mono text-xs">
                        {new Date(st.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(st.status)}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedStockTakeId(st.id)}
                            title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {st.status === 'Draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartExisting(st)}
                                disabled={isBusy}
                              >
                                {language === 'vi' ? 'Bắt Đầu' : 'Start'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCompleteExisting(st)}
                                disabled={isBusy}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Cân Bằng' : 'Reconcile'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                onClick={() => handleCancelExisting(st)}
                                disabled={isBusy}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {st.status === 'InProgress' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleCompleteExisting(st)}
                                disabled={isBusy}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Hoàn Tất' : 'Complete'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                onClick={() => handleCancelExisting(st)}
                                disabled={isBusy}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* DETAIL MODAL */}
      {selectedStockTakeId && (
        <Dialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedStockTakeId(null);
          }}
          title={language === 'vi' ? `Chi Tiết Phiếu Kiểm Kê: ${detailStockTake?.code || ''}` : `Stock Take Details: ${detailStockTake?.code || ''}`}
          description={language === 'vi' ? `Kho hàng: ${detailStockTake?.warehouseName || ''}` : `Warehouse: ${detailStockTake?.warehouseName || ''}`}
          className="max-w-3xl"
        >
          {isLoadingDetail ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              {language === 'vi' ? 'Đang tải thông tin chi tiết...' : 'Loading details...'}
            </div>
          ) : detailStockTake ? (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-3 gap-4 p-4 bg-surface-elevated/70 rounded-xl border border-border/40 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">{language === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
                  <div className="mt-1">{getStatusBadge(detailStockTake.status)}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{language === 'vi' ? 'Kho hàng:' : 'Warehouse:'}</span>
                  <span className="font-bold text-foreground">{detailStockTake.warehouseName}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{language === 'vi' ? 'Ngày tạo:' : 'Created Date:'}</span>
                  <span className="font-mono text-foreground">
                    {new Date(detailStockTake.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-border/40 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-elevated/70 text-muted-foreground border-b border-border/40 sticky top-0">
                    <tr>
                      <th className="p-3 pl-4">{language === 'vi' ? 'Mã SKU' : 'SKU'}</th>
                      <th className="p-3">{language === 'vi' ? 'Sản Phẩm' : 'Product'}</th>
                      <th className="p-3 text-center">{language === 'vi' ? 'Sổ Sách' : 'System'}</th>
                      <th className="p-3 text-center">{language === 'vi' ? 'Thực Tế' : 'Actual'}</th>
                      <th className="p-3 text-center">{language === 'vi' ? 'Chênh Lệch' : 'Diff'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {detailStockTake.items?.map((item) => {
                      const diff = item.difference;
                      return (
                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-primary">{item.sku}</td>
                          <td className="p-3 font-medium text-foreground">{item.variantName}</td>
                          <td className="p-3 text-center font-mono text-muted-foreground">{item.systemQuantity}</td>
                          <td className="p-3 text-center font-mono font-bold text-primary">{item.actualQuantity}</td>
                          <td className="p-3 text-center font-mono font-bold">
                            {diff !== 0 ? (
                              <span className={`px-2 py-0.5 rounded text-xs ${diff > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button variant="outline" onClick={() => setSelectedStockTakeId(null)}>
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </Button>
                {(detailStockTake.status === 'Draft' || detailStockTake.status === 'InProgress') && (
                  <Button
                    onClick={() => handleCompleteExisting(detailStockTake)}
                    disabled={isBusy}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Hoàn Tất Cân Bằng Kho' : 'Complete & Reconcile'}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </Dialog>
      )}
    </div>
  );
};
