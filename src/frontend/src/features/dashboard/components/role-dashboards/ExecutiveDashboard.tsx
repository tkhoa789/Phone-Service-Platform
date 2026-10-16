import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { useBranchStore } from '../../../../stores/branchStore';
import { useThemeStore } from '../../../../stores/themeStore';
import { useDashboardStats, useDashboardSupplierDebt } from '../../hooks/useDashboard';
import { useRepairStats } from '../../../repairs/api/useRepairs';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { formatCurrency } from '../../../../utils/formatCurrency';
import { 
  DollarSign, TrendingUp, ShoppingCart, Wrench, ShieldCheck, 
  Building2, Calendar, RefreshCw, Store, Package, AlertTriangle, 
  ArrowRight, Bot, Sparkles, ArrowUpRight, BarChart3, 
  CheckCircle2, Activity, ShieldAlert, AlertCircle,
  GraduationCap, RotateCcw, LogOut
} from 'lucide-react';
import { ManagerApprovalQueue } from '../widgets/ManagerApprovalQueue';
import { MetricCard } from '../widgets/MetricCard';
import { useManagerDashboardTour } from '../../hooks/useManagerDashboardTour';
import { managerSandboxService } from '../../services/managerSandboxService';
import { exitSandboxMode } from '../../../../utils/sandboxUtils';
import toast from 'react-hot-toast';

export const ExecutiveDashboard: React.FC = () => {
  const { roles } = useAuthStore();
  const { activeBranchId, activeBranchName } = useBranchStore();
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isOwner = roles.includes('Owner');
  const isAdmin = roles.includes('Admin') || isOwner;
  const isManager = roles.includes('Manager');

  const isSandboxMode = sessionStorage.getItem('psp_sandbox_mode') === 'true' || searchParams.get('mode') === 'training';
  const { startTour: startManagerTour } = useManagerDashboardTour();

  // Auto start tour if in training mode
  useEffect(() => {
    if ((isManager || isAdmin) && searchParams.get('mode') === 'training') {
      const timer = setTimeout(() => {
        startManagerTour();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isManager, isAdmin, searchParams, startManagerTour]);

  // Real data queries (strictly enabled for executives)
  const { 
    data: stats, 
    isLoading: loading, 
    isError: statsError, 
    refetch: fetchStats 
  } = useDashboardStats(activeBranchId, true);

  const { 
    data: debtData, 
    isLoading: debtLoading,
    refetch: fetchDebt 
  } = useDashboardSupplierDebt(true);

  const {
    data: repairStats,
    refetch: fetchRepairStats
  } = useRepairStats(true);

  const [datePeriod, setDatePeriod] = useState<'month' | '30days' | 'week' | 'today'>('30days');

  const handleRefreshAll = () => {
    fetchStats();
    fetchDebt();
    fetchRepairStats();
  };

  // -------------------------------------------------------------
  // Dynamic Derived Metrics Based on datePeriod Filter
  // -------------------------------------------------------------
  const allDailyRevenues = stats?.thirtyDaysRevenue || [];
  
  // Filter active daily revenue items by selected datePeriod
  const activeDailyRevenues = useMemo(() => {
    if (allDailyRevenues.length === 0) return [];

    if (datePeriod === 'today') {
      return allDailyRevenues.slice(-1);
    }
    if (datePeriod === 'week') {
      return allDailyRevenues.slice(-7);
    }
    if (datePeriod === 'month') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentMonthItems = allDailyRevenues.filter(d => {
        const itemDate = new Date(d.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });
      return currentMonthItems.length > 0 ? currentMonthItems : allDailyRevenues.slice(-30);
    }
    // '30days'
    return allDailyRevenues;
  }, [allDailyRevenues, datePeriod]);

  const totalThirtyDaysSum = allDailyRevenues.reduce((sum, d) => sum + d.revenue, 0);
  const periodRevenueSum = activeDailyRevenues.reduce((sum, d) => sum + d.revenue, 0);

  // Reactive display revenue for the selected timeframe
  const displayRevenue = datePeriod === '30days' 
    ? (stats?.totalRevenue ?? totalThirtyDaysSum) 
    : periodRevenueSum;

  const hasProfitVisibility = stats?.totalProfit !== null && stats?.totalProfit !== undefined;
  const grossMarginPercent = hasProfitVisibility && stats?.totalRevenue && stats.totalRevenue > 0
    ? ((stats.totalProfit as number) / stats.totalRevenue) * 100
    : 0;
  const grossMargin = grossMarginPercent.toFixed(1);

  // Scaled profit matching the selected timeframe
  const displayProfit = hasProfitVisibility
    ? (datePeriod === '30days' 
        ? (stats!.totalProfit as number) 
        : Math.round(displayRevenue * (grossMarginPercent / 100)))
    : null;

  // Scaled units sold matching the timeframe
  const displayUnitsSold = useMemo(() => {
    if (!stats?.unitsSold) return 0;
    if (datePeriod === '30days' || allDailyRevenues.length === 0) return stats.unitsSold;
    const ratio = totalThirtyDaysSum > 0 ? (periodRevenueSum / totalThirtyDaysSum) : (activeDailyRevenues.length / 30);
    return Math.max(1, Math.round(stats.unitsSold * ratio));
  }, [stats?.unitsSold, datePeriod, allDailyRevenues.length, totalThirtyDaysSum, periodRevenueSum, activeDailyRevenues.length]);

  const maxDailyRevenue = activeDailyRevenues.length > 0
    ? Math.max(...activeDailyRevenues.map(d => d.revenue), 1)
    : 1;

  // Peak revenue day in the active timeframe
  const peakDay = activeDailyRevenues.length > 0
    ? activeDailyRevenues.reduce((max, d) => d.revenue > max.revenue ? d : max, activeDailyRevenues[0])
    : null;

  const getPeriodLabel = () => {
    switch (datePeriod) {
      case 'today': return language === 'vi' ? 'Hôm nay' : 'Today';
      case 'week': return language === 'vi' ? '7 ngày qua' : 'Last 7 Days';
      case 'month': return language === 'vi' ? 'Tháng này' : 'This Month';
      case '30days': return language === 'vi' ? '30 ngày qua' : 'Last 30 Days';
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Manager Approval Queue: Chỉ Cửa Hàng Trưởng (Manager) của chi nhánh mới có thẩm quyền duyệt, gỡ bỏ hoàn toàn Owner và Admin */}
      {isManager && !isAdmin && !isOwner && (
        <ManagerApprovalQueue />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. EXECUTIVE HEADER & OPERATIONAL CONTEXT                     */}
      {/* ------------------------------------------------------------- */}
      <PageHeader
        id="tour-manager-header"
        title={language === 'vi' ? 'Trung tâm Điều hành Doanh nghiệp' : 'Executive Command Center'}
        description={
          language === 'vi'
            ? `Giám sát toàn diện doanh thu, lợi nhuận, ca sửa chữa và chuỗi cung ứng. Cơ sở: ${activeBranchName}.`
            : `Comprehensive overview of revenue, profit, repair operations, and supply chain. Scope: ${activeBranchName}.`
        }
        icon={<Sparkles className="w-6 h-6 text-primary" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Standardized Benchmark User Guide button for Manager */}
            {(isManager || isAdmin) && (
              <Button
                id="tour-manager-guide-btn"
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
                  startManagerTour();
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
              </Button>
            )}

            {/* Quick Date Filters */}
            <div className="hidden sm:flex items-center p-1 rounded-xl neu-inset gap-1 text-xs">
              <button
                onClick={() => setDatePeriod('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  datePeriod === 'today' 
                    ? 'shadow-inset text-primary font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'vi' ? 'Hôm nay' : 'Today'}
              </button>
              <button
                onClick={() => setDatePeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  datePeriod === 'month' 
                    ? 'shadow-inset text-primary font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'vi' ? 'Tháng này' : 'This Month'}
              </button>
              <button
                onClick={() => setDatePeriod('30days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  datePeriod === '30days' 
                    ? 'shadow-inset text-primary font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'vi' ? '30 ngày qua' : 'Last 30 Days'}
              </button>
              <button
                onClick={() => setDatePeriod('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  datePeriod === 'week' 
                    ? 'shadow-inset text-primary font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'vi' ? 'Tuần này' : 'This Week'}
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="secondary"
              onClick={handleRefreshAll}
              disabled={loading || debtLoading}
              className="gap-1.5 text-xs h-9 px-3 neu-raised active:shadow-inset"
              aria-label="Làm mới dữ liệu dashboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || debtLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
            </Button>

            {/* Direct Action Shortcuts */}
            <Button
              variant="secondary"
              onClick={() => navigate('/pos')}
              className="gap-1.5 text-xs h-9 px-3 neu-raised active:shadow-inset"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'vi' ? 'Bán hàng (POS)' : 'POS Terminal'}</span>
            </Button>
          </div>
        }
      />

      {/* Amber Sandbox Banner for Store Manager */}
      {isSandboxMode && isManager && (
        <div
          id="tour-manager-sandbox-action"
          className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  {language === 'vi' ? 'CHẾ ĐỘ THỰC HÀNH CỬA HÀNG TRƯỞNG (SANDBOX)' : 'STORE MANAGER SANDBOX WORKSPACE'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ZERO-DB FOOTPRINT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi'
                  ? 'Mô phỏng ca trực Cửa Hàng Trưởng trên Shadow Store độc lập (Zero writes DB). Bạn có thể tự do phê duyệt yêu cầu hủy bill, xử lý lệch kho, xuất linh kiện đắt tiền và kiểm tra cảnh báo chi nhánh.'
                  : 'Branch manager training workspace running in isolated Shadow Store with zero writes to live database.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={startManagerTour}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{language === 'vi' ? 'Bắt đầu Hướng dẫn' : 'Start Tour'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                managerSandboxService.resetAll();
                toast.success(
                  language === 'vi' ? 'Đã khôi phục dữ liệu mẫu duyệt Cửa hàng trưởng!' : 'Reset demo manager approval data successfully!',
                  { icon: '🔄' }
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-card border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Demo'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => exitSandboxMode({ navigate })}
              className="px-3.5 py-2 rounded-xl bg-card border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Thoát Thực hành' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Error state banner if stats failed */}
      {statsError && (
        <div className="p-4 rounded-2xl neu-raised border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{language === 'vi' ? 'Không thể tải số liệu thống kê từ máy chủ. Vui lòng kiểm tra kết nối API.' : 'Failed to load dashboard metrics from backend. Please check network connection.'}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRefreshAll} className="neu-raised">
            {language === 'vi' ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REVENUE TREND & BRANCH BREAKDOWN CHARTS                    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ Doanh thu 30 ngày qua (lg:col-span-2) */}
        <Card id="tour-manager-revenue-trend" className="lg:col-span-2 p-6 rounded-2xl neu-raised border border-border/40 space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {datePeriod === '30days'
                  ? (language === 'vi' ? 'Biểu Đồ Doanh Thu 30 Ngày Gần Nhất' : '30-Day Revenue Trend')
                  : (language === 'vi' ? `Biểu Đồ Doanh Thu (${getPeriodLabel()})` : `Revenue Trend (${getPeriodLabel()})`)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'vi' 
                  ? 'Dữ liệu giao dịch thực tế tổng hợp theo ngày từ cơ sở dữ liệu SQL Server.' 
                  : 'Actual daily revenue aggregated from completed invoices.'}
              </p>
            </div>

            {peakDay && peakDay.revenue > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl neu-inset text-xs">
                <span className="text-muted-foreground">{language === 'vi' ? 'Ngày cao điểm:' : 'Peak:'}</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(peakDay.revenue)}</span>
              </div>
            )}
          </div>

          {/* Visual Bar Representation */}
          <div className="pt-6 pb-2">
            {loading ? (
              <div className="h-44 flex items-end justify-between gap-1.5 px-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${20 + (i % 5) * 15}%` }} />
                ))}
              </div>
            ) : activeDailyRevenues.length > 0 ? (
              <div className="h-44 flex items-end justify-between gap-1 px-1 border-b border-border/40 pb-1">
                {activeDailyRevenues.map((item, idx) => {
                  const heightPercent = item.revenue > 0 
                    ? Math.max(12, Math.min(100, Math.round((item.revenue / maxDailyRevenue) * 100)))
                    : 4;
                  const dateObj = new Date(item.date);
                  const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                  const hasRevenue = item.revenue > 0;

                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="px-2.5 py-1.5 rounded-lg neu-raised-lg bg-card text-foreground text-[11px] shadow-xl border border-border whitespace-nowrap">
                          <div className="font-bold text-primary">{formatCurrency(item.revenue)}</div>
                          <div className="text-muted-foreground font-mono text-[10px]">{formattedDate}</div>
                        </div>
                        <div className="w-2 h-2 rotate-45 bg-card border-r border-b border-border -mt-1" />
                      </div>

                      {/* Bar */}
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          hasRevenue 
                            ? 'bg-gradient-to-t from-primary/80 to-primary shadow-[0_0_8px_var(--primary)] group-hover:brightness-110' 
                            : 'bg-muted/40 group-hover:bg-muted'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                {language === 'vi' ? 'Chưa có bản ghi giao dịch trong giai đoạn này.' : 'No revenue records in this period.'}
              </div>
            )}

            {/* Timeline Axis Labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-2 px-1">
              <span>{activeDailyRevenues[0] ? new Date(activeDailyRevenues[0].date).toLocaleDateString('vi-VN') : ''}</span>
              <span>{getPeriodLabel()}</span>
              <span>{activeDailyRevenues[activeDailyRevenues.length - 1] ? new Date(activeDailyRevenues[activeDailyRevenues.length - 1].date).toLocaleDateString('vi-VN') : ''}</span>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              {datePeriod === '30days'
                ? (language === 'vi' ? 'Tổng doanh thu 30 ngày:' : '30-Day Total:')
                : (language === 'vi' ? `Tổng biểu đồ (${getPeriodLabel()}):` : `Period Total (${getPeriodLabel()}):`)}{' '}
              <strong className="text-foreground">{formatCurrency(periodRevenueSum)}</strong>
            </span>
            <button 
              onClick={() => navigate('/sales')}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'vi' ? 'Xem chi tiết đơn bán hàng' : 'View all sales orders'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Cơ cấu Doanh thu theo Chi nhánh (lg:col-span-1) */}
        <Card className="p-6 rounded-2xl neu-raised border border-border/40 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                {language === 'vi' ? 'Doanh Thu Theo Chi Nhánh' : 'Revenue by Branch'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'vi' ? 'Tỷ trọng doanh số từng cơ sở kinh doanh.' : 'Breakdown by operating store.'}
            </p>
          </div>

          <div className="space-y-3.5 my-auto py-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))
            ) : stats?.branchRevenue && stats.branchRevenue.length > 0 ? (
              stats.branchRevenue.map((b, idx) => {
                const share = stats.totalRevenue > 0
                  ? Math.round((b.revenue / stats.totalRevenue) * 100)
                  : 100;

                return (
                  <div key={b.branchId || idx} className="p-3.5 rounded-xl neu-inset space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground truncate max-w-[60%] flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{b.branchName}</span>
                      </span>
                      <span className="text-primary font-bold font-mono">
                        {formatCurrency(b.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(8, share))}%` }} 
                        />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground font-bold shrink-0">
                        {share}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 rounded-xl neu-inset text-center text-xs text-muted-foreground">
                {language === 'vi' ? 'Chưa có phân bổ chi nhánh.' : 'No branch revenue records.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{language === 'vi' ? 'Cơ sở trực thuộc' : 'Store locations'}</span>
            <button 
              onClick={() => navigate('/branches')}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'vi' ? 'Quản lý chi nhánh' : 'Manage branches'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Role & Status Context Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="font-semibold uppercase tracking-wider text-[11px]">
            {isOwner 
              ? (language === 'vi' ? 'Quản Trị Cấp Cao (Owner)' : 'Executive Owner')
              : isAdmin 
                ? (language === 'vi' ? 'Quản Trị Hệ Thống (Admin)' : 'System Administrator')
                : isManager 
                  ? (language === 'vi' ? 'Quản Lý Chi Nhánh (Manager)' : 'Branch Manager')
                  : (language === 'vi' ? 'Ban Điều Hành' : 'Executive')}
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">{activeBranchName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live SQL Server</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TIER 1: PRIMARY KPI CARDS (6 REAL STANDARDIZED CARDS)      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* KPI 1: Tổng Doanh Thu */}
        <Card className="p-5 space-y-3 neu-raised border border-border/40 hover:neu-raised-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {language === 'vi' ? 'Tổng Doanh Thu' : 'Total Revenue'}
            </span>
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              {loading ? (
                <Skeleton className="h-8 w-36 rounded-lg" />
              ) : (
                formatCurrency(displayRevenue)
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-2 pt-2 border-t border-border/40">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{language === 'vi' ? `Kỳ: ${getPeriodLabel()}` : `Period: ${getPeriodLabel()}`}</span>
              </span>
              <span className="font-mono text-primary font-bold">SQL Real</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Lợi Nhuận Gộp (Nếu có quyền) HOẶC Ca Cần Điều Phối & Tắc Nghẽn (Nếu là Manager) */}
        {hasProfitVisibility ? (
          <Card className="p-5 space-y-3 neu-raised border border-border/40 hover:neu-raised-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {language === 'vi' ? 'Lợi Nhuận Gộp' : 'Gross Profit'}
              </span>
              <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-36 rounded-lg" />
              ) : (
                <>
                  <div className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
                    {formatCurrency(displayProfit!)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-2 pt-2 border-t border-border/40">
                    <span>
                      {language === 'vi' 
                        ? `Biên LN: ${grossMargin}% (${getPeriodLabel()})` 
                        : `Gross Margin: ${grossMargin}% (${getPeriodLabel()})`}
                    </span>
                    <span className="font-mono text-emerald-500 font-bold">BR-1203</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        ) : (
          <MetricCard
            title={language === 'vi' ? 'Lợi Nhuận Gộp' : 'Gross Profit'}
            isRestricted={true}
            restrictedTitle="Bảo mật cấp Doanh nghiệp"
            restrictedMessage="Chỉ số lợi nhuận giới hạn cấp điều hành công ty"
            restrictedCode="RBAC-04"
          />
        )}

        {/* KPI 3: Sản Phẩm Đã Bán */}
        <Card className="p-5 space-y-3 neu-raised border border-border/40 hover:neu-raised-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {language === 'vi' ? 'Sản Phẩm Đã Bán' : 'Units Sold'}
            </span>
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-blue-500">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              {loading ? (
                <Skeleton className="h-8 w-24 rounded-lg" />
              ) : (
                `${displayUnitsSold.toLocaleString('vi-VN')} ${language === 'vi' ? 'sản phẩm' : 'units'}`
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-2 pt-2 border-t border-border/40">
              <span>{language === 'vi' ? `Xuất kho (${getPeriodLabel()})` : `Fulfilled (${getPeriodLabel()})`}</span>
              <span className="font-mono text-blue-500 font-bold">POS/Inv</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Ca Sửa Chữa Đang Xử Lý */}
        <Card 
          id="tour-manager-repairs-kpi"
          onClick={() => navigate('/repairs')}
          className="p-5 space-y-3 neu-raised border border-border/40 hover:neu-raised-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
              {language === 'vi' ? 'Dịch Vụ Đang Sửa Chữa' : 'Open Repairs'}
            </span>
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-amber-500">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              {loading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                `${(stats?.openRepairs ?? 0).toLocaleString('vi-VN')} ${language === 'vi' ? 'ca' : 'cases'}`
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-2 pt-2 border-t border-border/40">
              <span>{language === 'vi' ? 'Đang tiếp nhận & xử lý tại xưởng' : 'In-progress at workshops'}</span>
              <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                {language === 'vi' ? 'Xem ca' : 'View'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Card>

        {/* KPI 5: Yêu Cầu Bảo Hành Active */}
        <Card 
          onClick={() => navigate('/warranties')}
          className="p-5 space-y-3 neu-raised border border-border/40 hover:neu-raised-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
              {language === 'vi' ? 'Yêu Cầu Bảo Hành' : 'Active Warranties'}
            </span>
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-purple-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              {loading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                `${(stats?.openWarranties ?? 0).toLocaleString('vi-VN')} ${language === 'vi' ? 'trường hợp' : 'claims'}`
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-2 pt-2 border-t border-border/40">
              <span>{language === 'vi' ? 'Đối chiếu IMEI & thẩm định RMA' : 'Under IMEI RMA evaluation'}</span>
              <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                {language === 'vi' ? 'Chi tiết' : 'Details'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Card>

        {/* KPI 6: Công Nợ Nhà Cung Cấp */}
        <Card 
          id="tour-manager-supplier-debt"
          onClick={() => navigate('/suppliers')}
          className="p-5 space-y-3 neu-raised border border-border/40 hover:neu-raised-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
              {language === 'vi' ? 'Công Nợ Nhà Cung Cấp' : 'Supplier AP Debt'}
            </span>
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-rose-500">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">
              {debtLoading ? (
                <Skeleton className="h-8 w-36 rounded-lg" />
              ) : (
                formatCurrency(debtData?.totalDebt ?? 0)
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-2 pt-2 border-t border-border/40">
              <span>
                {language === 'vi'
                  ? `${debtData?.indebtedSuppliersCount ?? 0} NCC đang phát sinh nợ`
                  : `${debtData?.indebtedSuppliersCount ?? 0} suppliers with balance`}
              </span>
              <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                {language === 'vi' ? 'Sổ nợ' : 'Ledger'} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TIER 3: ACTIONABLE MODULES: TOP PRODUCTS & DEAD STOCK       */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Top 5 Sản Phẩm Bán Chạy Nhất */}
        <Card className="p-6 rounded-2xl neu-raised border border-border/40 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {language === 'vi' ? 'Top 5 Sản Phẩm Bán Chạy Nhất' : 'Top 5 Best-Selling Products'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'vi' ? 'Số lượng và doanh thu tích lũy từ các đơn hàng hoàn tất.' : 'Accumulated sales volume from completed invoices.'}
            </p>
          </div>

          <div className="space-y-2.5 py-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))
            ) : stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((prod, idx) => (
                <div key={prod.productVariantId || idx} className="p-3 rounded-xl neu-inset flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg neu-raised flex items-center justify-center font-bold text-[11px] text-primary shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate">{prod.productName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{prod.sku}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-primary font-mono">{formatCurrency(prod.revenue)}</div>
                    <div className="text-[10px] text-muted-foreground font-medium">
                      {prod.quantitySold} {language === 'vi' ? 'sản phẩm' : 'units'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl neu-inset text-center text-xs text-muted-foreground">
                {language === 'vi' ? 'Chưa phát sinh dữ liệu sản phẩm bán ra.' : 'No product sales recorded yet.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{language === 'vi' ? 'Danh mục sản phẩm' : 'Product catalog'}</span>
            <button 
              onClick={() => navigate('/products')}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'vi' ? 'Xem kho sản phẩm' : 'View products'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Card 2: Hàng Tồn Kho Chậm Bán (Dead Stock Alert) */}
        <Card className="p-6 rounded-2xl neu-raised border border-border/40 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {language === 'vi' ? 'Cảnh Báo Hàng Tồn Đọng Chậm Bán' : 'Dead Stock & Slow Moving Alert'}
              </h3>
              <Badge variant="warning" className="text-[10px] font-bold">
                {language === 'vi' ? '>= 30 ngày' : '>= 30 days'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'vi' 
                ? 'Sản phẩm có tồn kho > 0 nhưng chưa phát sinh giao dịch bán trong 30 ngày qua.' 
                : 'Items with positive stock but zero sales in the past 30 days.'}
            </p>
          </div>

          <div className="space-y-2.5 py-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))
            ) : stats?.deadStock && stats.deadStock.length > 0 ? (
              stats.deadStock.slice(0, 5).map((item, idx) => (
                <div key={item.productVariantId + idx} className="p-3 rounded-xl neu-inset flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">{item.productName}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span className="truncate">{item.warehouseName}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-foreground font-mono">
                      {item.quantity} {language === 'vi' ? 'tồn' : 'in stock'}
                    </div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {item.daysSinceLastSale >= 999 
                        ? (language === 'vi' ? 'Chưa từng bán' : 'Never sold') 
                        : `${item.daysSinceLastSale} ${language === 'vi' ? 'ngày' : 'days'}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-xl neu-inset text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {language === 'vi' ? 'Tuyệt vời! Không có hàng tồn kho đọng vốn chậm bán.' : 'Great! No slow-moving stock detected.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{language === 'vi' ? 'Kiểm soát hàng tồn' : 'Stock control'}</span>
            <button 
              onClick={() => navigate('/inventory')}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'vi' ? 'Quản lý kho hàng & IMEI' : 'View inventory'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. TIER 4: AI COPILOT & QUICK WORKSPACE LAUNCHERS             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card AI Copilot Assistant */}
        <Card className="md:col-span-2 p-6 rounded-2xl neu-raised border border-border/40 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                  {language === 'vi' ? 'Trợ Lý Kỹ Thuật & Quản Trị AI (RAG)' : 'AI Copilot & Technical Assistant'}
                  <Badge variant="primary" className="text-[10px]">AI Active</Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' 
                    ? 'Hỏi đáp tức thì về chẩn đoán lỗi linh kiện, chiến lược giải phóng hàng đọng vốn hoặc gợi ý bảng giá.' 
                    : 'Instant diagnosis support, stock liquidation advice, and repair pricing recommendations.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Tích hợp mô hình ngôn ngữ lớn RAG chuyên sâu ngành sửa chữa điện thoại' : 'Specialized mobile repair RAG language model'}
            </span>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/ai-chat')}
              className="w-full sm:w-auto text-xs neu-raised active:shadow-inset gap-2"
            >
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'vi' ? 'Mở Khung Chat AI' : 'Launch AI Chat'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </Card>

        {/* Operational Quick Launcher */}
        <Card className="p-6 rounded-2xl neu-raised border border-border/40 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {language === 'vi' ? 'Lối Tắt Tác Vụ Nhanh' : 'Quick Operations'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'vi' ? 'Các phân hệ nghiệp vụ theo vai trò' : 'Role-permitted operational shortcuts'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => navigate('/pos')}
              className="p-2.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-left transition-all cursor-pointer flex flex-col gap-1"
            >
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="font-bold">{language === 'vi' ? 'Bán hàng' : 'POS'}</span>
            </button>
            <button
              onClick={() => navigate('/repairs')}
              className="p-2.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-left transition-all cursor-pointer flex flex-col gap-1"
            >
              <Wrench className="w-4 h-4 text-amber-500" />
              <span className="font-bold">{language === 'vi' ? 'Sửa chữa' : 'Repairs'}</span>
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="p-2.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-left transition-all cursor-pointer flex flex-col gap-1"
            >
              <Package className="w-4 h-4 text-blue-500" />
              <span className="font-bold">{language === 'vi' ? 'Kho & IMEI' : 'Inventory'}</span>
            </button>
            <button
              onClick={() => navigate('/suppliers')}
              className="p-2.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-left transition-all cursor-pointer flex flex-col gap-1"
            >
              <Building2 className="w-4 h-4 text-rose-500" />
              <span className="font-bold">{language === 'vi' ? 'Nhà cung cấp' : 'Suppliers'}</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
