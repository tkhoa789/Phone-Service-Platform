import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import {
  Smartphone,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const { theme, language, toggleTheme, setLanguage } = useThemeStore();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-light', 'theme-dark', 'light', 'dark');
      document.documentElement.classList.add(`theme-${theme}`, theme);
    }
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên đăng nhập và mật khẩu!' : 'Please enter username and password!');
      return;
    }

    try {
      await login({ username, password });
      toast.success(language === 'vi' ? 'Đăng nhập hệ thống thành công!' : 'Login successful!', {
        icon: '🚀',
        style: {
          background: 'var(--neu-bg-base)',
          color: 'var(--neu-text-title)',
          border: '1px solid var(--neu-border)',
        },
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || (language === 'vi' ? 'Đăng nhập thất bại!' : 'Login failed!'));
    }
  };

  const fillDemoAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    toast(language === 'vi' ? 'Đã điền thông tin tài khoản thử nghiệm' : 'Seeded test credentials filled', { icon: '⚡' });
  };

  return (
    <div className="min-h-screen bg-[var(--neu-bg-base)] text-[var(--neu-text-sub)] flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Soft Mint Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

      {/* Top Right Controls: Theme Switcher & Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <Button variant="outline"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] hover:text-[var(--neu-accent-mint)] transition-all shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
          title={theme === 'light' ? 'Chuyển sang Chủ Đề Đêm (Dark Cyber)' : 'Chuyển sang Chủ Đề Sáng (Light Neumorphism)'}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-[11px] font-bold text-indigo-700">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-[11px] font-bold text-amber-400">Light</span>
            </>
          )}
        </Button>

        <Button variant="outline"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] text-xs font-bold transition-all shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
          title="Chuyển đổi ngôn ngữ"
        >
          <Globe className="w-4 h-4 text-[var(--neu-accent-mint)]" />
          <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
        </Button>
      </div>

      {/* Main Login Neumorphism 3D Card */}
      <div className="w-full max-w-md relative z-10 bg-[var(--neu-bg-base)] rounded-3xl p-8 border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)]">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--neu-bg-base)] shadow-inner border border-border/50 bg-muted/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-[var(--neu-accent-mint)]">
            <Smartphone className="w-8 h-8 text-[var(--neu-accent-mint)]" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-[var(--neu-text-title)] tracking-tight flex items-center justify-center gap-2">
              Phone Service Platform <Sparkles className="w-4 h-4 text-[var(--neu-accent-mint)] animate-pulse" />
            </h1>
            <p className="text-xs text-[var(--neu-text-sub)] mt-1 font-normal">
              {language === 'vi'
                ? 'Hệ thống Quản lý Bán hàng & Dịch vụ Sửa chữa Điện thoại Enterprise'
                : 'Enterprise Phone Retail & Repair Management System'}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs font-normal">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-normal text-[var(--neu-text-sub)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" />
              {language === 'vi' ? 'Tên đăng nhập' : 'Username'}
            </label>
            <div className="relative">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập tên đăng nhập (ví dụ: admin)' : 'Enter username (e.g. admin)'}
                className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-xl px-4 py-2.5 text-sm text-[var(--neu-text-title)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner border border-border/50 bg-muted/20"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-normal text-[var(--neu-text-sub)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" />
                {language === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-xl pl-4 pr-10 py-2.5 text-sm text-[var(--neu-text-title)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner border border-border/50 bg-muted/20"
                required
              />
              <Button variant="outline"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--neu-text-title)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button variant="outline"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-sm font-medium shadow-[var(--neu-shadow-button)] hover:scale-[1.01] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {language === 'vi' ? 'Đang xác thực...' : 'Authenticating...'}
              </span>
            ) : (
              <>
                <span>{language === 'vi' ? 'Đăng nhập hệ thống' : 'Sign In to System'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Demo Credentials Quick Fill Section */}
        <div className="mt-8 pt-6 border-t border-slate-400/20 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[var(--neu-text-sub)]">
            <span className="flex items-center gap-1 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" />
              {language === 'vi' ? 'Thử nghiệm: Click điền nhanh tài khoản' : 'Test: Quick fill credentials'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Seeded DB</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('owner', 'Owner@123')}
              className="p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">👑 Owner</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">owner / Owner@123</div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('admin', 'Admin@123')}
              className="p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">🛡️ Admin</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">admin / Admin@123</div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('manager', 'Manager@123')}
              className="p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">👔 Manager</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">manager / Manager@123</div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('sales', 'Sales@123')}
              className="p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">🛒 Sales (POS)</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">sales / Sales@123</div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('inventory', 'Inventory@123')}
              className="p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">📦 Inventory</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">inventory / Inventory@123</div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('technician', 'Technician@123')}
              className="p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">🛠️ Technician</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">technician / Tech@123</div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => fillDemoAccount('warranty', 'Warranty@123')}
              className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-[var(--neu-bg-base)] border border-slate-400/20 hover:border-emerald-500/50 text-left transition-all group shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 cursor-pointer"
            >
              <div className="font-medium text-[var(--neu-text-title)] group-hover:text-[var(--neu-accent-mint)] truncate">🛡️ Warranty</div>
              <div className="text-[10px] text-[var(--neu-text-sub)] font-mono mt-0.5 truncate">warranty / Warranty@123</div>
            </Button>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-[var(--neu-text-sub)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" />
          <span>JWT Token Rotation + BCrypt 12 Rounds Security</span>
        </div>
      </div>
    </div>
  );
};
