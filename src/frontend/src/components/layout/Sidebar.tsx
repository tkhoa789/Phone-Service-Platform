import React from 'react';
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
  ClipboardCheck
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSystemStore } from '../../stores/systemStore';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
  badge?: string;
}

const navItemDefs: NavItemDef[] = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Owner', 'Admin', 'Manager'] },
  { key: 'pos', path: '/pos', icon: ShoppingCart, badge: 'POS', roles: ['Owner', 'Admin', 'Manager', 'Sales'] },
  { key: 'sales', path: '/sales', icon: Receipt, roles: ['Owner', 'Admin', 'Manager', 'Sales'] },
  { key: 'vouchers', path: '/vouchers', icon: Tag, roles: ['Owner', 'Admin', 'Manager', 'Sales'] },
  { key: 'products', path: '/products', icon: Smartphone, roles: ['Owner', 'Admin', 'Manager', 'Sales', 'Inventory', 'Technician'] },
  { key: 'warehouses', path: '/warehouses', icon: Store, roles: ['Owner', 'Admin', 'Manager', 'Inventory'] },
  { key: 'inventory', path: '/inventory', icon: Package, roles: ['Owner', 'Admin', 'Manager', 'Inventory', 'Technician', 'Warranty'] },
  { key: 'stockTake', path: '/stock-take', icon: ClipboardCheck, roles: ['Owner', 'Admin', 'Manager', 'Inventory', 'Technician'] },
  { key: 'suppliers', path: '/suppliers', icon: Building2, badge: 'Nợ', roles: ['Owner', 'Admin', 'Manager', 'Inventory'] },
  { key: 'repairs', path: '/repairs', icon: Wrench, badge: 'Sửa', roles: ['Owner', 'Admin', 'Manager', 'Technician'] },
  { key: 'warranties', path: '/warranties', icon: ShieldCheck, roles: ['Owner', 'Admin', 'Manager', 'Warranty', 'Sales'] },
  { key: 'aiChat', path: '/ai-chat', icon: Bot, badge: 'AI' }, // All roles can access AI Assistant
  { key: 'customers', path: '/customers', icon: Users, roles: ['Owner', 'Admin', 'Manager', 'Sales', 'Warranty'] },
  { key: 'branches', path: '/branches', icon: Store, roles: ['Owner', 'Admin'] },
  { key: 'users', path: '/users', icon: Users, roles: ['Owner', 'Admin'] },
  { key: 'settings', path: '/settings', icon: Settings, roles: ['Owner', 'Admin'] },
  { key: 'auditLogs', path: '/audit-logs', icon: FileText, roles: ['Owner', 'Admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, logout } = useAuthStore();
  const { settings } = useSystemStore();
  const { language } = useThemeStore();

  const navTranslations = i18nDictionary[language === 'vi' ? 'vi' : 'en'].nav;
  const commonTranslations = i18nDictionary[language === 'vi' ? 'vi' : 'en'].common;

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-200 ease-in-out bg-[var(--neu-bg-base)] shadow-[var(--neu-shadow-outer)] flex flex-col border-r border-[var(--neu-border)] -translate-x-full md:translate-x-0 ${
        collapsed ? 'md:w-20' : 'md:w-64'
      }`}
    >
      {/* Floating Border Toggle Button */}
      <Button variant="outline"
        onClick={onToggleCollapse}
        className="absolute -right-3.5 top-4 z-50 w-7 h-7 rounded-full bg-[var(--neu-bg-base)] border border-slate-300/40 text-slate-500 hover:text-[var(--neu-accent-mint)] shadow-[var(--neu-shadow-button)] hidden md:flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-[var(--neu-border)] px-4 shrink-0 ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="relative w-10 h-10 aspect-square rounded-2xl bg-[var(--neu-bg-base)] overflow-hidden flex items-center justify-center text-[var(--neu-accent-mint)] shrink-0 shadow-inner border border-border/50 bg-muted/20">
            {settings.systemLogoUrl ? (
              <img src={settings.systemLogoUrl} alt="Logo" className="w-full h-full aspect-square object-cover" />
            ) : (
              <Smartphone className="w-5 h-5 text-[var(--neu-accent-mint)]" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-sm text-[var(--neu-text-title)] tracking-tight leading-tight truncate max-w-[140px]" title={settings.systemName}>
                {settings.systemName}
              </span>
              <span className="text-[10px] text-[var(--neu-text-sub)] font-medium leading-none mt-1">Enterprise POS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-4 px-3 space-y-2">
        {navItemDefs.map((item) => {
          if (item.roles && !item.roles.some((r) => roles.includes(r))) {
            return null;
          }

          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const title = navTranslations[item.key];

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                isActive
                  ? 'bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] font-medium shadow-inner border border-border/50 bg-muted/20 border-l-4 border-[var(--neu-accent-mint)]'
                  : 'text-[var(--neu-text-sub)] hover:text-[var(--neu-accent-mint)] bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:shadow-sm'
              }`}
              title={collapsed ? title : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--neu-accent-mint)] font-bold' : 'text-[var(--neu-text-sub)] group-hover:text-[var(--neu-accent-mint)]'}`} />
              
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 overflow-hidden">
                  <span className={`truncate text-sm ${isActive ? 'font-medium text-[var(--neu-text-title)]' : 'font-normal'}`}>{title}</span>
                  {item.badge && (
                    <Badge variant={isActive ? 'success' : 'default'} className="text-[10px] py-0 px-1.5 rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}

              {isActive && !collapsed && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--neu-accent-mint-glow)] shadow-[0_0_8px_var(--neu-accent-mint-glow)]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Account Control */}
      <div className="h-16 border-t border-[var(--neu-border)] bg-[var(--neu-bg-base)] shrink-0 flex items-center px-3">
        {collapsed ? (
          <Button variant="outline"
            onClick={() => navigate('/profile')}
            className="w-10 h-10 aspect-square rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white font-bold flex items-center justify-center text-sm mx-auto shadow-[var(--neu-shadow-button)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            title={commonTranslations.profile}
          >
            {user?.fullName?.charAt(0) || 'U'}
          </Button>
        ) : (
          <div className="w-full flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-[var(--neu-bg-base)] border border-transparent shadow-inner border border-border/50 bg-muted/20 transition-all">
            <Button variant="outline"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl"
              title={commonTranslations.profile}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-[var(--neu-shadow-button)]">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-[var(--neu-text-title)] truncate leading-tight">{user?.fullName || 'Nội bộ System'}</p>
                <p className="text-[10px] text-[var(--neu-accent-mint)] font-mono font-bold truncate leading-tight mt-0.5">
                  {roles[0] || 'Member'}
                </p>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title={commonTranslations.logout}
              className="hover:text-rose-500 hover:bg-rose-500/10 text-slate-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};
