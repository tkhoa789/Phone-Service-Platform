import React, { useState } from 'react';
import { usePosVariants } from '@/features/pos/hooks/usePosCatalog';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useBranchStore } from '@/stores/branchStore';
import { useAuthStore } from '@/stores/authStore';
import type { IntakeState } from '../../types/intake.types';
import { useThemeStore } from '@/stores/themeStore';
import { Smartphone, Search, CheckCircle2, ArrowLeft, ArrowRight, PenTool, Sparkles, AlertCircle, Wrench, UserCheck, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ProductVariantDto } from '@/types/api.types';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COSMETIC_QUICK_TAGS = [
  'Đẹp như mới (99%)',
  'Trầy xước viền/vỏ',
  'Cấn móp góc',
  'Nứt vỡ kính lưng',
  'Vỡ màn hình',
  'Cong sườn máy',
  'Đã qua sửa chữa trước'
];

export const DeviceStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const { activeBranchId } = useBranchStore();
  const { user, hasRole, roles } = useAuthStore();
  const isManagerOrAdmin = hasRole('Manager') || hasRole('Admin') || hasRole('Owner') || roles.includes('Manager') || roles.includes('Admin') || roles.includes('Owner');

  const [searchTerm, setSearchTerm] = useState('');
  const [isManualModel, setIsManualModel] = useState(Boolean(state.isCustomModel));
  const [manualModelName, setManualModelName] = useState(state.customModel || state.deviceModel || '');

  const { data: variants = [], isLoading: loading, isError, refetch } = usePosVariants();
  const { data: users = [] } = useUsers(activeBranchId, isManagerOrAdmin);

  // Filter technicians belonging to this branch
  const branchTechnicians = users.filter((u) => {
    if (u.status !== 'Active') return false;
    const hasTechRole = u.roles?.some(r => r.toLowerCase().includes('tech') || r.toLowerCase().includes('technician'));
    return hasTechRole || u.roles?.length === 0;
  });

  const isSelfAssigned = Boolean(
    user?.id &&
    state.technicianId &&
    state.technicianId !== '00000000-0000-0000-0000-000000000000' &&
    state.technicianId.toLowerCase() === user.id.toLowerCase()
  );

  const filteredVariants = variants.filter(
    (v) =>
      (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectVariant = (v: ProductVariantDto) => {
    setIsManualModel(false);
    updateState({
      deviceVariantId: v.id,
      deviceModel: v.name || v.productName,
      customModel: undefined,
      isCustomModel: false,
    });
  };

  const handleManualModelChange = (name: string) => {
    setManualModelName(name);
    // Find first available variant as fallback foreign key for backend
    const fallbackId = variants.length > 0 ? variants[0].id : '00000000-0000-0000-0000-000000000001';
    updateState({
      deviceVariantId: fallbackId,
      deviceModel: name,
      customModel: name,
      isCustomModel: true,
    });
  };

  const toggleCosmeticTag = (tag: string) => {
    const current = state.cosmeticCondition || '';
    if (current.includes(tag)) {
      const updated = current
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== tag && t.length > 0)
        .join(', ');
      updateState({ cosmeticCondition: updated });
    } else {
      const updated = current ? `${current}, ${tag}` : tag;
      updateState({ cosmeticCondition: updated });
    }
  };

  // Strict IMEI Validation: Required 14-16 alphanumeric characters (Standard IMEI is 15 digits)
  const cleanImei = (state.imei || '').trim();
  const isImeiValid = /^[0-9A-Za-z]{14,18}$/.test(cleanImei);

  const hasDevice = Boolean(
    (isManualModel && manualModelName.trim().length > 0) ||
    (!isManualModel && state.deviceVariantId && state.deviceModel)
  );

  const cleanProblemDesc = (state.problemDescription || '').trim();
  const INVALID_DESCRIPTIONS = new Set(['k', 'c', 'a', 'x', 'không', 'ko', 'khong', 'test', 'error', 'none', 'null']);
  const isProblemDescValid = cleanProblemDesc.length >= 3 && !INVALID_DESCRIPTIONS.has(cleanProblemDesc.toLowerCase());

  // Form validity: Model, mandatory valid IMEI, valid problem description
  const isFormValid = Boolean(hasDevice && isImeiValid && isProblemDescValid);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-sm font-bold border border-indigo-500/20">
            2
          </span>
          {isVi ? 'Thông tin Thiết bị, IMEI & Phân công Kỹ thuật' : 'Device, IMEI & Technician Assignment'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isVi
            ? 'Bắt buộc nhập đủ 15 số IMEI/Serial, chọn dòng máy và chỉ định kỹ thuật viên phụ trách sửa chữa'
            : 'IMEI (15 digits), device model, and technician assignment are required for ticket intake'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Device Selection & IMEI */}
        <div className="space-y-4 p-5 rounded-3xl bg-card border border-border/40 neu-raised">
          {/* Model selection header */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              {isVi ? 'Model Thiết Bị Tiếp Nhận' : 'Device Model'} <span className="text-rose-500">*</span>
            </label>

            <button
              type="button"
              onClick={() => {
                const nextMode = !isManualModel;
                setIsManualModel(nextMode);
                if (nextMode) {
                  handleManualModelChange(manualModelName || state.deviceModel || '');
                } else {
                  updateState({ isCustomModel: false, customModel: undefined });
                }
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <PenTool className="w-3.5 h-3.5" />
              {isManualModel
                ? (isVi ? 'Chọn từ danh mục kho' : 'Pick from catalog')
                : (isVi ? 'Nhập model thủ công' : 'Enter unlisted model')}
            </button>
          </div>

          {isManualModel ? (
            <div className="space-y-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <Sparkles className="w-4 h-4" />
                {isVi ? 'Nhập tên thiết bị ngoài danh mục kho hàng' : 'Custom unlisted device intake'}
              </div>
              <Input
                type="text"
                value={manualModelName}
                onChange={(e) => handleManualModelChange(e.target.value)}
                placeholder={isVi ? 'VD: iPhone 14 Pro Max 256GB Deep Purple...' : 'E.g: iPhone 14 Pro Max 256GB...'}
                className="w-full neu-inset bg-background/50 border-border/40 text-foreground"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                {isVi
                  ? 'Ghi rõ tên máy, dung lượng hoặc màu sắc để kỹ thuật viên dễ nhận dạng khi sửa.'
                  : 'Specify exact model, capacity, and color for easy technician identification.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isVi ? 'Tìm tên thiết bị, mã SKU...' : 'Search device model, SKU...'}
                  className="w-full neu-inset bg-background/50 border-border/40 pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {state.deviceModel && !isManualModel && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-foreground">{state.deviceModel}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium">
                    {isVi ? 'Đã chọn' : 'Selected'}
                  </span>
                </div>
              )}

              <div className="border border-border/40 rounded-2xl overflow-hidden neu-inset bg-background/40 max-h-[190px] overflow-y-auto">
                {loading ? (
                  <div className="p-5 text-center text-muted-foreground text-xs">
                    {isVi ? 'Đang tải danh mục thiết bị...' : 'Loading devices...'}
                  </div>
                ) : isError ? (
                  <div className="p-4 text-center text-rose-500 text-xs space-y-2">
                    <p>{isVi ? 'Không thể tải danh sách thiết bị' : 'Failed to load devices'}</p>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs">
                      {isVi ? 'Thử lại' : 'Retry'}
                    </Button>
                  </div>
                ) : filteredVariants.length === 0 ? (
                  <div className="p-5 text-center text-muted-foreground text-xs space-y-2">
                    <p>{isVi ? 'Không tìm thấy thiết bị khớp' : 'No matching device found'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsManualModel(true);
                        handleManualModelChange(searchTerm);
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-600"
                    >
                      {isVi ? `Nhập thủ công "${searchTerm}"` : `Enter "${searchTerm}" manually`}
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/30">
                    {filteredVariants.slice(0, 30).map((v) => {
                      const isSelected = state.deviceVariantId === v.id;
                      return (
                        <li
                          key={v.id}
                          onClick={() => handleSelectVariant(v)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-500/15' : 'hover:bg-accent/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-card border border-border/40 flex items-center justify-center text-indigo-500 text-xs">
                              <Smartphone className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-xs">{v.name}</p>
                              <p className="text-[10px] text-muted-foreground">{v.sku} • {v.productName}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Mandatory IMEI Input Section */}
          <div className="pt-3 border-t border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>IMEI / Serial Number</span>
                <span className="text-rose-500 font-black">*</span>
              </label>

              {isImeiValid ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {isVi ? `IMEI hợp lệ (${cleanImei.length} số)` : `Valid IMEI (${cleanImei.length})`}
                </span>
              ) : cleanImei.length > 0 ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  {isVi ? `Cần 15 số (hiện có: ${cleanImei.length})` : `15 digits required (${cleanImei.length})`}
                </span>
              ) : (
                <span className="text-[11px] text-rose-500 font-medium">
                  {isVi ? 'Bắt buộc nhập đủ' : 'Required'}
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                type="text"
                maxLength={18}
                value={state.imei || ''}
                onChange={(e) => updateState({ imei: e.target.value.replace(/[^0-9A-Za-z]/g, '') })}
                placeholder={isVi ? 'Nhập đủ 15 số IMEI máy (Bắt buộc)...' : 'Enter 15-digit device IMEI (Required)...'}
                className={`w-full neu-inset bg-background/50 text-foreground font-mono text-sm tracking-wider ${
                  isImeiValid
                    ? 'border-emerald-500/50 focus:border-emerald-500 ring-1 ring-emerald-500/30'
                    : cleanImei.length > 0
                    ? 'border-amber-500/50'
                    : 'border-rose-500/40'
                }`}
              />
            </div>

            <p className="text-[10.5px] text-muted-foreground flex items-center justify-between">
              <span>{isVi ? 'Bấm *#06# trên điện thoại để tra cứu nhanh 15 số IMEI.' : 'Dial *#06# on phone to retrieve 15-digit IMEI.'}</span>
              <span className="font-mono text-[10px] font-bold">{cleanImei.length}/15</span>
            </p>
          </div>
        </div>

        {/* Right Column: Problem Description & Technician Assignment */}
        <div className="space-y-4 p-5 rounded-3xl bg-card border border-border/40 neu-raised">
          {/* Problem Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              {isVi ? 'Hiện tượng Lỗi & Yêu cầu Sửa chữa' : 'Fault Description & Repair Request'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={state.problemDescription || ''}
              onChange={(e) => updateState({ problemDescription: e.target.value })}
              placeholder={isVi ? 'VD: Rơi vỡ màn hình, liệt cảm ứng, camera sau rung nhòe, sạc không vào điện...' : 'E.g: Cracked screen, touch dead, rear camera blurry, won\'t charge...'}
              className={`w-full neu-inset bg-background/50 border rounded-2xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none transition-all ${
                isProblemDescValid
                  ? 'border-emerald-500/50 focus:border-emerald-500 ring-1 ring-emerald-500/30'
                  : cleanProblemDesc.length > 0
                  ? 'border-amber-500/50 focus:ring-1 focus:ring-amber-500/40'
                  : 'border-border/40 focus:ring-1 focus:ring-indigo-500/40'
              }`}
            />
            <div className="flex items-center justify-between mt-1 text-[10.5px]">
              <span className={isProblemDescValid ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                {cleanProblemDesc.length < 3
                  ? (isVi ? 'Tối thiểu 3 ký tự mô tả' : 'Minimum 3 characters required')
                  : INVALID_DESCRIPTIONS.has(cleanProblemDesc.toLowerCase())
                  ? (isVi ? 'Mô tả không hợp lệ' : 'Invalid description')
                  : (isVi ? '✓ Mô tả hợp lệ' : '✓ Description valid')}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{cleanProblemDesc.length} ký tự</span>
            </div>
          </div>

          {/* Cosmetic Condition */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              {isVi ? 'Tình trạng Ngoại quan Máy' : 'Cosmetic Condition'}
            </label>
            <Input
              type="text"
              value={state.cosmeticCondition || ''}
              onChange={(e) => updateState({ cosmeticCondition: e.target.value })}
              placeholder={isVi ? 'VD: Trầy xước viền, nứt lưng...' : 'E.g: Scratched bezel, cracked back...'}
              className="w-full neu-inset bg-background/50 border-border/40 text-foreground text-xs mb-1.5"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1">
              {COSMETIC_QUICK_TAGS.map((tag) => {
                const isSelected = (state.cosmeticCondition || '').includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleCosmeticTag(tag)}
                    className={`text-[10.5px] px-2 py-0.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 font-semibold'
                        : 'bg-card neu-raised border-border/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technician Assignment Section */}
          <div className="pt-3 border-t border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isVi ? 'Phân công Kỹ thuật viên phụ trách' : 'Technician Assignment'}</span>
              </label>
              {state.technicianName ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 border border-indigo-500/30">
                  <UserCheck className="w-3 h-3" />
                  {state.technicianName}
                </span>
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                  {isVi ? 'Chờ quản lý phân công' : 'Pending Assignment'}
                </span>
              )}
            </div>

            {/* Quick Self-Assignment Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSelfAssigned) {
                    // Unassign
                    updateState({ technicianId: undefined, technicianName: undefined });
                  } else if (user) {
                    // Self-assign
                    updateState({ technicianId: user.id, technicianName: user.fullName || user.username });
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSelfAssigned
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-card neu-raised border-border/40 text-foreground hover:bg-muted/30'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{isVi ? (isSelfAssigned ? '✓ Đang tự ghi danh cho tôi' : 'Tự ghi danh cho tôi (Nhận đơn này)') : (isSelfAssigned ? '✓ Assigned to Me' : 'Assign to Me')}</span>
              </button>

              {state.technicianId && (
                <button
                  type="button"
                  onClick={() => updateState({ technicianId: undefined, technicianName: undefined })}
                  className="py-2 px-3 rounded-xl border border-border/40 bg-card hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium text-muted-foreground transition-all cursor-pointer"
                  title={isVi ? 'Bỏ chọn phân công' : 'Clear assignment'}
                >
                  {isVi ? 'Bỏ chọn' : 'Clear'}
                </button>
              )}
            </div>

            {/* Manager/Admin Direct Technician Selector */}
            {isManagerOrAdmin ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                  <span>{isVi ? 'Hoặc chỉ định kỹ thuật viên chi nhánh:' : 'Or delegate to branch technician:'}</span>
                  <span className="text-[10px] text-indigo-500 font-semibold">{isVi ? 'Quyền Quản lý' : 'Manager Scope'}</span>
                </span>
                <select
                  value={isSelfAssigned ? '' : (state.technicianId || '')}
                  onChange={(e) => {
                    const techId = e.target.value;
                    const found = branchTechnicians.find(t => t.id === techId);
                    updateState({
                      technicianId: techId || undefined,
                      technicianName: found ? found.fullName : undefined
                    });
                  }}
                  className="w-full neu-inset bg-background/50 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                >
                  <option value="">{isVi ? '— Chọn kỹ thuật viên chi nhánh —' : '— Select branch technician —'}</option>
                  {branchTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.roles?.length ? `(${t.roles.join(', ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-muted-foreground">
                {isVi
                  ? '💡 Bạn đang thao tác với vai trò Kỹ thuật viên: Bạn có thể tự nhận phiếu này hoặc để trống để Quản lý chi nhánh điều phối.'
                  : '💡 Technician scope: You can self-assign this ticket or leave it unassigned for Manager dispatch.'}
              </div>
            )}

            {!state.technicianId && (
              <p className="text-[10.5px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                {isVi
                  ? '🔔 Đơn chưa phân công sẽ tự động tạo ở trạng thái "Chờ phân công" và gửi thông báo real-time tới Quản lý chi nhánh để duyệt & điều phối.'
                  : '🔔 Unassigned ticket will be placed in "Pending Assignment" and dispatch a real-time notification to the Branch Manager.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          className="neu-raised hover:neu-pressed text-muted-foreground hover:text-foreground flex items-center gap-2 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          {isVi ? 'Quay lại (Khách hàng)' : 'Back (Customer)'}
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!isFormValid && (
            <span className="text-xs text-rose-500 font-medium">
              {!hasDevice
                ? (isVi ? '⚠️ Vui lòng chọn hoặc nhập model thiết bị' : '⚠️ Please select or enter device model')
                : !isImeiValid
                ? (isVi ? '⚠️ Bắt buộc phải nhập đủ 14-18 ký tự IMEI' : '⚠️ 14-18 char IMEI is required')
                : (isVi ? '⚠️ Vui lòng nhập mô tả lỗi chi tiết (ít nhất 3 ký tự)' : '⚠️ Please enter fault description (min 3 chars)')}
            </span>
          )}

          <Button
            variant="outline"
            onClick={onNext}
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
              isFormValid
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/50 hover:scale-[1.02] active:scale-95 cursor-pointer'
                : 'opacity-50 cursor-not-allowed bg-muted/60 text-muted-foreground border border-border/40 shadow-none'
            }`}
          >
            {isVi ? 'Tiếp tục: Kiểm định QC 8 Điểm' : 'Continue: 8-Point QC'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
