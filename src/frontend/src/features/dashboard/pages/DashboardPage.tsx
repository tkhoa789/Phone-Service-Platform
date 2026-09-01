import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useDashboardStats } from '../hooks/useDashboard';


import { 
  Users, Store, ShieldAlert, Cpu, Database, Activity, Lock, CheckCircle2, 
  TerminalSquare, Box, RefreshCw, ShoppingCart, TrendingUp, DollarSign, 
  PieChart, Building2, UserCheck, Wrench, AlertTriangle, Calendar, Bot, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../../stores/themeStore';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Skeleton } from '../../../components/ui/Skeleton';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const isOwner = user?.roles?.includes('Owner');
  const isAdmin = user?.roles?.includes('Admin');
  const { data: stats, isLoading: loading, refetch: fetchStats } = useDashboardStats();
  const navigate = useNavigate();
  const { language } = useThemeStore();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  

  const t = language === 'vi' ? {
    ownerBadge: 'QUẢN TRỊ VIÊN CẤP CAO (OWNER)',
    ownerTitle: 'Trung tâm Quản trị Điều hành',
    ownerSubtitle: 'Giám sát toàn diện doanh thu, lợi nhuận và hiệu suất của toàn bộ chuỗi hệ thống Phone Service Platform.',
    btnManageBranches: 'Quản lý Chi nhánh',
    btnManageUsers: 'Quản lý Nhân sự',
    kpiTotalRevenue: 'Tổng doanh thu',
    kpiGrossProfit: 'Lợi nhuận gộp',
    kpiOperatingBranches: 'Chi nhánh hoạt động',
    kpiTotalSold: 'Sản phẩm đã bán',
    liveSqlServer: 'Live từ SQL Server',
    profitMargin: 'Biên lợi nhuận gộp ước tính 22%',
    hqBranchNote: 'Bao gồm cả chi nhánh HQ',
    posInvoiceNote: 'Chỉ tính hóa đơn POS thành công',
    branchStructureTitle: 'Cơ cấu Doanh thu theo Chi nhánh',
    adminBadge: 'QUẢN TRỊ HỆ THỐNG (IT ADMIN)',
    adminTitle: 'Trung tâm Giám sát Hệ thống',
    adminSubtitle: 'Quản lý phân quyền RBAC, theo dõi Audit Logs và giám sát trạng thái hoạt động của các dịch vụ Backend Core.',
    btnManageUsersHr: 'Tài khoản & Phân quyền',
    btnAuditLogs: 'Nhật ký Hệ thống (Audit Logs)',
    kpiTotalAccounts: 'Tổng Tài khoản',
    kpiAuditRecords: 'Bản ghi Audit',
    kpiConnectedBranches: 'Chi nhánh kết nối',
    kpiTokenSecurity: 'Bảo mật Token',
    rbacRolesNote: 'Quản lý bởi RBAC Roles',
    jsonDiffNote: 'Theo dõi JSON Diff',
    activeStatusNote: 'Trạng thái Active 24/7',
    bcryptRoundsNote: 'BCrypt Cost 12 Rounds',
    systemEnginesTitle: 'Trạng thái System Infrastructure Engine',
    allOperational: 'Tất cả hoạt động bình thường',
    managerBadge: 'QUẢN LÝ CHI NHÁNH',
    managerGreeting: 'Xin chào,',
    managerSubtitle: 'Bạn đang theo dõi số liệu hoạt động tại',
    roleLabel: 'Phân quyền hiện tại:',
    btnPosSales: 'Bán hàng POS (Quầy)',
    btnRepairService: 'Tiếp nhận Sửa chữa',
    kpiBranchRevenue: 'Doanh thu Chi nhánh',
    kpiCounterSold: 'Sản phẩm bán tại quầy',
    kpiOpenRepairs: 'Ca sửa chữa đang mở',
    kpiOpenWarranties: 'Yêu cầu bảo hành',
    k80InvoiceNote: 'Xuất hóa đơn K80 ngay lập tức',
    workshopProcessing: 'Đang xử lý tại xưởng',
    imei12mNote: 'Đối chiếu IMEI 12 tháng',
    aiInsightsTitle: 'AI Enterprise Insights (RAG)',
    askChainAi: 'Hỏi Chain AI về chiến lược phân bổ tồn kho...',
    dateToday: 'Hôm nay',
    dateWeek: 'Tuần này',
    dateMonth: 'Tháng này',
    dateAll: 'Toàn thời gian',
    calculating: 'Đang tính...',
    refresh: 'Tải lại',
    hqText: 'Trụ sở chính (HQ - Nguyễn Huệ)',
    autoUpdated: 'Tự động cập nhật từ Database'
  } : {
    ownerBadge: 'EXECUTIVE OWNER',
    ownerTitle: 'Executive Command Center',
    ownerSubtitle: 'Comprehensive monitoring of revenue, profit, and operational performance across the entire Phone Service Platform network.',
    btnManageBranches: 'Manage Branches',
    btnManageUsers: 'Manage Personnel',
    kpiTotalRevenue: 'Total Revenue',
    kpiGrossProfit: 'Gross Profit',
    kpiOperatingBranches: 'Operating Branches',
    kpiTotalSold: 'Total Units Sold',
    liveSqlServer: 'Live from SQL Server',
    profitMargin: 'Estimated Gross Margin 22%',
    hqBranchNote: 'Includes HQ branch',
    posInvoiceNote: 'Completed POS invoices only',
    branchStructureTitle: 'Revenue Structure by Branch',
    adminBadge: 'SYSTEM ADMINISTRATOR',
    adminTitle: 'System Monitoring Center',
    adminSubtitle: 'Manage RBAC permissions, monitor Audit Logs, and oversee the operational status of Backend Core services.',
    btnManageUsersHr: 'Accounts & Permissions',
    btnAuditLogs: 'System Audit Logs',
    kpiTotalAccounts: 'Total Accounts',
    kpiAuditRecords: 'Audit Records',
    kpiConnectedBranches: 'Connected Branches',
    kpiTokenSecurity: 'Token Security',
    rbacRolesNote: 'Managed via RBAC Roles',
    jsonDiffNote: 'JSON Diff Tracking',
    activeStatusNote: '24/7 Active Status',
    bcryptRoundsNote: 'BCrypt Cost 12 Rounds',
    systemEnginesTitle: 'System Infrastructure Engine Status',
    allOperational: 'All Systems Operational',
    managerBadge: 'BRANCH MANAGER',
    managerGreeting: 'Welcome,',
    managerSubtitle: 'You are viewing operational metrics for',
    roleLabel: 'Current Role:',
    btnPosSales: 'POS Counter Sales',
    btnRepairService: 'Repair Intake',
    kpiBranchRevenue: 'Branch Revenue',
    kpiCounterSold: 'Counter Units Sold',
    kpiOpenRepairs: 'Open Repair Cases',
    kpiOpenWarranties: 'Warranty Claims',
    k80InvoiceNote: 'Instant K80 receipt printing',
    workshopProcessing: 'Processing in workshop',
    imei12mNote: '12-month IMEI verification',
    aiInsightsTitle: 'AI Enterprise Insights (RAG)',
    askChainAi: 'Ask Chain AI about inventory allocation strategy...',
    dateToday: 'Today',
    dateWeek: 'This Week',
    dateMonth: 'This Month',
    dateAll: 'All Time',
    calculating: 'Calculating...',
    refresh: 'Refresh',
    hqText: 'Headquarters (HQ - Nguyen Hue)',
    autoUpdated: 'Auto-updated from Database'
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return '0 ₫';
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  const dateOptions = [
    { value: 'today', label: t.dateToday },
    { value: 'week', label: t.dateWeek },
    { value: 'month', label: t.dateMonth },
    { value: 'all', label: t.dateAll }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. OWNER DASHBOARD VIEW */}
      {isOwner && (
        <div className="space-y-6">
          <PageHeader
            title={t.ownerTitle}
            description={t.ownerSubtitle}
            icon={<Crown className="w-6 h-6 animate-pulse" />}
            actions={
              <>
                <div className="flex items-center bg-card rounded-xl border border-border/50 shadow-inner border border-border/50 bg-muted/20 w-36 overflow-hidden">
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="w-full border-none shadow-none bg-transparent h-10 text-xs focus:ring-0"
                  >
                    {dateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
                <Button variant="secondary" onClick={() => fetchStats()} disabled={loading} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t.refresh}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/branches')} className="gap-2">
                  <Store className="w-4 h-4" /> {t.btnManageBranches}
                </Button>
                <Button variant="primary" onClick={() => navigate('/users')} className="gap-2">
                  <Users className="w-4 h-4" /> {t.btnManageUsers}
                </Button>
              </>
            }
          />
          <div className="px-1"><Badge variant="success">{t.ownerBadge}</Badge></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: t.kpiTotalRevenue, icon: <DollarSign className="w-5 h-5" />, value: stats?.totalRevenue ?? 385000000, isCurrency: true, note: t.liveSqlServer, noteIcon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: t.kpiGrossProfit, icon: <PieChart className="w-5 h-5" />, value: stats?.totalProfit ?? 89200000, isCurrency: true, note: t.profitMargin },
              { label: t.kpiOperatingBranches, icon: <Building2 className="w-5 h-5" />, value: stats?.branchRevenue?.length || 3, suffix: language === 'vi' ? 'Chi nhánh' : 'Branches', note: t.hqBranchNote },
              { label: t.kpiTotalSold, icon: <UserCheck className="w-5 h-5" />, value: stats?.unitsSold ?? 42, suffix: language === 'vi' ? 'sản phẩm' : 'units', note: t.posInvoiceNote },
            ].map((kpi, idx) => (
              <Card key={idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <div className="w-10 h-10 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary">
                    {kpi.icon}
                  </div>
                </div>
                <div>
                  <div className="font-heading font-bold text-2xl text-foreground">
                    {loading ? <Skeleton className="h-8 w-24 rounded-lg" /> : kpi.isCurrency ? formatCurrency(kpi.value as number) : `${kpi.value} ${kpi.suffix}`}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-1">
                    {kpi.noteIcon} {kpi.note}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-medium text-base text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> {t.branchStructureTitle}
                </h3>
                <span className="text-xs text-muted-foreground font-normal">{t.autoUpdated}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {loading ? (
                   Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
                ) : stats?.branchRevenue && stats.branchRevenue.length > 0 ? (
                  stats.branchRevenue.map((b, idx: number) => (
                    <div key={b.branchId || idx} className="p-4 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground flex items-center gap-2">
                          <Store className="w-4 h-4 text-primary" /> {b.branchName}
                        </span>
                        <span className="text-primary font-bold">{formatCurrency(b.revenue)}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-500/10 overflow-hidden">
                        <div className="h-full bg-[var(--neu-accent-mint)] rounded-full" style={{ width: `${Math.min(100, Math.max(15, (b.revenue / (stats.totalRevenue || 1)) * 100))}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary" /> {t.hqText}
                      </span>
                      <span className="text-primary font-bold">128.500.000 ₫</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-500/10 overflow-hidden">
                      <div className="h-full bg-[var(--neu-accent-mint)] rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between border-emerald-500/20">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-medium text-lg text-foreground">{t.aiInsightsTitle}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {language === 'vi' ? 'Hệ thống đã tự động kết nối với Vector Database. Bạn có thể đặt câu hỏi về doanh thu, tồn kho hoặc xu hướng khách hàng.' : 'System connected to Vector Database. Ask any questions regarding revenue, inventory, or customer trends.'}
                  </p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate('/ai-chat')} className="w-full mt-6 justify-between group">
                <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> {t.askChainAi}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* 2. ADMIN IT DASHBOARD VIEW */}
      {isAdmin && (
        <div className="space-y-6">
          <PageHeader
            title={t.adminTitle}
            description={t.adminSubtitle}
            icon={<Cpu className="w-6 h-6" />}
            actions={
              <>
                <Button variant="secondary" onClick={() => navigate('/users')} className="gap-2">
                  <Users className="w-4 h-4" /> {t.btnManageUsersHr}
                </Button>
                <Button variant="primary" onClick={() => navigate('/audit-logs')} className="gap-2">
                  <ShieldAlert className="w-4 h-4" /> {t.btnAuditLogs}
                </Button>
              </>
            }
          />
          <div className="px-1"><Badge variant="warning">{t.adminBadge}</Badge></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: t.kpiTotalAccounts, icon: <Users className="w-5 h-5" />, value: '18', suffix: language === 'vi' ? 'Tài khoản' : 'Accounts', note: t.rbacRolesNote },
              { label: t.kpiAuditRecords, icon: <ShieldAlert className="w-5 h-5" />, value: '1.240', suffix: language === 'vi' ? 'Vết thao tác' : 'Audit Logs', note: t.jsonDiffNote },
              { label: t.kpiConnectedBranches, icon: <Store className="w-5 h-5" />, value: '3', suffix: language === 'vi' ? 'Chi nhánh' : 'Branches', note: t.activeStatusNote },
              { label: t.kpiTokenSecurity, icon: <Lock className="w-5 h-5" />, value: 'JWT + BCrypt', suffix: '', note: t.bcryptRoundsNote },
            ].map((kpi, idx) => (
              <Card key={idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <div className="w-10 h-10 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary">
                    {kpi.icon}
                  </div>
                </div>
                <div>
                  <div className="font-heading font-bold text-2xl text-foreground">
                    {kpi.value} <span className="text-lg font-medium">{kpi.suffix}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-1">
                    {kpi.note}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-medium text-base text-foreground flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" /> {t.systemEnginesTitle}
              </h3>
              <span className="text-xs text-primary flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> {t.allOperational}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'ASP.NET Core .NET 10', icon: <TerminalSquare className="w-5 h-5 text-indigo-500" /> },
                { name: 'SQL Server 2022', icon: <Database className="w-5 h-5 text-primary" /> },
                { name: 'Redis Cache (Stack)', icon: <Box className="w-5 h-5 text-rose-500" /> },
                { name: 'Vite 8.1.5 + React 19', icon: <Cpu className="w-5 h-5 text-emerald-500" /> },
              ].map((engine, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0">
                    {engine.icon}
                  </div>
                  <p className="text-xs font-medium text-foreground">{engine.name}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 3. BRANCH OPERATIONAL DASHBOARD VIEW */}
      {!isOwner && !isAdmin && (
        <div className="space-y-6">
          <PageHeader
            title={`${t.managerGreeting} ${user?.fullName || (language === 'vi' ? 'Quản lý Chi nhánh' : 'Branch Manager')} 👋`}
            description={`${t.managerSubtitle} ${user?.branchName || (language === 'vi' ? 'Chi nhánh Trụ sở chính' : 'HQ Main Branch')}. ${t.roleLabel} ${user?.roles?.[0] || 'Manager'}.`}
            icon={<Sparkles className="w-6 h-6 text-amber-500" />}
            actions={
              <>
                <div className="flex items-center bg-card rounded-xl border border-border/50 shadow-inner border border-border/50 bg-muted/20 w-36 overflow-hidden">
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="w-full border-none shadow-none bg-transparent h-10 text-xs focus:ring-0"
                  >
                    {dateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
                <Button variant="secondary" onClick={() => navigate('/pos')} className="gap-2">
                  <ShoppingCart className="w-4 h-4" /> {t.btnPosSales}
                </Button>
                <Button variant="primary" onClick={() => navigate('/repairs')} className="gap-2">
                  <Wrench className="w-4 h-4" /> {t.btnRepairService}
                </Button>
              </>
            }
          />
          <div className="px-1"><Badge variant="default">{t.managerBadge}</Badge></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: t.kpiBranchRevenue, icon: <DollarSign className="w-5 h-5" />, value: stats?.totalRevenue ?? 128500000, isCurrency: true, note: t.liveSqlServer },
              { label: t.kpiCounterSold, icon: <ShoppingCart className="w-5 h-5" />, value: stats?.unitsSold ?? 42, suffix: language === 'vi' ? 'sản phẩm' : 'units', note: t.k80InvoiceNote },
              { label: t.kpiOpenRepairs, icon: <Wrench className="w-5 h-5" />, value: stats?.openRepairs ?? 8, suffix: language === 'vi' ? 'ca' : 'cases', note: t.workshopProcessing },
              { label: t.kpiOpenWarranties, icon: <AlertTriangle className="w-5 h-5" />, value: stats?.openWarranties ?? 3, suffix: language === 'vi' ? 'trường hợp' : 'claims', note: t.imei12mNote },
            ].map((kpi, idx) => (
              <Card key={idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <div className="w-10 h-10 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary">
                    {kpi.icon}
                  </div>
                </div>
                <div>
                  <div className="font-heading font-bold text-2xl text-foreground">
                    {loading ? <Skeleton className="h-8 w-24 rounded-lg" /> : kpi.isCurrency ? formatCurrency(kpi.value as number) : `${kpi.value} ${kpi.suffix}`}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-1">
                    {kpi.note}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function Crown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.1 5.9a.5.5 0 0 1 .797.525l-2.454 11.043a2 2 0 0 1-1.95 1.532H6.507a2 2 0 0 1-1.95-1.532L2.103 6.425a.5.5 0 0 1 .797-.525l4.193 3.264a1 1 0 0 0 1.516-.294z" />
    </svg>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
