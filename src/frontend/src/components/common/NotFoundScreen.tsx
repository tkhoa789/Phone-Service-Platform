import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../ui/Button';

export const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useThemeStore();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-card border border-border/50 shadow-md text-center space-y-6 relative overflow-hidden">
        {/* 3D Search Icon */}
        <div className="w-20 h-20 rounded-3xl bg-card shadow-inner flex items-center justify-center mx-auto text-muted-foreground">
          <Search className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-muted-foreground text-[11px] font-mono font-bold uppercase tracking-wider">
            HTTP 404 — Not Found
          </span>
          <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">
            {language === 'vi' ? 'Trang Không Tồn Tại' : 'Page Not Found'}
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {language === 'vi'
              ? 'Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa khỏi hệ thống. Vui lòng kiểm tra lại URL.'
              : 'The page you are looking for does not exist or has been removed. Please check the URL.'}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="w-full font-medium"
          >
            <Home className="w-4 h-4" />
            <span>{language === 'vi' ? 'Quay về Màn hình Chính (Dashboard)' : 'Return to Dashboard'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
