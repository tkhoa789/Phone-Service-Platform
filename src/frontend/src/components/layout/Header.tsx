import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Store,
  Sparkles,
  ShieldAlert,
  Bot,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Menu
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSystemStore } from '../../stores/systemStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { useBranchStore } from '../../stores/branchStore';
import { branchService } from '../../services/branchService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface HeaderProps {
  collapsed: boolean;
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onMobileMenuToggle }) => {
  const { user } = useAuthStore();
  const { settings } = useSystemStore();
  const { theme, language, toggleTheme, setLanguage } = useThemeStore();
  const navigate = useNavigate();

  const { activeBranchId, activeBranchName, setActiveBranch } = useBranchStore();
  const [branches, setBranches] = useState<any[]>([]);

  const isGlobalAdmin = user?.roles?.includes('Owner') || user?.roles?.includes('Admin') || (useAuthStore.getState().roles || []).includes('Owner') || (useAuthStore.getState().roles || []).includes('Admin');

  useEffect(() => {
    if (isGlobalAdmin) {
      branchService.getAll().then((data) => {
        if (data && data.length > 0) {
          setBranches(data);
        }
      }).catch(() => {});
    } else if (user) {
      setActiveBranch(user.branchId || 'default', user.branchName || 'Chi nhánh mặc định');
    }
  }, [isGlobalAdmin, user, setActiveBranch]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 transition-[left] duration-200 ease-in-out bg-[var(--neu-bg-base)] shadow-[var(--neu-shadow-outer)] border-b border-[var(--neu-border)] flex items-center justify-between px-4 md:px-6 left-0 ${
        collapsed ? 'md:left-20' : 'md:left-64'
      }`}
    >
      {/* Left: Global Search & System/Branch Branding */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl">
        <Button
          variant="secondary"
          size="icon"
          className="md:hidden shrink-0"
          onClick={onMobileMenuToggle}
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm sản phẩm, khách hàng, số IMEI, phiếu sửa...' : 'Search products, customers, IMEI, repairs...'}
            className="pl-10 h-10 w-full"
          />
        </div>

        {/* Branch Indicator / Selector */}
        {isGlobalAdmin ? (
          <div className="relative hidden sm:block w-48">
            <Select
              value={activeBranchId || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setActiveBranch('', 'Tất cả chi nhánh');
                } else {
                  const b = branches.find(x => x.id === val);
                  if (b) setActiveBranch(b.id, b.name);
                }
              }}
              className="pl-10 font-bold"
            >
              <option value="all">{language === 'vi' ? '⚡ Tất cả chi nhánh' : '⚡ All Branches'}</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
            <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)] pointer-events-none" />
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--neu-bg-base)] shadow-[var(--neu-shadow-button)] border border-[var(--neu-border)] text-xs text-[var(--neu-text-sub)] flex-nowrap whitespace-nowrap shrink-0">
            <Store className="w-4 h-4 text-[var(--neu-accent-mint)] shrink-0" />
            <span className="text-[var(--neu-text-sub)] font-normal">{language === 'vi' ? 'Chi nhánh:' : 'Branch:'}</span>
            <span className="font-bold text-[var(--neu-accent-mint)] tracking-tight whitespace-nowrap">{activeBranchName || user?.branchName || 'Trụ sở chính'}</span>
          </div>
        )}
      </div>

      {/* Right: AI Shortcut, Notifications, Theme Switcher & Language Selector */}
      <div className="flex items-center gap-3">
        {/* Quick AI RAG Chat Shortcut */}
        <Button
          variant="primary"
          onClick={() => navigate('/ai-chat')}
          className="hidden md:flex"
        >
          <Bot className="w-4 h-4" />
          <span>{language === 'vi' ? 'Hỏi Trợ Lý AI' : 'Ask AI Assistant'}</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
        </Button>

        {/* Multi-Theme Toggle Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Chuyển sang Chủ Đề Đêm (Dark Cyber)' : 'Chuyển sang Chủ Đề Sáng (Light Neumorphism)'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </Button>

        {/* Multi-Language Selector Dropdown */}
        <div className="relative">
          <Button
            variant="secondary"
            onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifications(false); }}
            className="flex items-center gap-1.5 font-bold"
          >
            <Globe className="w-4 h-4 text-[var(--neu-accent-mint)]" />
            <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
          </Button>

          {showLangMenu && (
            <Card className="absolute right-0 mt-3 w-40 py-2 z-50 animate-in fade-in duration-150 rounded-2xl">
              <Button variant="outline"
                onClick={() => { setLanguage('vi'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-left transition-colors ${
                  language === 'vi' ? 'text-[var(--neu-accent-mint)] bg-slate-500/10' : 'text-[var(--neu-text-sub)] hover:text-[var(--neu-accent-mint)]'
                }`}
              >
                <span>🇻🇳</span> Tiếng Việt (VI)
              </Button>
              <Button variant="outline"
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-left transition-colors ${
                  language === 'en' ? 'text-[var(--neu-accent-mint)] bg-slate-500/10' : 'text-[var(--neu-text-sub)] hover:text-[var(--neu-accent-mint)]'
                }`}
              >
                <span>🇬🇧</span> English (EN)
              </Button>
            </Card>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => { setShowNotifications(!showNotifications); setShowLangMenu(false); }}
            title="Thông báo hệ thống"
            className="relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--neu-accent-mint-glow)] animate-ping" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--neu-accent-mint-glow)]" />
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <Card className="absolute right-0 mt-3 w-80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-400/20 pb-2.5 mb-2">
                <span className="font-heading font-medium text-sm text-[var(--neu-text-title)] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--neu-accent-mint)]" /> {language === 'vi' ? 'Thông báo mới' : 'Notifications'}
                </span>
                <Badge variant="success">Real-time</Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-3 rounded-2xl bg-[var(--neu-bg-base)] border border-slate-400/20 shadow-inner border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-[var(--neu-accent-mint)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-[var(--neu-text-title)]">Cảnh báo tồn kho thấp</p>
                      <p className="text-[11px] text-[var(--neu-text-sub)] mt-0.5 font-normal">iPhone 15 Pro Max 256GB chỉ còn 2 máy tại Trụ sở chính.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">5 phút trước</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
};
