import React, { useState } from 'react';
import { User, Shield, Building2, Lock, Save, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { userService } from '../../services/userService';
import { useBranches } from '../../features/branches/hooks/useBranches';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const USER_ROLE_LABELS: Record<string, { label: string; labelEn: string; color: string; desc: string; descEn: string }> = {
  Owner: {
    label: 'Owner (Chủ sở hữu)', labelEn: 'Owner',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Chủ tịch vận hành: Đánh giá thu chi từ xa, điều hướng chuỗi cửa hàng.',
    descEn: 'Executive owner: Remote financial oversight & chain-wide operations direction.'
  },
  Admin: {
    label: 'Admin (Quản trị IT)', labelEn: 'Admin (IT Management)',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    desc: 'Quản trị viên IT: Quản lý hệ thống, phân quyền & tài khoản nhân viên.',
    descEn: 'IT Admin: System management, RBAC permissions & staff account control.'
  },
  Manager: {
    label: 'Manager (Cửa hàng trưởng)', labelEn: 'Manager (Branch Head)',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    desc: 'Cửa hàng trưởng: Quản lý toàn bộ vận hành trong 1 chi nhánh.',
    descEn: 'Branch Head: Full operational management within 1 assigned branch.'
  },
  Sales: {
    label: 'Sales (Thu ngân / Bán hàng)', labelEn: 'Sales (POS Cashier)',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    desc: 'Nhân viên bán hàng POS, lập đơn & xuất hóa đơn.',
    descEn: 'POS Sales: Create orders, apply vouchers & issue K80 receipts.'
  },
  Inventory: {
    label: 'Warehouse (Thủ kho)', labelEn: 'Warehouse (Stock Controller)',
    color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    desc: 'Quản lý kho hàng, nhập kho & quản lý số IMEI.',
    descEn: 'Warehouse: Stock management, goods receiving & IMEI tracking.'
  },
  Technician: {
    label: 'Technician (Kỹ thuật viên)', labelEn: 'Technician',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    desc: 'Sửa chữa thiết bị, thay linh kiện & lập phiếu dịch vụ.',
    descEn: 'Device repair, parts replacement & repair ticket intake.'
  },
  Warranty: {
    label: 'Warranty (Bảo hành)', labelEn: 'Warranty Staff',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    desc: 'Tra cứu bảo hành 12 tháng & xử lý đổi máy mới.',
    descEn: '12-month IMEI warranty lookup & device replacement processing.'
  },
};

export const UserProfilePage: React.FC = () => {
  const { user, roles } = useAuthStore();
  const { language } = useThemeStore();
  const { data: branches = [] } = useBranches();
  const branchMap = React.useMemo(() => new Map(branches.map(b => [b.id, b.name])), [branches]);
  const tCommon = i18nDictionary[language].common;
  const isVi = language === 'vi';

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const activeRoleKey = roles[0] || 'User';
  const activeRoleInfo = USER_ROLE_LABELS[activeRoleKey] || {
    label: activeRoleKey, labelEn: activeRoleKey,
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    desc: 'Tài khoản người dùng hệ thống', descEn: 'System user account',
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingProfile(true);
    try {
      await userService.update(user.id, {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
      });
      toast.success(isVi ? 'Cập nhật thông tin cá nhân thành công!' : 'Profile updated successfully!');
    } catch {
      toast.error(isVi ? 'Cập nhật thông tin thất bại!' : 'Failed to update profile!');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(isVi ? 'Mật khẩu mới và nhập lại không khớp!' : 'Passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error(isVi ? 'Mật khẩu mới phải có ít nhất 6 ký tự!' : 'Password must be at least 6 characters!');
      return;
    }

    setLoadingPassword(true);
    try {
      await userService.update(user.id, { password: passwordData.newPassword });
      toast.success(isVi ? 'Đổi mật khẩu thành công!' : 'Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch {
      toast.error(isVi ? 'Đổi mật khẩu thất bại!' : 'Failed to change password!');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto pb-10 text-muted-foreground">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">
              {user?.fullName || (isVi ? 'Tài khoản người dùng' : 'User Account')}
            </h1>
            <p className="text-xs font-mono mt-0.5 text-muted-foreground">
              @<span className="text-primary font-bold">{user?.username}</span>
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <span className={`px-4 py-2 rounded-2xl text-xs font-medium border whitespace-nowrap shadow-inner border border-border/50 bg-muted/20 ${activeRoleInfo.color}`}>
          <Shield className="w-3.5 h-3.5 inline mr-1.5" />
          {isVi ? activeRoleInfo.label : activeRoleInfo.labelEn}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: RBAC Info Card */}
        <div className="md:col-span-1 p-6 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
          <h2 className="font-heading font-medium text-sm text-foreground flex items-center gap-2 pb-2 border-b border-slate-400/20">
            <Shield className="w-4 h-4 text-primary" />
            {isVi ? 'Thông Tin Phân Quyền Hạn' : 'RBAC Role & Permissions'}
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground font-medium block mb-1">
                {isVi ? 'Chi nhánh làm việc:' : 'Assigned branch:'}
              </span>
              <div className="p-2.5 rounded-xl bg-card border border-border/50 shadow-inner border border-border/50 bg-muted/20 flex items-center gap-2 text-foreground font-medium">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                {(() => {
                  const isUnassigned = !user?.branchId || user?.branchId === '00000000-0000-0000-0000-000000000000';
                  const displayBranch = user?.branchName || (!isUnassigned ? branchMap.get(user?.branchId!) : undefined) || (isVi ? 'Trụ sở chính (Tất cả chi nhánh)' : 'HQ (All Branches)');
                  return <span>{displayBranch}</span>;
                })()}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium block mb-1">
                {isVi ? 'Phạm vi quyền hạn:' : 'Permission scope:'}
              </span>
              <p className="p-2.5 rounded-xl bg-card border border-border/50 shadow-inner border border-border/50 bg-muted/20 text-[11px] text-muted-foreground leading-relaxed font-normal">
                {isVi ? activeRoleInfo.desc : activeRoleInfo.descEn}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-400/20 text-[11px] text-muted-foreground space-y-1.5 font-normal">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {isVi ? 'Đã xác thực JWT Token' : 'JWT Token Verified'}
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {isVi ? 'Đã gán phạm vi Chi nhánh' : 'Branch Scope Assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Update Profile + Change Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Update Personal Info */}
          <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
            <h2 className="font-heading font-medium text-sm text-foreground flex items-center gap-2 pb-3 border-b border-slate-400/20">
              <User className="w-4 h-4 text-primary" />
              {isVi ? 'Cập Nhật Thông Tin Cá Nhân' : 'Update Personal Information'}
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="text-foreground font-medium block mb-1">
                  {isVi ? 'Họ & Tên *' : 'Full Name *'}
                </label>
                <Input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-medium placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground font-medium block mb-1">Email *</label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-medium placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="text-foreground font-medium block mb-1">
                    {isVi ? 'Số điện thoại *' : 'Phone Number *'}
                  </label>
                  <Input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-mono font-medium placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="outline"
                  type="submit"
                  disabled={loadingProfile}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-90 disabled:opacity-60 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {loadingProfile
                    ? (isVi ? 'Đang lưu...' : 'Saving...')
                    : (isVi ? 'Lưu Thay Đổi' : tCommon.save)}
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
            <h2 className="font-heading font-medium text-sm text-foreground flex items-center gap-2 pb-3 border-b border-slate-400/20">
              <KeyRound className="w-4 h-4 text-purple-400" />
              {isVi ? 'Đổi Mật Khẩu Cá Nhân' : 'Change Account Password'}
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="text-foreground font-medium block mb-1">
                  {isVi ? 'Mật khẩu mới *' : 'New Password *'}
                </label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder={isVi ? 'Nhập mật khẩu mới (ít nhất 6 ký tự)...' : 'Enter new password (min. 6 chars)...'}
                  className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-medium placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  required
                />
              </div>

              <div>
                <label className="text-foreground font-medium block mb-1">
                  {isVi ? 'Nhập lại Mật khẩu mới *' : 'Confirm New Password *'}
                </label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder={isVi ? 'Xác nhận lại mật khẩu mới...' : 'Re-enter new password...'}
                  className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-medium placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  required
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="outline"
                  type="submit"
                  disabled={loadingPassword}
                  className="px-5 py-2.5 rounded-2xl text-white font-medium text-xs flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 shadow-sm cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #9333ea, #7c3aed)' }}
                >
                  <Lock className="w-4 h-4" />
                  {loadingPassword
                    ? (isVi ? 'Đang đổi mật khẩu...' : 'Changing...')
                    : (isVi ? 'Xác Nhận Đổi Mật Khẩu' : 'Confirm Password Change')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
