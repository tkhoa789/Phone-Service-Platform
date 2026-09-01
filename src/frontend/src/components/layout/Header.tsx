import type { BranchDto } from '../../types/api.types';
import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Settings, LogOut, User, Store, ShieldAlert, Sparkles, Moon, Sun, Globe, Bot } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSystemStore } from '../../stores/systemStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { useBranchStore } from '../../stores/branchStore';
import { useBranches } from '../../entities/branch/queries';
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
  const { language, setLanguage } = useThemeStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const { activeBranchId, activeBranchName, setActiveBranch } = useBranchStore();

  const isGlobalAdmin = user?.roles?.includes('Owner') || user?.roles?.includes('Admin') || (useAuthStore.getState().roles || []).includes('Owner') || (useAuthStore.getState().roles || []).includes('Admin');

  // React Query Replacement for manual branch fetching
  const { data: fetchedBranches = [] } = useBranches();
  
  useEffect(() => {
    if (!isGlobalAdmin && user) {
      setActiveBranch(user.branchId || 'default', user.branchName || 'Chi nhÃ¡nh máº·c Ä‘á»‹nh');
    }
  }, [isGlobalAdmin, user, setActiveBranch]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 transition-[left] duration-200 ease-in-out bg-card shadow-md border-b border-border/50 flex items-center justify-between px-4 md:px-6 left-0 ${
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
          title="MÃ¡Â»Å¸ menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder={language === 'vi' ? 'TÃ¬m kiáº¿m sáº£n pháº©m, khÃ¡ch hÃ ng, IMEI...' : 'Search products, customers, IMEI, repairs...'}
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
                  setActiveBranch('', 'Táº¥t cáº£ chi nhÃ¡nh');
                } else {
                  const b = fetchedBranches.find((x: BranchDto) => x.id === val);
                  if (b) setActiveBranch(b.id, b.name);
                }
              }}
              className="pl-10 font-bold"
            >
              <option value="all">{language === 'vi' ? 'âš¡ Táº¥t cáº£ chi nhÃ¡nh' : 'âš¡ All Branches'}</option>
              {fetchedBranches.map((b: BranchDto) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
            <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card shadow-sm border border-border/50 text-xs text-muted-foreground flex-nowrap whitespace-nowrap shrink-0">
            <Store className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground font-normal">{language === 'vi' ? 'Chi nhÃ¡nh:' : 'Branch:'}</span>
            <span className="font-bold text-primary tracking-tight whitespace-nowrap">{activeBranchName || user?.branchName || 'Trá»¥ sá»Ÿ chÃ­nh'}</span>
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
          <span>{language === 'vi' ? 'Há»i Trá»£ LÃ½ AI' : 'Ask AI Assistant'}</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
        </Button>

        {/* Multi-Theme Toggle Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
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
            <Globe className="w-4 h-4 text-primary" />
            <span>{language === 'vi' ? 'ðŸ‡»ðŸ‡³ VI' : 'ðŸ‡¬ðŸ‡§ EN'}</span>
          </Button>

          {showLangMenu && (
            <Card className="absolute right-0 mt-3 w-40 py-2 z-50 animate-in fade-in duration-150 rounded-2xl">
              <Button variant="outline"
                onClick={() => { setLanguage('vi'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-left transition-colors ${
                  language === 'vi' ? 'text-primary bg-slate-500/10' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <span>ðŸ‡»ðŸ‡³</span> Tiáº¿ng Viá»‡t (VI)
              </Button>
              <Button variant="outline"
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-left transition-colors ${
                  language === 'en' ? 'text-primary bg-slate-500/10' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <span>ðŸ‡¬ðŸ‡§</span> English (EN)
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
            title="ThÃ´ng bÃ¡o"
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
                <span className="font-heading font-medium text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> {language === 'vi' ? 'ThÃ´ng bÃ¡o má»›i' : 'Notifications'}
                </span>
                <Badge variant="success">Real-time</Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-3 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Cáº£nh bÃ¡o tá»“n kho tháº¥p</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">iPhone 15 Pro Max 256GB chá»‰ cÃ²n 2 mÃ¡y.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">5 phÃºt trÆ°á»›c</span>
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
