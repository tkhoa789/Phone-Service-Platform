import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, permission }) => {
  const { isAuthenticated, roles, hasPermission } = useAuthStore();
  const { language } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. Permission-based check
  if (permission && !hasPermission(permission)) {
    return <AccessDeniedScreen allowedRoles={allowedRoles} userRoles={roles} requiredPermission={permission} reason={permission} />;
  }

  // 2. Role-based check
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((role) => roles.includes(role));
    if (!isAllowed) {
      return <AccessDeniedScreen allowedRoles={allowedRoles} userRoles={roles} />;
    }
  }

  return <Outlet />;
};

interface AccessDeniedProps {
  allowedRoles?: string[];
  userRoles?: string[];
  requiredPermission?: string;
  reason?: string;
}

const AccessDeniedScreen: React.FC<AccessDeniedProps> = ({ allowedRoles, userRoles, requiredPermission, reason }) => {
  const navigate = useNavigate();
  const { language } = useThemeStore();
  const displayPermission = requiredPermission || reason;

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 font-sans">
      <Card className="w-full max-w-lg p-8 text-center space-y-6 relative">
        {/* Ambient Warning Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* 3D Shield Lock Icon */}
        <div className="w-20 h-20 rounded-3xl bg-card border border-rose-500/40 shadow-inner flex items-center justify-center mx-auto text-rose-500">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-mono font-bold uppercase tracking-wider">
            HTTP 403 Forbidden — Access Denied
          </span>
          <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">
            {language === 'vi' ? 'Quyền Truy Cập Bị Hạn Chế' : 'Access Restricted'}
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {language === 'vi'
              ? 'Tài khoản của bạn không có đủ thẩm quyền nghiệp vụ để truy cập vào phân vùng này. Vui lòng liên hệ Chủ sở hữu (Owner) hoặc Admin IT!'
              : 'Your user account lacks the required role permissions to access this module. Please contact the Owner or System Administrator!'}
          </p>
        </div>

        {/* Current User Role Info */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-inner text-xs text-left space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{language === 'vi' ? 'Vai trò tài khoản hiện tại:' : 'Your Current Role:'}</span>
            <Badge variant="warning">{userRoles?.join(', ') || 'Standard Member'}</Badge>
          </div>

          {displayPermission && (
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="text-muted-foreground">{language === 'vi' ? 'Yêu cầu quyền (Permission):' : 'Required Permission:'}</span>
              <Badge variant="outline" className="text-rose-500 border-rose-500/30 font-bold">{displayPermission}</Badge>
            </div>
          )}

          {allowedRoles && (
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="text-muted-foreground">{language === 'vi' ? 'Yêu cầu vai trò (Role):' : 'Required Roles:'}</span>
              <Badge variant="success">{allowedRoles.join(' / ')}</Badge>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="w-full font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'vi' ? 'Quay về Trang Chủ' : 'Return to Home'}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
