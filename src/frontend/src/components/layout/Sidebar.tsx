import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  Smartphone,
  Package,
  Wrench,
  ShieldCheck,
  ShoppingCart,
  Receipt,
  Bot,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Tag,
  Building2,
  ClipboardCheck,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSystemStore } from '../../stores/systemStore';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { PERMISSIONS } from '../../constants/permissions';
import { isPathSupportedForSandbox, purgeSandboxSession } from '../../utils/sandboxUtils';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

interface NavItemDef {
  key: keyof typeof i18nDictionary.vi.nav;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  permission?: string;
}

interface NavGroupDef {
  id: string;
  labelVi: string;
  labelEn: string;
  items: NavItemDef[];
}

const ownerNavGroups: NavGroupDef[] = [
  {
    id: 'owner-strategic',
    labelVi: 'Dashboard & Chiến lược',
    labelEn: 'Strategy & Command',
    items: [
      { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'aiChat', path: '/ai-chat', icon: Bot, permission: PERMISSIONS.AI_Chat },
    ],
  },
  {
    id: 'owner-oversight',
    labelVi: 'Kiểm soát & Giám sát',
    labelEn: 'Oversight & Monitoring',
    items: [
      { key: 'sales', path: '/sales', icon: Receipt, permission: PERMISSIONS.SalesOrder_View },
      { key: 'repairs', path: '/repairs', icon: Wrench, permission: PERMISSIONS.Repair_View },
      { key: 'inventory', path: '/inventory', icon: Package, permission: PERMISSIONS.Inventory_View },
      { key: 'products', path: '/products', icon: Package, permission: PERMISSIONS.Product_View },
      { key: 'customers', path: '/customers', icon: Users, permission: PERMISSIONS.Customer_View },
      { key: 'suppliers', path: '/suppliers', icon: Store, permission: PERMISSIONS.Supplier_View },
    ],
  },
  {
    id: 'owner-governance',
    labelVi: 'Quản trị tối cao',
    labelEn: 'Supreme Governance',
    items: [
      { key: 'branches', path: '/branches', icon: Store, permission: PERMISSIONS.Branch_View },
      { key: 'users', path: '/users', icon: Users, permission: PERMISSIONS.User_View },
      { key: 'settings', path: '/settings', icon: Settings, permission: PERMISSIONS.SystemSettings_View },
      { key: 'auditLogs', path: '/audit-logs', icon: FileText, permission: PERMISSIONS.AuditLog_View },
    ],
  },
];

const adminNavGroups: NavGroupDef[] = [
  {
    id: 'admin-operations',
    labelVi: 'Dashboard & Bán hàng',
    labelEn: 'Core & Sales Operations',
    items: [
      { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'pos', path: '/pos', icon: ShoppingCart, permission: PERMISSIONS.POS_View },
      { key: 'sales', path: '/sales', icon: Receipt, permission: PERMISSIONS.SalesOrder_View },
      { key: 'vouchers', path: '/vouchers', icon: Tag, permission: PERMISSIONS.Voucher_View },
    ],
  },
  {
    id: 'admin-services',
    labelVi: 'Dịch vụ & Khách hàng',
    labelEn: 'Services & Customers',
    items: [
      { key: 'repairs', path: '/repairs', icon: Wrench, permission: PERMISSIONS.Repair_View },
      { key: 'warranties', path: '/warranties', icon: ShieldCheck, permission: PERMISSIONS.Warranty_View },
      { key: 'customers', path: '/customers', icon: Users, permission: PERMISSIONS.Customer_View },
    ],
  },
  {
    id: 'admin-supply',
    labelVi: 'Kho hàng & Chuỗi cung ứng',
    labelEn: 'Supply Chain & Inventory',
    items: [
      { key: 'products', path: '/products', icon: Package, permission: PERMISSIONS.Product_View },
      { key: 'inventory', path: '/inventory', icon: Package, permission: PERMISSIONS.Inventory_View },
      { key: 'stockTake', path: '/stock-take', icon: ClipboardCheck, permission: PERMISSIONS.StockTake_View },
      { key: 'suppliers', path: '/suppliers', icon: Store, permission: PERMISSIONS.Supplier_View },
      { key: 'warehouses', path: '/warehouses', icon: Building2, permission: PERMISSIONS.Warehouse_View },
    ],
  },
  {
    id: 'admin-system',
    labelVi: 'Hệ thống & Điều hành',
    labelEn: 'System & Operations Admin',
    items: [
      { key: 'aiChat', path: '/ai-chat', icon: Bot, permission: PERMISSIONS.AI_Chat },
      { key: 'branches', path: '/branches', icon: Store, permission: PERMISSIONS.Branch_View },
      { key: 'users', path: '/users', icon: Users, permission: PERMISSIONS.User_View },
      { key: 'settings', path: '/settings', icon: Settings, permission: PERMISSIONS.SystemSettings_View },
      { key: 'auditLogs', path: '/audit-logs', icon: FileText, permission: PERMISSIONS.AuditLog_View },
    ],
  },
];

const defaultNavGroups: NavGroupDef[] = [
  {
    id: 'workspace',
    labelVi: 'Dashboard & Tác nghiệp',
    labelEn: 'Operational Workspace',
    items: [
      { 
        key: 'dashboard', 
        path: '/dashboard', 
        icon: LayoutDashboard, 
        roles: ['Manager', 'Sales', 'Technician', 'Warranty', 'Inventory'] 
      },
    ],
  },
  {
    id: 'sales-ops',
    labelVi: 'Bán hàng & Thu ngân',
    labelEn: 'Sales & POS',
    items: [
      { key: 'pos', path: '/pos', icon: ShoppingCart, permission: PERMISSIONS.POS_View, roles: ['Manager', 'Sales'] },
      { key: 'sales', path: '/sales', icon: Receipt, permission: PERMISSIONS.SalesOrder_View, roles: ['Manager', 'Sales'] },
      { key: 'vouchers', path: '/vouchers', icon: Tag, permission: PERMISSIONS.Voucher_View, roles: ['Manager', 'Admin', 'Owner'] },
    ],
  },
  {
    id: 'services',
    labelVi: 'Dịch vụ & Kỹ thuật',
    labelEn: 'Services & Repairs',
    items: [
      { key: 'repairs', path: '/repairs', icon: Wrench, permission: PERMISSIONS.Repair_View, roles: ['Manager', 'Technician', 'Sales'] },
      { key: 'warranties', path: '/warranties', icon: ShieldCheck, permission: PERMISSIONS.Warranty_View, roles: ['Manager', 'Warranty', 'Sales'] },
      { key: 'customers', path: '/customers', icon: Users, permission: PERMISSIONS.Customer_View, roles: ['Manager', 'Sales', 'Warranty', 'Technician'] },
    ],
  },
  {
    id: 'inventory',
    labelVi: 'Kho hàng & Chuỗi cung ứng',
    labelEn: 'Inventory & Supply',
    items: [
      { key: 'products', path: '/products', icon: Package, permission: PERMISSIONS.Product_View, roles: ['Manager', 'Sales', 'Inventory', 'Technician', 'Warranty'] },
      { key: 'inventory', path: '/inventory', icon: Package, permission: PERMISSIONS.Inventory_View, roles: ['Manager', 'Inventory'] },
      { key: 'stockTake', path: '/stock-take', icon: ClipboardCheck, permission: PERMISSIONS.StockTake_View, roles: ['Manager', 'Inventory'] },
      { key: 'suppliers', path: '/suppliers', icon: Store, permission: PERMISSIONS.Supplier_View, roles: ['Manager', 'Inventory'] },
      { key: 'warehouses', path: '/warehouses', icon: Building2, permission: PERMISSIONS.Warehouse_View, roles: ['Manager', 'Inventory'] },
    ],
  },
  {
    id: 'system',
    labelVi: 'Hệ thống & Trợ lý',
    labelEn: 'System & Assistant',
    items: [
      { key: 'aiChat', path: '/ai-chat', icon: Bot, permission: PERMISSIONS.AI_Chat, roles: ['Manager', 'Sales', 'Inventory', 'Technician', 'Warranty'] },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileMenuOpen = false,
  onMobileMenuClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, logout, can, hasPermission } = useAuthStore();
  const checkPermission = typeof can === 'function' ? can : (typeof hasPermission === 'function' ? hasPermission : () => true);
  const { settings, updateSettings } = useSystemStore();
  const { language } = useThemeStore();
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const isSandboxMode = 
    isPathSupportedForSandbox(location.pathname, roles) &&
    (location.search.includes('mode=training') || 
     location.search.includes('sandbox=true') || 
     (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true'));

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [settings.systemLogoUrl]);

  const navTranslations = i18nDictionary[language === 'vi' ? 'vi' : 'en'].nav;
  const commonTranslations = i18nDictionary[language === 'vi' ? 'vi' : 'en'].common;

  const isOwner = roles.includes('Owner');
  const isAdmin = roles.includes('Admin') && !isOwner;

  const currentNavGroups = useMemo(() => {
    if (isOwner) {
      return ownerNavGroups;
    }
    if (isAdmin) {
      return adminNavGroups;
    }
    return defaultNavGroups;
  }, [isOwner, isAdmin]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen && onMobileMenuClose) {
        onMobileMenuClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, onMobileMenuClose]);

  // Whether to show full text labels (always show full text on mobile drawer)
  const showFullText = !collapsed || mobileMenuOpen;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onMobileMenuClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen transition-all duration-200 ease-in-out bg-card flex flex-col border-r border-border/40 z-50 select-none ${
          mobileMenuOpen ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full'
        } md:translate-x-0 ${
          collapsed ? 'md:w-20' : 'md:w-64'
        }`}
        aria-label="Main Navigation"
        aria-hidden={!mobileMenuOpen ? undefined : false}
      >
        {/* Floating Border Toggle Button (Desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full neu-raised hover:neu-raised-md active:shadow-inset text-muted-foreground hover:text-primary hidden md:flex items-center justify-center transition-all cursor-pointer focus:outline-none"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header — One-click access to Role Dashboard */}
        <div className={`h-16 flex items-center border-b border-border/40 px-4 shrink-0 ${!showFullText ? 'justify-center' : 'justify-between'}`}>
          <NavLink
            to={isSandboxMode ? "/dashboard?mode=training" : "/dashboard"}
            onClick={() => {
              if (onMobileMenuClose) onMobileMenuClose();
            }}
            className={`flex items-center gap-3 overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity ${!showFullText ? 'justify-center w-full' : ''}`}
            title="Dashboard"
          >
            <div className="relative w-10 h-10 aspect-square rounded-xl neu-raised overflow-hidden flex items-center justify-center text-primary shrink-0 transition-all group-hover:scale-105">
              {settings.systemLogoUrl && !logoLoadFailed ? (
                <img
                  src={settings.systemLogoUrl}
                  alt="Logo"
                  className="w-full h-full aspect-square object-cover"
                  onError={() => {
                    setLogoLoadFailed(true);
                    updateSettings({ systemLogoUrl: '' });
                  }}
                />
              ) : (
                <Smartphone className="w-5 h-5 text-primary" />
              )}
            </div>
            {showFullText && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-foreground tracking-tight leading-tight truncate max-w-[140px]" title={settings.systemName}>
                  {settings.systemName}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono leading-none mt-1">Enterprise POS</span>
              </div>
            )}
          </NavLink>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileMenuClose}
            className="md:hidden w-8 h-8 rounded-lg neu-raised hover:neu-raised-md active:shadow-inset flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="Đóng menu"
            aria-label="Đóng menu điều hướng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-3 space-y-3">
          {currentNavGroups.map((group, groupIdx) => {
            // Filter items by canonical permission (RBAC-07) and roles
            const visibleItems = group.items.filter((item) => {
              if (item.permission && !checkPermission(item.permission)) {
                return false;
              }
              if (item.roles && item.roles.length > 0) {
                return item.roles.some((r) => roles.includes(r));
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            const groupLabel = language === 'vi' ? group.labelVi : group.labelEn;

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Heading (Expanded vs Collapsed) */}
                {showFullText ? (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
                    {groupLabel}
                  </div>
                ) : (
                  groupIdx > 0 && <div className="h-px bg-border/30 my-1.5 mx-2" />
                )}

                {/* Items in Group */}
                {visibleItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  const title = navTranslations[item.key];
                  const itemTarget = (isSandboxMode && isPathSupportedForSandbox(item.path, roles))
                    ? `${item.path}${item.path.includes('?') ? '&' : '?'}mode=training`
                    : item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={itemTarget}
                      onClick={() => {
                        if (onMobileMenuClose) onMobileMenuClose();
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group relative focus:outline-none ${
                        isActive
                          ? 'shadow-inset text-primary font-semibold'
                          : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                      } ${!showFullText ? 'justify-center px-0' : ''}`}
                      title={!showFullText ? title : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                      
                      {showFullText && (
                        <span className="truncate text-xs font-medium flex-1">{title}</span>
                      )}

                      {isActive && showFullText && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] ml-1 shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Footer Profile & Account Control */}
        <div className="h-16 border-t border-border/40 bg-card shrink-0 flex items-center px-3">
          {!showFullText ? (
            <button
              onClick={() => {
                navigate('/profile');
                if (onMobileMenuClose) onMobileMenuClose();
              }}
              className="w-10 h-10 aspect-square rounded-xl bg-card shadow-inset border border-border/40 text-primary font-bold flex items-center justify-center text-xs mx-auto hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={commonTranslations.profile}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </button>
          ) : (
            <div className="w-full flex items-center justify-between gap-2 p-1.5 rounded-xl neu-raised">
              <button
                onClick={() => {
                  navigate('/profile');
                  if (onMobileMenuClose) onMobileMenuClose();
                }}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none p-1 rounded-lg hover:bg-muted/10 transition-colors"
                title={commonTranslations.profile}
              >
                <div className="w-8 h-8 rounded-lg bg-card shadow-inset border border-border/40 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">{user?.fullName || 'Nội bộ System'}</p>
                  <p className="text-[10px] text-primary font-mono font-medium truncate leading-tight mt-0.5">
                    {roles[0] || 'Member'}
                  </p>
                </div>
              </button>

              <button
                onClick={async () => {
                  purgeSandboxSession();
                  await logout();
                  navigate('/login', { replace: true });
                  if (onMobileMenuClose) onMobileMenuClose();
                }}
                title={commonTranslations.logout}
                className="w-7 h-7 rounded-lg neu-raised hover:neu-raised-md active:shadow-inset flex items-center justify-center text-muted-foreground hover:text-rose-500 cursor-pointer transition-all shrink-0"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
