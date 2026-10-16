import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/authStore';
import { useBranchStore } from '../../../../stores/branchStore';
import { useThemeStore } from '../../../../stores/themeStore';
import { inventoryService } from '../../../inventory/services/inventory.service';
import { inventorySandboxService } from '../../../inventory/services/inventorySandboxService';
import { useInventoryTour } from '../../../inventory/hooks/useInventoryTour';
import { operationalNotificationService } from '../../../../services/operationalNotificationService';
import { getPurchaseOrders } from '../../../purchase-orders/api/purchaseOrdersApi';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { WorkQueueTable } from '../widgets/WorkQueueTable';
import { QuickActions } from '../widgets/QuickActions';
import type { QuickActionItem } from '../widgets/QuickActions';
import { ExceptionPanel } from '../widgets/ExceptionPanel';
import { SupportingBadges } from '../widgets/SupportingBadges';
import type { SupportingBadgeItem } from '../widgets/SupportingBadges';
import { 
  Package, ClipboardCheck, FileText, Store, 
  AlertTriangle, RefreshCw, 
  Boxes, 
  Truck, Sparkles, GraduationCap, RotateCcw,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../../utils/sandboxUtils';
import type { InventoryDto } from '../../../../types/api.types';
import type { PurchaseOrderDto } from '../../../purchase-orders/types';

export const InventoryDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { activeBranchId, activeBranchName } = useBranchStore();
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sandbox Mode Detection (URL params)
  const isSandboxMode = 
    searchParams.get('mode') === 'training' || 
    location.search.includes('sandbox=true');
  const [sandboxTick, setSandboxTick] = useState(0);
  const { startTour, stopTour, isTourActive } = useInventoryTour();

  // Query live inventory list
  const { 
    data: liveInventory = [], 
    isLoading: invLoading, 
    refetch: refetchInv,
    isRefetching: invRefetching 
  } = useQuery({
    queryKey: ['inventory', 'dashboard-list', activeBranchId],
    queryFn: () => inventoryService.getInventory(),
    enabled: !isSandboxMode,
    staleTime: 30 * 1000,
  });

  // Query live purchase orders
  const { 
    data: livePurchaseOrders = [], 
    isLoading: poLoading, 
    refetch: refetchPo,
    isRefetching: poRefetching 
  } = useQuery({
    queryKey: ['purchaseOrders', 'dashboard-list', activeBranchId],
    queryFn: () => getPurchaseOrders(),
    enabled: !isSandboxMode,
    staleTime: 30 * 1000,
  });

  // Automatically start tour if requested via URL param
  useEffect(() => {
    if (searchParams.get('tour') === 'auto') {
      const timer = setTimeout(() => {
        startTour();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour]);

  // Handle data source resolution (Shadow Store vs Live API)
  const inventory: InventoryDto[] = useMemo(() => {
    if (isSandboxMode) {
      return inventorySandboxService.getInventory();
    }
    return liveInventory;
  }, [isSandboxMode, liveInventory, sandboxTick]);

  const purchaseOrders: PurchaseOrderDto[] = useMemo(() => {
    if (isSandboxMode) {
      return inventorySandboxService.getPurchaseOrders();
    }
    return livePurchaseOrders;
  }, [isSandboxMode, livePurchaseOrders, sandboxTick]);

  const isLoading = isSandboxMode ? false : (invLoading || poLoading);
  const isRefetching = isSandboxMode ? false : (invRefetching || poRefetching);

  const handleRefreshAll = () => {
    if (isSandboxMode) {
      setSandboxTick(t => t + 1);
    } else {
      refetchInv();
      refetchPo();
    }
  };

  // Launch guide / tour
  const handleStartGuide = () => {
    if (!isSandboxMode) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('mode', 'training');
      setSearchParams(nextParams);
    }
    setTimeout(() => {
      startTour();
    }, 150);
  };

  // Reset sandbox training data
  const handleResetSandbox = () => {
    inventorySandboxService.reset();
    operationalNotificationService.clearSandboxNotifications();
    setSandboxTick(t => t + 1);
    toast.success(
      language === 'vi' ? 'Đã khôi phục dữ liệu tủ đồ mẫu ban đầu!' : 'Reset demo inventory data successfully!',
      { icon: '🔄' }
    );
  };

  // Exit sandbox training mode
  const handleExitSandbox = () => {
    exitSandboxMode({
      searchParams,
      setSearchParams,
      navigate,
      language,
    });
  };

  // Handle clicking create PO button (if tour active, end tour and return to normal screen immediately)
  const handleCreatePOClick = (e: React.MouseEvent) => {
    if (isTourActive || document.querySelector('.driver-active') || document.querySelector('#driver-popover-content')) {
      e.preventDefault();
      e.stopPropagation();
      stopTour();
      try {
        sessionStorage.setItem('psp_sandbox_mode', 'true');
      } catch {
        // ignore
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('mode', 'training');
      nextParams.delete('tour');
      setSearchParams(nextParams);
      return;
    }
    navigate(isSandboxMode ? '/purchase-orders?mode=training' : '/purchase-orders');
  };

  // Simulated receiving PO
  const handleReceivePO = (poIdOrCode: string) => {
    if (isSandboxMode) {
      const res = inventorySandboxService.receivePurchaseOrder(poIdOrCode);
      if (res.success) {
        toast.success(res.message, { icon: '📦' });
        setSandboxTick(t => t + 1);
      } else {
        toast.error(res.message);
      }
    } else {
      navigate('/purchase-orders');
    }
  };

  // Simulated quick reorder
  const handleQuickReorder = (sku: string) => {
    if (isSandboxMode) {
      const res = inventorySandboxService.quickReorder(sku);
      if (res.success) {
        toast.success(res.message, { icon: '📝' });
        setSandboxTick(t => t + 1);
      } else {
        toast.error(res.message);
      }
    } else {
      navigate('/purchase-orders');
    }
  };

  // Metrics: Operational counts only (no financial VND valuation)
  const totalVariants = inventory.length;
  const totalUnits = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Stock Exceptions: Low stock and completely out-of-stock items
  const lowStockItems = inventory.filter(
    (item) => item.isLowStock || ((item.quantity || 0) <= (item.minimumStock || 5))
  );
  const outOfStockItems = inventory.filter((item) => (item.quantity || 0) === 0);
  const lowStockCount = lowStockItems.length;

  // Inbound Work: Pending Purchase Orders awaiting dock receiving
  const pendingPOs = purchaseOrders.filter(
    (po) => po.status === 'Draft' || po.status === 'Confirmed' || (po.status as string) === 'Submitted'
  );
  const pendingPOCount = pendingPOs.length;

  const quickActionsList: QuickActionItem[] = [
    {
      title: language === 'vi' ? 'Tồn Kho & Quản Lý IMEI' : 'Stock & IMEI Control',
      description: language === 'vi' ? 'Theo dõi số lượng tồn thực tế theo kho, vị trí kệ và quản lý trạng thái từng mã IMEI.' : 'Monitor physical warehouse on-hand stock and IMEI statuses.',
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-blue-500',
      badge: language === 'vi' ? 'Tác vụ chính' : 'Primary',
      onClick: () => navigate(isSandboxMode ? '/inventory?mode=training' : '/inventory'),
    },
    {
      title: language === 'vi' ? 'Đợt Kiểm Kê Kho Hàng' : 'Cycle Counting & Stock Take',
      description: language === 'vi' ? 'Tạo đợt kiểm kê định kỳ, đối soát số lượng đếm thực tế và lập báo cáo chênh lệch.' : 'Initiate cycle counts and record physical counts.',
      icon: <ClipboardCheck className="w-5 h-5" />,
      iconColor: 'text-amber-500',
      onClick: () => navigate(isSandboxMode ? '/stock-take?mode=training' : '/stock-take'),
    },
    {
      title: language === 'vi' ? 'Đơn Nhập Hàng & Mua Hàng' : 'Purchase Orders & Receiving',
      description: language === 'vi' ? 'Theo dõi đơn đặt hàng nhà cung cấp, kiểm tra hàng về và thực hiện nhận hàng vào kho.' : 'Track supplier orders and inspect incoming goods.',
      icon: <FileText className="w-5 h-5" />,
      iconColor: 'text-emerald-500',
      onClick: () => navigate(isSandboxMode ? '/purchase-orders?mode=training' : '/purchase-orders'),
    },
    {
      title: language === 'vi' ? 'Danh Bạ Nhà Cung Cấp' : 'Supplier Directory',
      description: language === 'vi' ? 'Xem thông tin liên lạc các nhà phân phối, đặt hàng phụ kiện và liên hệ hỗ trợ.' : 'Supplier directory and procurement contacts.',
      icon: <Store className="w-5 h-5" />,
      iconColor: 'text-purple-500',
      onClick: () => navigate(isSandboxMode ? '/suppliers?mode=training' : '/suppliers'),
    },
  ];

  // Supporting compact badges (placed at bottom)
  const summaryBadges: SupportingBadgeItem[] = [
    {
      id: 'low-stock',
      label: language === 'vi' ? 'Cảnh Báo Hàng Sắp Hết' : 'Low Stock Alerts',
      value: lowStockCount,
      icon: <AlertTriangle className="w-4 h-4" />,
      iconColor: 'text-rose-500',
      variant: lowStockCount > 0 ? 'danger' : 'default',
      onClick: () => navigate(isSandboxMode ? '/inventory?mode=training' : '/inventory'),
    },
    {
      id: 'pending-po',
      label: language === 'vi' ? 'Đơn Mua Chờ Nhập' : 'Pending Inbound POs',
      value: pendingPOCount,
      unit: language === 'vi' ? 'đơn' : 'orders',
      icon: <Truck className="w-4 h-4" />,
      iconColor: 'text-amber-500',
      variant: pendingPOCount > 0 ? 'warning' : 'muted',
      onClick: () => navigate(isSandboxMode ? '/purchase-orders?mode=training' : '/purchase-orders'),
    },
    {
      id: 'total-skus',
      label: language === 'vi' ? 'Mặt Hàng Quản Lý (SKU)' : 'Stocked SKUs',
      value: totalVariants,
      icon: <Boxes className="w-4 h-4" />,
      iconColor: 'text-blue-500',
      variant: 'info',
      onClick: () => navigate(isSandboxMode ? '/inventory?mode=training' : '/inventory'),
    },
    {
      id: 'total-units',
      label: language === 'vi' ? 'Tổng Số Lượng Tồn' : 'Total Units On-Hand',
      value: totalUnits,
      icon: <Package className="w-4 h-4" />,
      iconColor: 'text-emerald-500',
      variant: 'success',
      isLoading,
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header with Guide Button & Primary Action Button */}
      <div id="tour-inv-header">
        <PageHeader
          title={language === 'vi' ? 'Trung Tâm Quản Lý Kho Bãi & Cung Ứng' : 'Warehouse & Inventory Operations'}
          description={
            language === 'vi'
              ? `Cảnh báo thiếu hụt hàng hóa, tiếp nhận đơn mua từ nhà cung cấp và kiểm soát số lượng tồn thực tế. Kho: ${activeBranchName}.`
              : `Stock replenishment alerts, inbound dock receiving, and inventory physical count. Scope: ${activeBranchName}.`
          }
          icon={<Boxes className="w-6 h-6 text-blue-500" />}
          actions={
            <div className="flex items-center gap-2">
              {/* Nút Hướng dẫn sử dụng màu xanh biển nổi bật */}
              <Button
                id="tour-inv-guide-btn"
                type="button"
                onClick={handleStartGuide}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleRefreshAll}
                disabled={isLoading || isRefetching}
                className="gap-1.5 text-xs h-9 px-3 neu-raised active:shadow-inset"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
                <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
              </Button>

              <Button
                id="tour-inv-create-po"
                variant="primary"
                onClick={handleCreatePOClick}
                className="gap-2 text-xs h-9 px-4 shadow-md font-semibold"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'vi' ? 'Tạo Đơn Mua Hàng' : 'Create Purchase Order'}</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* 2. Sandbox Banner (Trụ cột 7 - Visual Containment) */}
      {isSandboxMode && (
        <div
          id="tour-inv-sandbox-banner"
          className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  {language === 'vi' ? 'HỆ THỐNG HUẤN LUYỆN THỦ KHO (SANDBOX TRAINING)' : 'INVENTORY SANDBOX TRAINING'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ZERO-DB FOOTPRINT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi'
                  ? 'Số liệu tủ đồ và đơn nhập hàng chạy trên Bộ nhớ đệm (Shadow Store), an toàn 100% không làm sai lệch tồn kho thật. Bạn có thể tự do bấm Nhập kho hoặc Đặt PO thử.'
                  : 'Sample inventory and inbound POs running in isolated Shadow Store with 0 live database footprint.'}
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
              <span>{language === 'vi' ? 'Xem lại Hướng dẫn' : 'Replay Tour'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetSandbox}
              className="px-3.5 py-2 rounded-xl bg-card border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Demo'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExitSandbox}
              className="px-3.5 py-2 rounded-xl bg-card border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Thoát Sandbox' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Role Context Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="font-semibold uppercase tracking-wider text-[11px]">
            {language === 'vi' ? 'Quản Lý Kho & Cung Ứng (Inventory)' : 'Inventory Controller'}
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium text-foreground">{activeBranchName}</span>
          </span>
          {user?.fullName && (
            <>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <span className="text-muted-foreground font-mono">
                {user.fullName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isSandboxMode ? (language === 'vi' ? 'Mô Phỏng Hoạt Động (Sandbox Active)' : 'Sandbox Simulation Online') : (language === 'vi' ? 'Kho Đang Hoạt Động' : 'Warehouse Online')}</span>
        </div>
      </div>

      {/* 4. Operational Exceptions: Out-of-Stock & Critical Low Stock */}
      {outOfStockItems.length > 0 && (
        <ExceptionPanel
          severity="danger"
          title={language === 'vi' ? 'Cảnh Báo Nguy Cấp: Mặt Hàng Đã Cạn Tồn Kho (0 Sản Phẩm)' : 'Critical Alert: Out of Stock SKUs (0 Units)'}
          description={
            language === 'vi'
              ? `Có ${outOfStockItems.length} mặt hàng đang có số lượng tồn bằng 0. Cần lập đơn đặt hàng nhà cung cấp (PO) bổ sung khẩn cấp.`
              : `There are ${outOfStockItems.length} SKUs completely out of stock requiring immediate purchase orders.`
          }
          count={outOfStockItems.length}
          actionText={language === 'vi' ? 'Lập đơn đặt hàng PO' : 'Create Purchase Order'}
          onActionClick={() => navigate(isSandboxMode ? '/purchase-orders?mode=training' : '/purchase-orders')}
          items={outOfStockItems.slice(0, 3).map((item) => ({
            id: item.id || item.productVariantId,
            title: `${item.variantName || (item as any).productName || 'Sản phẩm'} — SKU: ${item.sku || '—'}`,
            subtitle: `Tồn kho: 0 • Định mức tối thiểu: ${item.minimumStock || 5} cái`,
            badge: language === 'vi' ? 'HẾT HÀNG' : 'OUT OF STOCK',
            actionText: language === 'vi' ? 'Đặt hàng' : 'Order',
            onAction: () => handleQuickReorder(item.sku),
          }))}
        />
      )}

      {/* 5. Core Work Queue: Dual Actionable Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue 1: Cảnh Báo Hàng Sắp Hết (Low Stock Alert Table) */}
        <div id="tour-inv-low-stock">
          <WorkQueueTable<InventoryDto>
            title={language === 'vi' ? 'Mặt Hàng Dưới Ngưỡng An Toàn' : 'Low Stock Alerts Queue'}
            description={language === 'vi' ? 'Các sản phẩm/linh kiện cần lập đơn đặt hàng thêm' : 'SKUs below safety stock threshold'}
            icon={<AlertTriangle className="w-4 h-4" />}
            iconColor="text-rose-500"
            badge={lowStockCount > 0 ? { text: `${lowStockCount} SKU`, variant: 'danger' } : undefined}
            data={lowStockItems.slice(0, 8)}
            isLoading={isLoading}
            emptyMessage={language === 'vi' ? 'Toàn bộ mặt hàng đều đạt ngưỡng tồn kho an toàn.' : 'All inventory items are at healthy safety stock levels.'}
            actionText={language === 'vi' ? 'Xem tồn kho' : 'View Stock'}
            onActionClick={() => navigate(isSandboxMode ? '/inventory?mode=training' : '/inventory')}
            onRowClick={() => navigate(isSandboxMode ? '/inventory?mode=training' : '/inventory')}
            columns={[
              {
                key: 'productName',
                header: language === 'vi' ? 'Tên mặt hàng / SKU' : 'Item / SKU',
                render: (item) => (
                  <div>
                    <span className="font-medium text-foreground block truncate max-w-[170px]" title={item.variantName || (item as any).productName}>
                      {item.variantName || (item as any).productName || 'Sản phẩm'}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{item.sku || '—'}</span>
                  </div>
                ),
              },
              {
                key: 'quantity',
                header: language === 'vi' ? 'Tồn kho' : 'On-Hand',
                align: 'right',
                render: (item) => (
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        (item.quantity || 0) === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.quantity || 0} {language === 'vi' ? 'chiếc' : 'units'}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      /{item.minimumStock || 5}
                    </span>
                  </div>
                ),
              },
              {
                key: 'action',
                header: language === 'vi' ? 'Thao tác' : 'Action',
                align: 'center',
                render: (item) => (
                  <Badge 
                    variant="danger" 
                    className="cursor-pointer hover:opacity-85 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickReorder(item.sku);
                    }}
                  >
                    {language === 'vi' ? 'Đặt PO' : 'Reorder'}
                  </Badge>
                ),
              },
            ]}
          />
        </div>

        {/* Queue 2: Đơn Hàng Nhà Cung Cấp Chờ Nhập Kho (Inbound Receiving Queue) */}
        <div id="tour-inv-pending-po">
          <WorkQueueTable<PurchaseOrderDto>
            title={language === 'vi' ? 'Hàng Đợi Tiếp Nhận Đơn Mua (Inbound POs)' : 'Inbound Receiving Queue'}
            description={language === 'vi' ? 'Đơn hàng từ nhà cung cấp đang chờ kiểm đếm nhập kho' : 'Purchase orders arriving at warehouse dock'}
            icon={<Truck className="w-4 h-4" />}
            iconColor="text-emerald-500"
            badge={pendingPOCount > 0 ? { text: `${pendingPOCount} đơn`, variant: 'warning' } : undefined}
            data={pendingPOs.slice(0, 8)}
            isLoading={isLoading}
            emptyMessage={language === 'vi' ? 'Không có đơn mua hàng nào đang chờ tiếp nhận.' : 'No inbound purchase orders awaiting receiving.'}
            actionText={language === 'vi' ? 'Xem đơn PO' : 'View POs'}
            onActionClick={() => navigate(isSandboxMode ? '/purchase-orders?mode=training' : '/purchase-orders')}
            onRowClick={() => navigate(isSandboxMode ? '/purchase-orders?mode=training' : '/purchase-orders')}
            columns={[
              {
                key: 'code',
                header: language === 'vi' ? 'Mã đơn PO' : 'PO Code',
                render: (po) => (
                  <span className="font-mono font-bold text-primary">
                    {(po as any).poCode || po.code || po.id?.slice(0, 8) || 'PO'}
                  </span>
                ),
              },
              {
                key: 'supplier',
                header: language === 'vi' ? 'Nhà cung cấp' : 'Supplier',
                render: (po) => (
                  <span className="text-foreground truncate max-w-[130px] inline-block">
                    {po.supplierName || 'NCC'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: language === 'vi' ? 'Trạng thái' : 'Status',
                align: 'center',
                render: (po) => (
                  <Badge
                    variant={
                      po.status === 'Received'
                        ? 'default'
                        : po.status === 'Confirmed'
                        ? 'success'
                        : po.status === 'Draft'
                        ? 'warning'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {po.status === 'Received'
                      ? (language === 'vi' ? 'Đã nhập' : 'Received')
                      : po.status === 'Confirmed'
                      ? (language === 'vi' ? 'Chờ nhận hàng' : 'Confirmed')
                      : po.status === 'Draft'
                      ? (language === 'vi' ? 'Bản nháp' : 'Draft')
                      : (language === 'vi' ? 'Đã hủy' : 'Cancelled')}
                  </Badge>
                ),
              },
              {
                key: 'action',
                header: language === 'vi' ? 'Thao tác' : 'Action',
                align: 'center',
                render: (po) => (
                  <Badge 
                    variant="outline" 
                    className={`cursor-pointer text-[10px] ${
                      po.status === 'Received'
                        ? 'bg-muted text-muted-foreground border-border/40 cursor-default'
                        : 'hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (po.status !== 'Received') {
                        handleReceivePO(po.code || po.id);
                      }
                    }}
                  >
                    {po.status === 'Received'
                      ? (language === 'vi' ? 'Đã nhận' : 'Done')
                      : (language === 'vi' ? 'Nhập kho' : 'Receive')}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* 6. Operational Launchers: Quick Actions Grid */}
      <div id="tour-inv-quick-actions">
        <QuickActions
          title={language === 'vi' ? 'Lối Tắt Nghiệp Vụ Quản Lý Kho' : 'Warehouse Operational Launchers'}
          description={language === 'vi' ? 'Truy cập nhanh vào các công cụ kho bãi và nhập hàng' : 'One-click shortcuts to warehouse tools'}
          actions={quickActionsList}
          columns={4}
        />
      </div>

      {/* 7. Supporting Volume Badges (Positioned at bottom, compact) */}
      <div id="tour-inv-summary-badges">
        <SupportingBadges
          title={language === 'vi' ? 'Tóm Tắt Khối Lượng Tồn Kho Thực Tế' : 'Warehouse Physical Storage Summary'}
          items={summaryBadges}
        />
      </div>
    </div>
  );
};
