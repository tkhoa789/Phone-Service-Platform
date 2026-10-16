import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { 
  Layout, Menu, ChevronLeft, ChevronRight, Store, User, 
  Bell, Globe, Moon, Sun, Bot, Sparkles, Check, Search,
  Smartphone, Wrench, Package, ShieldCheck, ShoppingCart,
  Receipt, Tag, Building2, ClipboardCheck, Users, Settings, FileText
} from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useBranchStore } from '../../stores/branchStore';

export const ApplicationShellShowcaseSection: React.FC = () => {
  const { theme, toggleTheme, language, setLanguage } = useThemeStore();
  const { user, roles } = useAuthStore();
  const { activeBranchName } = useBranchStore();

  const [demoCollapsed, setDemoCollapsed] = useState(false);
  const [demoActiveRoute, setDemoActiveRoute] = useState('/dashboard');
  const [demoUserMenuOpen, setDemoUserMenuOpen] = useState(false);
  const [demoBranchMenuOpen, setDemoBranchMenuOpen] = useState(false);
  const [selectedBranchDemo, setSelectedBranchDemo] = useState('Chi nhánh Quận 1 (Trần Hưng Đạo)');

  const branchList = [
    'Tất cả chi nhánh',
    'Chi nhánh Quận 1 (Trần Hưng Đạo)',
    'Chi nhánh Ba Đình (Kim Mã)',
    'Kho Tổng Tân Bình',
    'Trung tâm Bảo hành Cầu Giấy'
  ];

  const demoNavGroups = [
    {
      title: 'Tổng quan & Bán hàng',
      items: [
        { path: '/dashboard', label: 'Tổng quan', icon: Layout },
        { path: '/pos', label: 'Bán hàng (POS)', icon: ShoppingCart, badge: 'POS' },
        { path: '/sales', label: 'Đơn hàng & Hóa đơn', icon: Receipt },
        { path: '/vouchers', label: 'Mã giảm giá (Vouchers)', icon: Tag },
      ]
    },
    {
      title: 'Dịch vụ & Kỹ thuật',
      items: [
        { path: '/repairs', label: 'Dịch vụ Sửa chữa', icon: Wrench, badge: 'Sửa' },
        { path: '/warranties', label: 'Bảo hành Thiết bị', icon: ShieldCheck },
        { path: '/customers', label: 'Khách hàng', icon: Users },
      ]
    },
    {
      title: 'Kho hàng & Chuỗi cung ứng',
      items: [
        { path: '/products', label: 'Sản phẩm & Biến thể', icon: Smartphone },
        { path: '/inventory', label: 'Tồn kho & IMEI', icon: Package },
        { path: '/stock-take', label: 'Kiểm kê kho hàng', icon: ClipboardCheck },
        { path: '/suppliers', label: 'Nhà Cung Cấp & Công Nợ', icon: Building2, badge: 'Nợ' },
        { path: '/warehouses', label: 'Danh sách Kho bãi', icon: Store },
      ]
    },
    {
      title: 'Hệ thống & Quản trị',
      items: [
        { path: '/ai-chat', label: 'Trợ lý AI (RAG)', icon: Bot, badge: 'AI' },
        { path: '/branches', label: 'Quản lý Chi nhánh', icon: Store },
        { path: '/users', label: 'Quản lý Nhân sự', icon: Users },
        { path: '/audit-logs', label: 'Nhật ký Audit Log', icon: FileText },
        { path: '/settings', label: 'Cấu hình Hệ thống', icon: Settings },
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 shadow-sm mb-3">
            <Layout className="w-3.5 h-3.5" /> UIUX-03 Application Shell
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground tracking-tight">
            PSP Application Shell Architecture
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Kiến trúc khung ứng dụng hợp nhất: Header tinh gọn L1, Sidebar tổ chức nhóm phân cấp (Grouped Business Modules),
            User Menu đa chức năng, Bộ chuyển đổi Chi nhánh (Branch Switcher) và Breadcrumb điều hướng.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            onClick={() => setDemoCollapsed(!demoCollapsed)}
          >
            {demoCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{demoCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}</span>
          </Button>
          <Button
            variant="primary"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{theme === 'light' ? 'Chế độ Tối' : 'Chế độ Sáng'}</span>
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LIVE HEADER PREVIEW MATRIX                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">1. Header Information Hierarchy & Controls</h2>
            <p className="text-xs text-muted-foreground">Cao 64px (h-16), nổi L1, tìm kiếm toàn cục, bộ chọn chi nhánh, nút AI, chuông thông báo và menu tài khoản.</p>
          </div>
          <Badge variant="primary">Header Level 1</Badge>
        </div>

        <Card variant="raised" className="p-4 md:p-6 space-y-6">
          {/* Mock Header Canvas */}
          <div className="rounded-2xl border border-border/40 bg-card p-3 md:p-4 neu-raised flex items-center justify-between gap-4">
            {/* Left Header Mock */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl neu-raised flex items-center justify-center text-muted-foreground shrink-0 md:hidden">
                <Menu className="w-4 h-4" />
              </div>

              {/* Global Search Mock */}
              <div className="relative max-w-xs w-full hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, khách hàng, IMEI..."
                  readOnly
                  className="w-full bg-card border border-border/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-inset focus:outline-none"
                />
              </div>

              {/* Branch Switcher Mock */}
              <div className="relative">
                <button
                  onClick={() => setDemoBranchMenuOpen(!demoBranchMenuOpen)}
                  className="px-3 py-1.5 rounded-xl bg-surface-elevated neu-raised border border-border/40 text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer active:shadow-inset"
                >
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[180px]">{selectedBranchDemo}</span>
                  <Badge variant="primary" className="text-[10px] py-0 px-1.5">Trụ sở</Badge>
                </button>

                {demoBranchMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-card border border-border/40 neu-raised-lg p-2 shadow-2xl z-50 animate-in fade-in">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">Chọn chi nhánh làm việc</p>
                    {branchList.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setSelectedBranchDemo(b);
                          setDemoBranchMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          selectedBranchDemo === b ? 'bg-primary/15 text-primary font-bold shadow-inset' : 'text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <span className="truncate">{b}</span>
                        {selectedBranchDemo === b && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Header Mock */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-md shadow-primary/25 cursor-pointer">
                <Bot className="w-3.5 h-3.5" />
                <span>Hỏi Trợ Lý AI</span>
                <Sparkles className="w-3 h-3 text-emerald-200 animate-pulse" />
              </button>

              <button className="w-8 h-8 rounded-xl neu-raised flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              </button>

              <button className="h-8 px-2.5 rounded-xl neu-raised flex items-center gap-1 text-xs font-semibold text-foreground cursor-pointer">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>🇻🇳 VI</span>
              </button>

              <button className="w-8 h-8 rounded-xl neu-raised flex items-center justify-center text-muted-foreground hover:text-foreground relative cursor-pointer">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              </button>

              {/* User Menu Trigger Mock */}
              <div className="relative">
                <button
                  onClick={() => setDemoUserMenuOpen(!demoUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl neu-raised cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-card shadow-inset border border-border/40 text-primary font-bold text-xs flex items-center justify-center">
                    {user?.fullName?.charAt(0) || 'A'}
                  </div>
                  <span className="text-xs font-semibold text-foreground hidden md:inline pr-1">
                    {user?.fullName || 'Admin User'}
                  </span>
                </button>

                {demoUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border/40 neu-raised-lg p-3 shadow-2xl z-50 animate-in fade-in">
                    <div className="pb-2.5 border-b border-border/30">
                      <p className="text-xs font-bold text-foreground truncate">{user?.fullName || 'Admin User'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">admin@psp.vn</p>
                      <Badge variant="primary" dot className="mt-1.5">Quản Trị Viên (Owner)</Badge>
                    </div>
                    <div className="py-2 space-y-1 text-xs">
                      <div className="px-2 py-1.5 rounded-lg text-foreground hover:bg-muted/30 cursor-pointer flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" /> Hồ sơ cá nhân
                      </div>
                      <div className="px-2 py-1.5 rounded-lg text-foreground hover:bg-muted/30 cursor-pointer flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-muted-foreground" /> Cài đặt hệ thống
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <div className="px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer">
                        Đăng xuất tài khoản
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR ARCHITECTURE PREVIEW                                 */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">2. Sidebar Grouping & Collapsible Behavior</h2>
            <p className="text-xs text-muted-foreground">4 nhóm module chức năng, trạng thái lún `shadow-inset`, đốm LED Cyber Mint và thu gọn gọn gàng.</p>
          </div>
          <Badge variant={demoCollapsed ? 'default' : 'primary'}>
            {demoCollapsed ? 'Collapsed (20 / 80px)' : 'Expanded (64 / 256px)'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Interactive Mock Preview */}
          <div className={`transition-all duration-200 ${demoCollapsed ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
            <Card variant="raised" className="overflow-hidden p-0">
              {/* Sidebar Header */}
              <div className="h-14 border-b border-border/40 px-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl neu-raised flex items-center justify-center text-primary shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  {!demoCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">Phone Service Platform</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Enterprise Neumorphic</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setDemoCollapsed(!demoCollapsed)}
                  className="w-7 h-7 rounded-lg neu-raised hover:neu-raised-md active:shadow-inset flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-all"
                  title={demoCollapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                  {demoCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Nav Groups Container */}
              <div className="p-3 space-y-3 max-h-[520px] overflow-y-auto">
                {demoNavGroups.map((grp, gIdx) => (
                  <div key={grp.title} className="space-y-1">
                    {!demoCollapsed ? (
                      <div className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
                        {grp.title}
                      </div>
                    ) : (
                      gIdx > 0 && <div className="h-px bg-border/30 my-1 mx-2" />
                    )}

                    {grp.items.map((item) => {
                      const isActive = demoActiveRoute === item.path;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => setDemoActiveRoute(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'shadow-inset text-primary font-semibold'
                              : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                          } ${demoCollapsed ? 'justify-center px-0' : ''}`}
                          title={demoCollapsed ? item.label : undefined}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          {!demoCollapsed && (
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <span className="text-xs font-medium truncate text-left">{item.label}</span>
                              {item.badge && (
                                <span className={`text-[10px] py-0.5 px-2 rounded-full font-mono font-bold ${
                                  isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'neu-inset text-muted-foreground'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                          {isActive && !demoCollapsed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Sidebar Footer User Area */}
              <div className="h-14 border-t border-border/40 p-2 bg-card flex items-center">
                {!demoCollapsed ? (
                  <div className="w-full flex items-center justify-between gap-2 p-1.5 rounded-xl neu-raised">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-card shadow-inset border border-border/40 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {user?.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate leading-tight">{user?.fullName || 'Admin User'}</p>
                        <p className="text-[10px] text-primary font-mono font-semibold truncate leading-tight">Owner</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-card shadow-inset border border-border/40 text-primary font-bold text-xs flex items-center justify-center mx-auto">
                    {user?.fullName?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Context & Behavior Explanation */}
          <div className={`space-y-4 ${demoCollapsed ? 'lg:col-span-9' : 'lg:col-span-7'}`}>
            <Card variant="raised" className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Trạng thái Route Đang Chọn</h3>
              <div className="p-4 rounded-2xl bg-surface-elevated neu-inset border border-border/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">URL Path:</span>
                  <span className="text-xs font-mono font-bold text-primary">{demoActiveRoute}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Breadcrumb Rendering:</span>
                  <Breadcrumb />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl neu-raised border border-border/40 space-y-1">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" /> Grouped Modules
                  </span>
                  <p className="text-xs text-muted-foreground">
                    17 mục menu được phân thành 4 nhóm nghiệp vụ rõ ràng, cải thiện tốc độ quét mắt của thu ngân và kỹ thuật viên.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl neu-raised border border-border/40 space-y-1">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" /> Haptic Feedback
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Menu item khi được chọn sẽ chìm vào mặt phẳng (`shadow-inset`) kết hợp đốm LED Cyber Mint.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
