import type { BranchDto } from '../../types/api.types';
import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';
import { 
  Menu, Search, Bell, Settings, LogOut, User, Store, 
  ShieldAlert, Sparkles, Moon, Sun, Globe, Bot, ChevronDown, ArrowRightLeft,
  LayoutDashboard, AlertTriangle, ArrowRight, Clock, CheckCheck, Check, Wrench, Trash2,
  Package, CheckCircle2, XCircle, FileText, X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBranchStore } from '../../stores/branchStore';
import { useBranches } from '../../entities/branch/queries';
import { useRepairStats } from '../../features/repairs/api/useRepairs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { axiosClient } from '../../utils/axiosClient';
import { operationalNotificationService, type OperationalNotification } from '../../services/operationalNotificationService';
import { isPathSupportedForSandbox, purgeSandboxSession, exitSandboxMode } from '../../utils/sandboxUtils';

interface HeaderProps {
  collapsed: boolean;
  onMobileMenuToggle: () => void;
  mobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onMobileMenuToggle, mobileMenuOpen = false }) => {
  const { user, roles, logout } = useAuthStore();
  const { language, setLanguage, theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isSandboxMode = 
    location.search.includes('mode=training') || 
    location.search.includes('sandbox=true') ||
    (isPathSupportedForSandbox(location.pathname, roles) && typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true');

  const { activeBranchId, activeBranchName, setActiveBranch } = useBranchStore();

  const isGlobalAdmin = 
    user?.roles?.includes('Owner') || 
    user?.roles?.includes('Admin') || 
    roles.includes('Owner') || 
    roles.includes('Admin');

  // React Query branch fetching (only needed for Global Admins with branch switching rights)
  const { data: fetchedBranches = [] } = useBranches(isGlobalAdmin);
  
  const userBranchId = user?.branchId || 'default';
  const userBranchName = user?.branchName || 'Trụ sở chính';

  useEffect(() => {
    if (!isGlobalAdmin && user) {
      if (activeBranchId !== userBranchId || activeBranchName !== userBranchName) {
        setActiveBranch(userBranchId, userBranchName);
      }
    }
  }, [isGlobalAdmin, user, userBranchId, userBranchName, activeBranchId, activeBranchName, setActiveBranch]);

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowLangMenu(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOwner = roles.includes('Owner');
  const isAdmin = roles.includes('Admin') || isOwner;
  // Ca điều phối kỹ thuật và duyệt báo giá/linh kiện là nghiệp vụ vận hành của riêng Cửa hàng trưởng (Manager).
  // Owner và Admin không làm công việc sự vụ này.
  const isBranchManager = (roles.includes('Manager') || (user?.roles && user.roles.includes('Manager'))) && !isAdmin && !isOwner;

  const { data: repairStats } = useRepairStats(true, { enabled: Boolean(isBranchManager) });
  const unassignedCount = isBranchManager ? (repairStats?.unassignedCount ?? 0) : 0;
  const waitingApprovalCount = isBranchManager ? (repairStats?.waitingApprovalCount ?? 0) : 0;

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; content: string; createdAt: string; isRead: boolean; link?: string; type?: string; targetRoles?: string[] }>>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [operationalNotifications, setOperationalNotifications] = useState<OperationalNotification[]>([]);

  // Synchronize operational notifications based on roles & active branch
  useEffect(() => {
    const refreshOperational = () => {
      const items = operationalNotificationService.getNotifications(roles, activeBranchId, isSandboxMode);
      setOperationalNotifications(items);
    };

    refreshOperational();

    const handleOpEvent = () => refreshOperational();
    window.addEventListener('psp_operational_notification', handleOpEvent);
    window.addEventListener('psp_notifications_updated', handleOpEvent);

    return () => {
      window.removeEventListener('psp_operational_notification', handleOpEvent);
      window.removeEventListener('psp_notifications_updated', handleOpEvent);
    };
  }, [roles, activeBranchId, isSandboxMode]);

  const operationalUnread = operationalNotifications.filter(n => !n.isRead).length;
  const totalUnreadCount = isSandboxMode ? operationalUnread : (unreadCount + operationalUnread);

  // Merged notifications list (Khi ở Sandbox Mode: Chỉ hiển thị các thông báo thuộc phiên Sandbox)
  const combinedNotifications = React.useMemo(() => {
    if (isSandboxMode) {
      return operationalNotifications;
    }
    const map = new Map<string, any>();
    operationalNotifications.forEach(op => {
      map.set(op.id, op);
    });
    notifications.forEach(n => {
      if (!map.has(n.id)) {
        map.set(n.id, n);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [operationalNotifications, notifications, isSandboxMode]);

  // 1. Polling for unread notifications count every 5 seconds
  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      axiosClient.get('/Notification/unread-count')
        .then(res => setUnreadCount(res.data?.data ?? 0))
        .catch(() => setUnreadCount(0));
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // 2. Real-time SignalR connection to /notificationHub (Debounced to handle React StrictMode smoothly)
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token') || '';
    if (!token) return;

    let isDisposed = false;
    let conn: signalR.HubConnection | null = null;

    const timer = setTimeout(() => {
      if (isDisposed) return;

      conn = new signalR.HubConnectionBuilder()
        .withUrl('/notificationHub', {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      conn.on('ReceiveNotification', (notif: { id: string; title: string; content: string; isRead: boolean; createdAt: string }) => {
        if (isDisposed) return;
        setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)]);
        setUnreadCount(prev => prev + 1);
        toast(notif.title, { icon: '🔔' });
      });

      conn.start().catch(() => {
        // Fallback silently if websocket cannot connect
      });
    }, 100);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      if (conn) {
        conn.stop().catch(() => {});
      }
    };
  }, [user?.id]);

  // 3. Fetch notifications list & refresh operational notifications when dropdown opens
  useEffect(() => {
    if (!showNotifications) return;
    const opItems = operationalNotificationService.getNotifications(roles, activeBranchId);
    setOperationalNotifications(opItems);

    if (!user) return;
    axiosClient.get('/Notification?pageIndex=1&pageSize=10')
      .then(res => {
        const items = res.data?.data?.items || [];
        setNotifications(items);
      })
      .catch(() => setNotifications([]));
  }, [showNotifications, user, roles, activeBranchId]);

  // 4. Listen for toast navigation events (Xem chi tiết điều hướng)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const link = (e as CustomEvent<string>).detail;
      if (link) {
        navigate(link);
      }
    };
    window.addEventListener('psp_navigate', handleNavigate);
    return () => window.removeEventListener('psp_navigate', handleNavigate);
  }, [navigate]);

  const handleMarkAllAsRead = async () => {
    operationalNotificationService.markAllAsRead(roles, activeBranchId, isSandboxMode);
    setOperationalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (!isSandboxMode) {
      try {
        await axiosClient.put('/Notification/read-all');
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch {
        // ignore
      }
    }
    toast.success(language === 'vi' ? 'Đã đánh dấu tất cả là đã đọc' : 'Marked all as read');
  };

  const handleMarkAsRead = async (id: string) => {
    if (id.startsWith('op-')) {
      operationalNotificationService.markAsRead(id, isSandboxMode);
      setOperationalNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      return;
    }
    if (!isSandboxMode) {
      try {
        await axiosClient.put(`/Notification/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (id.startsWith('op-')) {
      operationalNotificationService.deleteNotification(id, isSandboxMode);
      setOperationalNotifications(prev => prev.filter(n => n.id !== id));
      toast.success(language === 'vi' ? 'Đã xóa thông báo' : 'Deleted notification');
      return;
    }
    if (!isSandboxMode) {
      try {
        await axiosClient.delete(`/Notification/${id}`);
        const deleted = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (deleted && !deleted.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success(language === 'vi' ? 'Đã chuyển thông báo vào thùng rác' : 'Moved to trash');
      } catch {
        toast.error(language === 'vi' ? 'Không thể xóa thông báo' : 'Failed to delete');
      }
    }
  };

  const handleClearAll = async () => {
    operationalNotificationService.clearAll(isSandboxMode);
    setOperationalNotifications([]);
    if (!isSandboxMode) {
      try {
        await axiosClient.delete('/Notification/clear-all');
        setNotifications([]);
        setUnreadCount(0);
      } catch {
        // ignore
      }
    }
    toast.success(language === 'vi' ? 'Đã dọn sạch tất cả thông báo' : 'Cleared all notifications');
  };


  return (
    <header
      ref={headerRef}
      className={`fixed top-0 right-0 z-30 h-16 transition-[left] duration-200 ease-in-out bg-card/95 backdrop-blur-md neu-raised border-b border-border/40 flex items-center justify-between px-4 md:px-6 left-0 ${
        collapsed ? 'md:left-20' : 'md:left-64'
      }`}
    >
      {/* Left: Mobile Toggle, Global Search & Branch Switcher */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-2xl min-w-0">
        <Button
          variant="secondary"
          size="icon"
          className="md:hidden shrink-0 cursor-pointer"
          onClick={onMobileMenuToggle}
          title="Mở menu"
          aria-label="Mở menu điều hướng"
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Global Search Input */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm sản phẩm, khách hàng, IMEI...' : 'Search products, customers, IMEI, repairs...'}
            className="pl-10 h-10 w-full"
          />
        </div>

        {/* Branch Switcher (Part K) */}
        {isGlobalAdmin ? (
          <div className="relative hidden lg:block w-52 shrink-0">
            <Select
              value={activeBranchId || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setActiveBranch('', 'Tất cả chi nhánh');
                } else {
                  const b = fetchedBranches.find((x: BranchDto) => x.id === val);
                  if (b) setActiveBranch(b.id, b.name, b.address, b.phone);
                }
              }}
              className="pl-9 font-semibold text-xs h-10"
            >
              <option value="all">{language === 'vi' ? '⚡ Tất cả chi nhánh' : '⚡ All Branches'}</option>
              {fetchedBranches.map((b: BranchDto) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
            <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-elevated neu-raised border border-border/40 text-xs text-muted-foreground shrink-0 select-none">
            <Store className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground font-normal">{language === 'vi' ? 'Chi nhánh:' : 'Branch:'}</span>
            <span className="font-semibold text-foreground tracking-tight whitespace-nowrap">
              {activeBranchName || user?.branchName || 'Trụ sở chính'}
            </span>
          </div>
        )}
      </div>

      {/* Right: AI Shortcut, Notifications, Theme, Language & User Menu */}
      <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
        {/* Enterprise Global Sandbox HUD Indicator & Quick Exit */}
        {isSandboxMode && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-500 shadow-sm animate-in fade-in zoom-in-95 duration-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold tracking-wide font-mono hidden md:inline">
              {language === 'vi' ? 'CHẾ ĐỘ THỰC HÀNH' : 'SANDBOX MODE'}
            </span>
            <button
              type="button"
              onClick={() => {
                exitSandboxMode({ navigate, language });
              }}
              className="ml-0.5 sm:ml-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30 active:scale-95"
              title={language === 'vi' ? 'Thoát Chế độ Thực hành' : 'Exit Sandbox Mode'}
            >
              <X className="w-3 h-3" />
              <span>{language === 'vi' ? 'Thoát' : 'Exit'}</span>
            </button>
          </div>
        )}

        {/* Quick AI RAG Chat Shortcut */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/ai-chat')}
          className="hidden md:flex items-center gap-1.5 shadow-md shadow-primary/20"
        >
          <Bot className="w-4 h-4" />
          <span>{language === 'vi' ? 'Hỏi Trợ Lý AI' : 'Ask AI Assistant'}</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
        </Button>

        {/* Theme Switcher Toggle */}
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Chuyển chế độ Tối' : 'Chuyển chế độ Sáng'}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-xl"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </Button>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { 
              setShowLangMenu(!showLangMenu); 
              setShowNotifications(false); 
              setShowUserMenu(false); 
            }}
            className="flex items-center gap-1.5 font-semibold text-xs h-9 px-2.5 rounded-xl"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
          </Button>

          {showLangMenu && (
            <Card variant="raised-md" className="absolute right-0 mt-2 w-44 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-2xl">
              <button
                onClick={() => { setLanguage('vi'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  language === 'vi' ? 'bg-primary/10 text-primary shadow-inset' : 'text-foreground hover:bg-muted/40'
                }`}
              >
                <span>🇻🇳</span> Tiếng Việt (VI)
              </button>
              <button
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer mt-1 ${
                  language === 'en' ? 'bg-primary/10 text-primary shadow-inset' : 'text-foreground hover:bg-muted/40'
                }`}
              >
                <span>🇬🇧</span> English (EN)
              </button>
            </Card>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => { 
              setShowNotifications(!showNotifications); 
              setShowLangMenu(false); 
              setShowUserMenu(false); 
            }}
            title={language === 'vi' ? 'Thông báo hệ thống' : 'System notifications'}
            aria-label="Notifications"
            className="w-9 h-9 rounded-xl relative"
          >
            <Bell className="w-4 h-4" />
            {(totalUnreadCount > 0 || unassignedCount > 0) && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-pulse">
                {(totalUnreadCount + unassignedCount) > 99 ? '99+' : (totalUnreadCount + unassignedCount)}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <Card variant="raised-md" className="absolute right-0 mt-2 w-88 sm:w-96 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/30 pb-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-primary" /> {language === 'vi' ? 'Thông báo' : 'Notifications'}
                  </span>
                  {isSandboxMode && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 font-mono">
                      🎓 SANDBOX
                    </span>
                  )}
                  {(totalUnreadCount + unassignedCount) > 0 && (
                    <Badge variant="danger" className="font-bold text-[10px] px-1.5 py-0.5">
                      {totalUnreadCount + unassignedCount} {language === 'vi' ? 'cần xử lý' : 'pending'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {totalUnreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Đã đọc tất cả' : 'Mark read'}</span>
                    </button>
                  )}
                  {combinedNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11px] text-destructive hover:underline font-semibold flex items-center gap-1 cursor-pointer ml-1"
                      title={language === 'vi' ? 'Dọn dẹp tất cả thông báo' : 'Clear all'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      <span>{language === 'vi' ? 'Dọn dẹp' : 'Clear all'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Priority 1: Unassigned Repair Tickets Alert for Manager */}
              {isBranchManager && unassignedCount > 0 && (
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/repairs?queue=UNASSIGNED');
                  }}
                  className="mb-2.5 p-3 rounded-xl neu-inset bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                      <span>{unassignedCount} {language === 'vi' ? 'ca sửa chữa chưa có thợ nhận' : 'unassigned repair tickets'}</span>
                    </span>
                    <span className="text-[11px] flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold font-mono">
                      {language === 'vi' ? 'Điều phối ngay' : 'Dispatch'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {language === 'vi'
                      ? 'Thiết bị đã tiếp nhận nhưng chưa có thợ phụ trách. Cần quản lý điều phối để đảm bảo SLA.'
                      : 'Devices checked in without assigned technician. Manager dispatch required.'}
                  </p>
                </div>
              )}

              {/* Priority 2: Waiting Approval Alert for Manager */}
              {isBranchManager && waitingApprovalCount > 0 && (
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/repairs?queue=BLOCKED');
                  }}
                  className="mb-2.5 p-2.5 rounded-xl neu-inset bg-purple-500/10 border border-purple-500/30 cursor-pointer hover:bg-purple-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span>{waitingApprovalCount} {language === 'vi' ? 'ca chờ duyệt báo giá / linh kiện' : 'cases awaiting quote sign-off'}</span>
                    </span>
                    <span className="text-[10px] flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                      {language === 'vi' ? 'Xử lý' : 'Review'} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )}

              {/* Notifications List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {combinedNotifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    {language === 'vi' ? 'Không có thông báo mới' : 'No new notifications'}
                  </div>
                ) : (
                  combinedNotifications.map((n: any) => {
                    const getIcon = () => {
                      if (n.type === 'WARRANTY_RMA_RETURN') return <Package className="w-4 h-4 text-emerald-500" />;
                      if (n.type === 'VOID_ORDER_APPROVED') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                      if (n.type === 'VOID_ORDER_REJECTED') return <XCircle className="w-4 h-4 text-rose-500" />;
                      if (n.type === 'REPAIR_ASSIGNED' || n.type === 'REPAIR_APPROVED' || n.type === 'PART_REQUESTED') return <Wrench className="w-4 h-4 text-blue-500" />;
                      if (n.type === 'REPAIR_COMPLETED') return <Sparkles className="w-4 h-4 text-amber-500" />;
                      if (n.type === 'LOW_STOCK_ALERT') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
                      if (n.type === 'STOCK_DISCREPANCY_APPROVED') return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
                      if (n.type === 'STOCK_DISCREPANCY_REJECTED') return <XCircle className="w-4 h-4 text-rose-500" />;
                      if (n.title?.includes('sửa chữa') || n.title?.includes('Phiếu')) return <Wrench className="w-4 h-4 text-amber-500" />;
                      if (n.title?.includes('Hao hụt') || n.title?.includes('tồn kho') || n.title?.includes('CẢNH BÁO')) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
                      return <ShieldAlert className="w-4 h-4 text-primary" />;
                    };

                    const roleTagLabel = n.targetRoles?.[0] ? (
                      n.targetRoles[0] === 'Warranty' ? 'Bảo hành' :
                      n.targetRoles[0] === 'Sales' ? 'Bán hàng' :
                      n.targetRoles[0] === 'Technician' ? 'Kỹ thuật' :
                      n.targetRoles[0] === 'Inventory' ? 'Kho hàng' :
                      n.targetRoles[0] === 'Manager' ? 'Quản lý' : n.targetRoles[0]
                    ) : null;

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) handleMarkAsRead(n.id);
                          setShowNotifications(false);
                          if (n.link) {
                            navigate(n.link);
                          } else if (n.title?.includes('REP-') || n.content?.includes('REP-') || n.title?.includes('sửa chữa')) {
                            navigate('/repairs');
                          } else if (n.title?.includes('WAR-') || n.content?.includes('WAR-') || n.title?.includes('bảo hành') || n.title?.includes('RMA')) {
                            navigate('/warranties');
                          } else if (n.title?.includes('SO-') || n.content?.includes('Hóa đơn') || n.title?.includes('Hủy đơn')) {
                            navigate('/sales');
                          } else if (n.title?.includes('kho') || n.title?.includes('tồn kho') || n.title?.includes('Lệch Kho')) {
                            navigate('/stock-take');
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                          !n.isRead 
                            ? 'bg-primary/5 border-primary/20 shadow-inset hover:bg-primary/10' 
                            : 'bg-surface-elevated/40 border-border/30 hover:bg-surface-elevated/70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {getIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {roleTagLabel && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold font-mono uppercase bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
                                    {roleTagLabel}
                                  </span>
                                )}
                                <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.content}</p>
                            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-border/20">
                              <span className="text-[10px] text-muted-foreground/60 font-mono">
                                {new Date(n.createdAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(n.id);
                                }}
                                className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                                title={language === 'vi' ? 'Xóa thông báo' : 'Delete notification'}
                              >
                                <Trash2 className="w-3 h-3 text-destructive/70 group-hover:text-destructive" />
                                <span>{language === 'vi' ? 'Xóa' : 'Delete'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>


              {/* Dropdown Footer: Link to Notification Trash Page */}
              <div className="pt-2.5 mt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications/trash');
                  }}
                  className="w-full py-2 px-3 rounded-xl neu-raised hover:neu-pressed text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer bg-muted/20 hover:bg-muted/40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{language === 'vi' ? 'Thùng rác thông báo' : 'Notification Trash'}</span>
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* User Account Menu (Part J) */}
        <div className="relative pl-1">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2 p-1 rounded-2xl neu-raised hover:neu-raised-md active:shadow-inset transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Tài khoản người dùng"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="w-8 h-8 rounded-xl bg-card shadow-inset border border-border/40 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left pr-1.5">
              <span className="text-xs font-semibold text-foreground leading-tight max-w-[100px] truncate">
                {user?.fullName || 'Người dùng'}
              </span>
              <span className="text-[10px] text-primary font-mono font-medium leading-tight">
                {roles[0] || 'Staff'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${showUserMenu ? 'rotate-180 text-primary' : ''}`} />
          </button>

          {/* User Menu Dropdown Panel */}
          {showUserMenu && (
            <Card variant="raised-md" className="absolute right-0 mt-2 w-60 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-2xl">
              {/* User Identity Info */}
              <div className="pb-3 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-card shadow-inset border border-border/40 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.fullName || 'Tài khoản hệ thống'}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{user?.email || 'operator@psp.vn'}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <Badge variant="primary" dot>{roles[0] || 'Nhân viên'}</Badge>
                  <span className="text-[11px] text-muted-foreground truncate font-medium">
                    {activeBranchName || user?.branchName || 'Trụ sở chính'}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/dashboard');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/40 hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/40 hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{language === 'vi' ? 'Hồ sơ cá nhân' : 'Personal Profile'}</span>
                </button>

                {isGlobalAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/40 hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>{language === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'}</span>
                  </button>
                )}
              </div>

              {/* Account Actions */}
              <div className="pt-2 border-t border-border/30 space-y-1">
                {/* Switch Account (RBAC-07 Session Switching Isolation) */}
                <button
                  type="button"
                  onClick={async () => {
                    setShowUserMenu(false);
                    purgeSandboxSession();
                    await logout();
                    navigate('/login?switch=true', { replace: true });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer text-left"
                >
                  <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                  <span>{language === 'vi' ? 'Đổi tài khoản' : 'Switch Account'}</span>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={async () => {
                    setShowUserMenu(false);
                    purgeSandboxSession();
                    await logout();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{language === 'vi' ? 'Đăng xuất tài khoản' : 'Sign Out'}</span>
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
};
