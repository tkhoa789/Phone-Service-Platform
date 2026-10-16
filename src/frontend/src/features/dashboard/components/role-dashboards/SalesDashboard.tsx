import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/authStore';
import { useBranchStore } from '../../../../stores/branchStore';
import { useThemeStore } from '../../../../stores/themeStore';
import { salesService } from '../../../../services/salesService';
import { salesSandboxService } from '../../../sales/services/salesSandboxService';
import { useSalesDashboardTour } from '../../hooks/useSalesDashboardTour';
import { exitSandboxMode } from '../../../../utils/sandboxUtils';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { formatCurrency } from '../../../../utils/formatCurrency';
import { WorkQueueTable } from '../widgets/WorkQueueTable';
import { QuickActions } from '../widgets/QuickActions';
import type { QuickActionItem } from '../widgets/QuickActions';
import { ExceptionPanel } from '../widgets/ExceptionPanel';
import { SupportingBadges } from '../widgets/SupportingBadges';
import type { SupportingBadgeItem } from '../widgets/SupportingBadges';
import { 
  ShoppingCart, Receipt, Users, Tag, Package, 
  Clock, Store, ArrowUpRight, 
  CheckCircle2, RefreshCw, AlertCircle, Check, X,
  Compass, LogOut, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { SalesOrderDto } from '../../../../types/api.types';

export const SalesDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { activeBranchId, activeBranchName } = useBranchStore();
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isSandboxMode = 
    searchParams.get('mode') === 'training' || 
    location.search.includes('sandbox=true') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true');

  const [sandboxTick, setSandboxTick] = useState(0);
  const { startTour } = useSalesDashboardTour();

  useEffect(() => {
    const handleUpdate = () => setSandboxTick((t) => t + 1);
    window.addEventListener('psp_sandbox_sales_updated', handleUpdate);
    return () => window.removeEventListener('psp_sandbox_sales_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (searchParams.get('tour') === 'auto' || searchParams.get('tour') === 'true') {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour]);

  // Query branch sales orders
  const { 
    data: liveOrders = [], 
    isLoading: liveLoading, 
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['sales', 'dashboard-orders', activeBranchId],
    queryFn: () => salesService.getOrders(activeBranchId && activeBranchId !== 'all' ? { branchId: activeBranchId } : undefined),
    staleTime: 30 * 1000,
    enabled: !isSandboxMode,
  });

  const orders = useMemo(() => {
    if (isSandboxMode) {
      return salesSandboxService.getOrders();
    }
    return liveOrders;
  }, [isSandboxMode, liveOrders, sandboxTick]);

  const isLoading = isSandboxMode ? false : liveLoading;

  // Calculate today's confirmed metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr));
  const completedTodayOrders = todayOrders.filter((o) => o.status === 'Completed');
  const todayCompletedSales = completedTodayOrders.reduce((sum, o) => sum + (o.total || (o as any).totalAmount || 0), 0);
  const todayOrderCount = todayOrders.length;

  // Work Queues: Pending Orders (Actionable Backlog)
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const pendingOrdersCount = pendingOrders.length;

  // Work Queues: Recent Orders for receipt re-print / audit
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  const handleQuickComplete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      if (isSandboxMode) {
        salesSandboxService.completeOrder(orderId, user?.fullName || 'Chuyên Viên Sales');
        toast.success(language === 'vi' ? 'Thu tiền và duyệt hoàn tất đơn hàng thành công (Sandbox)!' : 'Order completed successfully (Sandbox)!');
        return;
      }
      await salesService.updateOrderStatus(orderId, 'Completed');
      toast.success(language === 'vi' ? 'Thu tiền và duyệt hoàn tất đơn hàng thành công!' : 'Order completed successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (language === 'vi' ? 'Không thể cập nhật đơn hàng!' : 'Failed to update order!'));
    }
  };

  const handleQuickCancel = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn hủy đơn hàng này?' : 'Are you sure you want to cancel this order?')) return;
    try {
      if (isSandboxMode) {
        salesSandboxService.cancelOrder(orderId, user?.fullName || 'Chuyên Viên Sales');
        toast.success(language === 'vi' ? 'Hủy đơn hàng thành công (Sandbox)!' : 'Order cancelled successfully (Sandbox)!');
        return;
      }
      await salesService.updateOrderStatus(orderId, 'Cancelled');
      toast.success(language === 'vi' ? 'Hủy đơn hàng thành công!' : 'Order cancelled successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (language === 'vi' ? 'Không thể hủy đơn hàng!' : 'Failed to cancel order!'));
    }
  };

  // Quick lookup of fast-moving products from today's orders
  const itemMap = new Map<string, { name: string; sku: string; qty: number }>();
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const existing = itemMap.get(item.productVariantId) || {
        name: item.productName || 'Sản phẩm',
        sku: item.sku || '',
        qty: 0,
      };
      existing.qty += item.quantity || 1;
      itemMap.set(item.productVariantId, existing);
    });
  });
  const topFastSelling = Array.from(itemMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  const quickActionsList: QuickActionItem[] = [
    {
      title: language === 'vi' ? 'Mở Màn Hình POS' : 'Open POS Terminal',
      description: language === 'vi' ? 'Giao diện bán hàng nhanh, quét mã vạch và thanh toán trực tiếp tại quầy.' : 'Point-of-Sale checkout and barcode scanning.',
      icon: <ShoppingCart className="w-5 h-5" />,
      iconColor: 'text-primary',
      badge: language === 'vi' ? 'Ưu tiên' : 'Primary',
      onClick: () => navigate('/pos'),
    },
    {
      title: language === 'vi' ? 'Đơn Hàng & Hóa Đơn' : 'Orders & Invoices',
      description: language === 'vi' ? 'Tra cứu toàn bộ đơn bán lẻ, in lại phiếu xuất kho và kiểm tra giao dịch.' : 'Search orders, re-print invoices and audit transactions.',
      icon: <Receipt className="w-5 h-5" />,
      iconColor: 'text-blue-500',
      onClick: () => navigate('/sales'),
    },
    {
      title: language === 'vi' ? 'Bảng Giá & Sản Phẩm' : 'Products & Pricing',
      description: language === 'vi' ? 'Kiểm tra nhanh giá niêm yết, tồn kho khả dụng và chính sách ưu đãi linh kiện.' : 'Check retail prices and on-hand stock.',
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-emerald-500',
      onClick: () => navigate('/products'),
    },
    {
      title: language === 'vi' ? 'Hồ Sơ Khách Hàng' : 'Customer Directory',
      description: language === 'vi' ? 'Tìm kiếm lịch sử mua máy, tích điểm thành viên và tạo mới khách lẻ.' : 'Customer loyalty profiles and order history.',
      icon: <Users className="w-5 h-5" />,
      iconColor: 'text-purple-500',
      onClick: () => navigate('/customers'),
    },
    {
      title: language === 'vi' ? 'Mã Giảm Giá & Voucher' : 'Voucher & Discounts',
      description: language === 'vi' ? 'Tra cứu mã khuyến mãi hiện hành, điều kiện áp dụng và mức chiết khấu.' : 'Active promotional vouchers and discount rules.',
      icon: <Tag className="w-5 h-5" />,
      iconColor: 'text-rose-500',
      onClick: () => navigate('/vouchers'),
    },
  ];

  // Supporting compact badges (placed at the bottom to avoid pushing work queues down)
  const summaryBadges: SupportingBadgeItem[] = [
    {
      id: 'pending',
      label: language === 'vi' ? 'Đơn Chờ Thu Tiền' : 'Pending Payment',
      value: pendingOrdersCount,
      unit: language === 'vi' ? 'đơn' : 'orders',
      icon: <Clock className="w-4 h-4" />,
      iconColor: 'text-amber-500',
      variant: pendingOrdersCount > 0 ? 'warning' : 'muted',
      onClick: () => navigate('/sales?status=Pending'),
    },
    {
      id: 'sales-today',
      label: language === 'vi' ? 'Doanh Số Hôm Nay' : "Today's Sales",
      value: formatCurrency(todayCompletedSales),
      icon: <Receipt className="w-4 h-4" />,
      iconColor: 'text-emerald-500',
      variant: 'success',
      isLoading,
    },
    {
      id: 'completed-today',
      label: language === 'vi' ? 'Đơn Hoàn Tất Hôm Nay' : 'Completed Orders',
      value: completedTodayOrders.length,
      unit: language === 'vi' ? 'đơn' : 'orders',
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: 'text-primary',
      variant: 'primary',
      isLoading,
    },
    {
      id: 'total-orders',
      label: language === 'vi' ? 'Tổng Giao Dịch Tạo' : 'Total Orders Created',
      value: todayOrderCount,
      unit: language === 'vi' ? 'đơn' : 'orders',
      icon: <ShoppingCart className="w-4 h-4" />,
      iconColor: 'text-blue-500',
      variant: 'info',
      isLoading,
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header with Primary Action Button */}
      <PageHeader
        title={language === 'vi' ? 'Bàn Làm Việc Bán Hàng & Thu Ngân' : 'Sales & Cashier Workspace'}
        description={
          language === 'vi'
            ? `Theo dõi hàng đợi đơn hàng, xử lý đơn chờ thanh toán và phục vụ khách tại quầy. Cơ sở: ${activeBranchName}.`
            : `Track branch orders queue, process pending payments, and checkout counter sales. Scope: ${activeBranchName}.`
        }
        icon={<ShoppingCart className="w-6 h-6 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              id="tour-sales-guide-btn"
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('psp_sandbox_mode', 'true');
                  const url = new URL(window.location.href);
                  url.searchParams.set('mode', 'training');
                  window.history.replaceState({}, '', url.toString());
                } catch {
                  // ignore
                }
                startTour();
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-1.5 text-xs h-9 px-3 neu-raised active:shadow-inset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
              <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
            </Button>
            <Button
              id="tour-sales-open-pos"
              variant="primary"
              onClick={() => navigate('/pos')}
              className="gap-2 text-xs h-9 px-4 shadow-md font-semibold"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === 'vi' ? 'Mở Màn Hình POS' : 'Open POS Terminal'}</span>
            </Button>
          </div>
        }
      />

      {/* Sandbox Alert Banner */}
      {isSandboxMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {language === 'vi'
                ? 'Chế độ Thực hành: Dữ liệu bán lẻ & thu ngân giả lập an toàn'
                : 'Sandbox Mode: Isolated sales & cashier training data active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                salesSandboxService.resetToDefault();
                toast.success(
                  language === 'vi' ? 'Đã đặt lại dữ liệu thực hành Sales!' : 'Reset sandbox data successfully!',
                  { icon: '🔄' }
                );
              }}
              className="h-8 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Sandbox'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exitSandboxMode({
                  searchParams,
                  setSearchParams,
                  language,
                });
              }}
              className="h-8 text-xs bg-card border-border hover:bg-rose-500/10 hover:border-rose-500/40 text-muted-foreground hover:text-rose-500 cursor-pointer font-semibold"
              title={language === 'vi' ? 'Thoát khỏi chế độ thực hành ngay lập tức' : 'Exit sandbox mode immediately'}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              <span>{language === 'vi' ? 'Thoát Thực Hành' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. Role Context Ribbon */}
      <div id="tour-sales-ribbon" className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="font-semibold uppercase tracking-wider text-[11px]">
            {language === 'vi' ? 'Chuyên Viên Bán Hàng (Sales)' : 'Sales Specialist'}
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-primary" />
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
          <span>{language === 'vi' ? 'Quầy Thu Ngân Trực Tuyến' : 'Register Live'}</span>
        </div>
      </div>

      {/* 3. Operational Blockers / Exceptions: Pending Orders Requiring Collection */}
      {pendingOrdersCount > 0 && (
        <div id="tour-sales-exception">
          <ExceptionPanel
            severity="warning"
            title={language === 'vi' ? 'Cảnh Báo: Đơn Hàng Đang Chờ Thu Ngân Xử Lý' : 'Warning: Orders Awaiting Cashier Payment'}
            description={
              language === 'vi'
                ? `Hiện có ${pendingOrdersCount} đơn hàng ở trạng thái Chờ Thanh Toán (Pending). Vui lòng hoàn tất thu tiền hoặc hủy đơn tránh giữ tồn kho ảo.`
                : `There are ${pendingOrdersCount} pending orders awaiting cashier confirmation or payment.`
            }
            count={pendingOrdersCount}
            actionText={language === 'vi' ? 'Mở danh sách đơn chờ' : 'View Pending Orders'}
            onActionClick={() => navigate('/sales?status=Pending')}
            items={pendingOrders.slice(0, 3).map((o) => ({
              id: o.id,
              title: `${o.code || o.orderCode || o.id.slice(0, 8)} — ${o.customerName || 'Khách lẻ'}`,
              subtitle: `Tổng tiền: ${formatCurrency(o.total || (o as any).totalAmount || 0)} • Tạo lúc: ${o.createdAt ? new Date(o.createdAt).toLocaleTimeString('vi-VN') : '—'}`,
              badge: language === 'vi' ? 'Chờ thanh toán' : 'Pending',
              actionText: language === 'vi' ? 'Thu tiền' : 'Collect',
              onAction: () => navigate('/sales'),
            }))}
          />
        </div>
      )}

      {/* 4. Core Work Queue: Dual Actionable Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue 1: Đơn Chờ Thanh Toán (Pending Orders Queue) */}
        <div id="tour-sales-pending-queue">
          <WorkQueueTable<SalesOrderDto>
          title={language === 'vi' ? 'Hàng Đợi Đơn Chờ Thanh Toán' : 'Pending Orders Queue'}
          description={language === 'vi' ? 'Các giao dịch chưa thanh toán cần thu tiền' : 'Unpaid orders requiring cashier follow-up'}
          icon={<Clock className="w-4 h-4" />}
          iconColor="text-amber-500"
          badge={pendingOrdersCount > 0 ? { text: `${pendingOrdersCount} đơn`, variant: 'warning' } : undefined}
          data={pendingOrders}
          isLoading={isLoading}
          emptyMessage={language === 'vi' ? 'Không có đơn hàng nào đang chờ thanh toán.' : 'No pending orders waiting for payment.'}
          actionText={language === 'vi' ? 'Quản lý đơn' : 'Manage Orders'}
          onActionClick={() => navigate('/sales')}
          onRowClick={() => navigate('/sales')}
          columns={[
            {
              key: 'code',
              header: language === 'vi' ? 'Mã đơn' : 'Order Code',
              render: (o) => (
                <span className="font-mono font-bold text-primary">
                  {o.code || o.orderCode || o.id.slice(0, 8)}
                </span>
              ),
            },
            {
              key: 'customerName',
              header: language === 'vi' ? 'Khách hàng' : 'Customer',
              render: (o) => (
                <span className="font-medium text-foreground">
                  {o.customerName || (language === 'vi' ? 'Khách lẻ' : 'Walk-in')}
                </span>
              ),
            },
            {
              key: 'total',
              header: language === 'vi' ? 'Số tiền' : 'Amount',
              align: 'right',
              render: (o) => (
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(o.total || (o as any).totalAmount || 0)}
                </span>
              ),
            },
            {
              key: 'action',
              header: language === 'vi' ? 'Thao tác' : 'Action',
              align: 'center',
              render: (o) => (
                <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleQuickComplete(e, o.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    title={language === 'vi' ? 'Duyệt & Thu tiền ngay' : 'Collect payment'}
                  >
                    <Check className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Thu tiền' : 'Pay'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickCancel(e, o.id)}
                    className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-500 font-semibold text-[11px] border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    title={language === 'vi' ? 'Hủy đơn' : 'Cancel order'}
                  >
                    <X className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Hủy' : 'Cancel'}</span>
                  </button>
                </div>
              ),
            },
          ]}
        />
        </div>

        {/* Queue 2: Đơn Hàng Gần Đây Tại Chi Nhánh (Recent Sales) */}
        <div id="tour-sales-recent-queue">
          <WorkQueueTable<SalesOrderDto>
            title={language === 'vi' ? 'Đơn Hàng Gần Đây Tại Chi Nhánh' : 'Recent Branch Orders'}
            description={language === 'vi' ? 'Các giao dịch vừa thanh toán tại cơ sở' : 'Latest completed retail transactions'}
            icon={<Receipt className="w-4 h-4" />}
            iconColor="text-emerald-500"
            data={recentOrders}
            isLoading={isLoading}
            emptyMessage={language === 'vi' ? 'Chưa có đơn hàng nào tại chi nhánh này hôm nay.' : 'No orders recorded for this branch yet.'}
            actionText={language === 'vi' ? 'Xem tất cả' : 'View All'}
            onActionClick={() => navigate('/sales')}
            onRowClick={() => navigate('/sales')}
            columns={[
              {
                key: 'code',
                header: language === 'vi' ? 'Mã đơn' : 'Order Code',
                render: (o) => (
                  <span className="font-mono font-bold text-foreground">
                    {o.code || o.orderCode || o.id.slice(0, 8)}
                  </span>
                ),
              },
              {
                key: 'customerName',
                header: language === 'vi' ? 'Khách hàng' : 'Customer',
                render: (o) => (
                  <span className="text-muted-foreground truncate max-w-[120px] inline-block">
                    {o.customerName || (language === 'vi' ? 'Khách lẻ' : 'Walk-in')}
                  </span>
                ),
              },
              {
                key: 'total',
                header: language === 'vi' ? 'Số tiền' : 'Total',
                align: 'right',
                render: (o) => (
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(o.total || (o as any).totalAmount || 0)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: language === 'vi' ? 'Trạng thái' : 'Status',
                align: 'center',
                render: (o) => (
                  <Badge
                    variant={
                      o.status === 'Completed'
                        ? 'success'
                        : o.status === 'Pending'
                        ? 'warning'
                        : 'default'
                    }
                    className="text-[10px]"
                  >
                    {o.status === 'Completed'
                      ? (language === 'vi' ? 'Hoàn tất' : 'Paid')
                      : o.status === 'Pending'
                      ? (language === 'vi' ? 'Chờ TT' : 'Pending')
                      : (o.status || '—')}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* 5. Operational Launchers: Quick Actions Grid */}
      <QuickActions
        title={language === 'vi' ? 'Lối Tắt Nghiệp Vụ Bán Hàng' : 'Sales Operational Launchers'}
        description={language === 'vi' ? 'Truy cập nhanh vào các màn hình làm việc thu ngân' : 'One-click shortcuts to sales counter tools'}
        actions={quickActionsList}
        columns={3}
      />

      {/* 6. Useful Context: Fast-selling items for walk-in upselling */}
      {topFastSelling.length > 0 && (
        <Card id="tour-sales-top-selling" className="p-4 neu-raised border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" />
              <h4 className="font-heading font-bold text-sm text-foreground">
                {language === 'vi' ? 'Sản Phẩm Bán Nhanh Tại Quầy Hôm Nay' : "Today's Top Moving Counter Products"}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/products')}
              className="text-xs text-primary"
            >
              {language === 'vi' ? 'Tra cứu tồn kho' : 'Stock lookup'}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topFastSelling.map((item, idx) => (
              <div
                key={item.sku || idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-card/60 border border-border/30 text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{item.sku}</p>
                </div>
                <Badge variant="primary" className="font-mono text-[11px] shrink-0">
                  {item.qty} {language === 'vi' ? 'đã bán' : 'sold'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 7. Supporting Summary Badges (Positioned at bottom, compact, non-intrusive) */}
      <SupportingBadges
        title={language === 'vi' ? 'Tóm Tắt Ca Thu Ngân Hôm Nay' : "Today's Register Summary"}
        items={summaryBadges}
      />
    </div>
  );
};
