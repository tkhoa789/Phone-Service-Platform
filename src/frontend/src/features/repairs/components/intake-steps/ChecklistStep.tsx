import React, { useState } from 'react';
import type { IntakeState, IntakeCheckpoint, CustomQcItem } from '../../types/intake.types';
import { useThemeStore } from '@/stores/themeStore';
import { ShieldCheck, Check, X, CheckCheck, PowerOff, ArrowLeft, ArrowRight, Info, Sliders, BatteryCharging, Droplets, Shield, Package, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CheckpointConfig {
  key: string;
  nameVi: string;
  nameEn: string;
  hintVi: string;
  hintEn: string;
}

const CANONICAL_CHECKPOINTS: CheckpointConfig[] = [
  {
    key: 'Display',
    nameVi: 'Màn hình hiển thị',
    nameEn: 'Display / Screen',
    hintVi: 'Hiển thị sáng đều, không sọc, không đốm mực, không ám màu',
    hintEn: 'Bright display, no lines, no dead pixels or discoloration'
  },
  {
    key: 'Touch',
    nameVi: 'Cảm ứng / Vuốt chạm',
    nameEn: 'Touch / Digitizer',
    hintVi: 'Cảm ứng mượt mà toàn màn hình, không đứt đoạn, không loạn cảm ứng',
    hintEn: 'Smooth touch everywhere, no dead zones or ghost touches'
  },
  {
    key: 'FaceID',
    nameVi: 'FaceID / TouchID (Sinh trắc học)',
    nameEn: 'FaceID / TouchID / Biometrics',
    hintVi: 'Nhận diện khuôn mặt hoặc vân tay mở khóa nhanh, không báo lỗi phần cứng',
    hintEn: 'Fast biometric unlock, no hardware error warning'
  },
  {
    key: 'Camera',
    nameVi: 'Camera trước, Camera sau & Flash',
    nameEn: 'Front & Rear Cameras, Flash',
    hintVi: 'Chụp rõ nét, lấy nét tự động tốt, không đốm camera, đèn flash hoạt động',
    hintEn: 'Clear photos, auto focus works, no dust spots, flash lights up'
  },
  {
    key: 'Speakers',
    nameVi: 'Loa trong, Loa ngoài & Micro',
    nameEn: 'Speakers & Microphones',
    hintVi: 'Âm thanh đàm thoại và phát nhạc to rõ, mic thu âm không rè',
    hintEn: 'Loud earpiece and speaker audio, mic captures clear sound'
  },
  {
    key: 'Charging',
    nameVi: 'Chân sạc & Cổng kết nối dữ liệu',
    nameEn: 'Charging Port & Data Transfer',
    hintVi: 'Cắm sạc nhận dòng ổn định, cắm cáp máy tính nhận dữ liệu',
    hintEn: 'Reliable charging current, fast cable data recognition'
  },
  {
    key: 'Wifi',
    nameVi: 'Sóng Wi-Fi & Bluetooth',
    nameEn: 'Wi-Fi & Bluetooth Connectivity',
    hintVi: 'Dò tìm và kết nối mạng Wi-Fi và thiết bị Bluetooth bình thường',
    hintEn: 'Discovers and connects to Wi-Fi networks and Bluetooth devices'
  },
  {
    key: 'Body',
    nameVi: 'Nút bấm vật lý & Ngoại quan vỏ',
    nameEn: 'Physical Buttons & Chassis',
    hintVi: 'Nút nguồn, tăng/giảm âm lượng, gạt rung nảy tốt; sườn máy không cong vênh',
    hintEn: 'Power, volume, mute switch click well; chassis not warped'
  },
];

const BATTERY_TAGS = [
  'Pin Zin 100%',
  'Pin 85% - 90%',
  'Bảo trì pin (<80%)',
  'Pin phù rộp',
  'Đã thay pin linh kiện'
];

const WATER_TAGS = [
  'Còn áp suất chống nước',
  'Mất áp suất (Đã tháo máy)',
  'Có dấu hiệu vào nước / quỳ tím đỏ'
];

const SEAL_TAGS = [
  'Ốc đít nguyên bản chưa chạm',
  'Ốc đít toét ren / thiếu ốc',
  'Còn tem niêm phong',
  'Đã rách tem bảo hành'
];

const ACCESSORY_TAGS = [
  'Có khay SIM',
  'Không khay SIM',
  'Kèm ốp lưng',
  'Dán cường lực nứt vỡ sẵn',
  'Kèm thẻ nhớ MicroSD'
];

export const ChecklistStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const [isPowerOff, setIsPowerOff] = useState<boolean>(Boolean(state.isPowerOff));

  // Customizable QC Notes Section Toggle
  const [isQcActive, setIsQcActive] = useState<boolean>(Boolean(state.isQcCustomNotesActive));
  const [qcNotes, setQcNotes] = useState<string>(state.qcCustomNotes || '');
  const [batteryHealth, setBatteryHealth] = useState<string>(state.qcBatteryHealth || '');
  const [waterResistance, setWaterResistance] = useState<string>(state.qcWaterResistance || '');
  const [sealCondition, setSealCondition] = useState<string>(state.qcSealCondition || '');
  const [includedAccessories, setIncludedAccessories] = useState<string>(state.qcIncludedAccessories || '');
  
  // Custom checkpoints list
  const [customItems, setCustomItems] = useState<CustomQcItem[]>(state.qcCustomItems || []);
  const [newItemName, setNewItemName] = useState('');

  // Initialize standard 8 checkpoints
  const [checkpoints, setCheckpoints] = useState<IntakeCheckpoint[]>(() => {
    if (state.checkpoints && state.checkpoints.length > 0) {
      return CANONICAL_CHECKPOINTS.map((cfg) => {
        const found = state.checkpoints?.find((cp) => cp.checkPointName === cfg.key);
        return found || { checkPointName: cfg.key, isPassed: true, issueDescription: '' };
      });
    }
    return CANONICAL_CHECKPOINTS.map((cfg) => ({
      checkPointName: cfg.key,
      isPassed: true,
      issueDescription: '',
    }));
  });

  const toggleStatus = (key: string, isPassed: boolean) => {
    setCheckpoints((prev) =>
      prev.map((cp) => {
        if (cp.checkPointName === key) {
          return {
            ...cp,
            isPassed,
            issueDescription: isPassed ? '' : cp.issueDescription || (isVi ? 'Lỗi hoạt động' : 'Faulty'),
          };
        }
        return cp;
      })
    );
  };

  const updateNotes = (key: string, text: string) => {
    setCheckpoints((prev) =>
      prev.map((cp) => (cp.checkPointName === key ? { ...cp, issueDescription: text } : cp))
    );
  };

  const setAllPassed = () => {
    setIsPowerOff(false);
    setCheckpoints(
      CANONICAL_CHECKPOINTS.map((cfg) => ({
        checkPointName: cfg.key,
        isPassed: true,
        issueDescription: '',
      }))
    );
  };

  const handlePowerOffToggle = () => {
    const nextVal = !isPowerOff;
    setIsPowerOff(nextVal);
    if (nextVal) {
      setCheckpoints(
        CANONICAL_CHECKPOINTS.map((cfg) => ({
          checkPointName: cfg.key,
          isPassed: false,
          issueDescription: isVi ? 'Máy mất nguồn (chưa kiểm tra được)' : 'No power (untested)',
        }))
      );
    } else {
      setAllPassed();
    }
  };

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;
    const newItem: CustomQcItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      isPassed: true,
      notes: ''
    };
    setCustomItems([...customItems, newItem]);
    setNewItemName('');
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };

  const handleToggleCustomItem = (id: string, isPassed: boolean) => {
    setCustomItems(customItems.map(item => item.id === id ? { ...item, isPassed } : item));
  };

  const handleUpdateCustomItemNotes = (id: string, notes: string) => {
    setCustomItems(customItems.map(item => item.id === id ? { ...item, notes } : item));
  };

  const handleNext = () => {
    updateState({
      checkpoints,
      isPowerOff,
      isQcCustomNotesActive: isQcActive,
      qcCustomNotes: qcNotes,
      qcBatteryHealth: batteryHealth,
      qcWaterResistance: waterResistance,
      qcSealCondition: sealCondition,
      qcIncludedAccessories: includedAccessories,
      qcCustomItems: customItems
    });
    onNext();
  };

  const passCount = checkpoints.filter((c) => c.isPassed).length;
  const failCount = checkpoints.length - passCount;

  return (
    <div className="space-y-6">
      {/* Header & Standard Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              {isVi ? '3. Kiểm Định 8 Điểm Tiêu Chuẩn & QC Tùy Chỉnh' : '3. 8-Point Standard QC & Custom Notes'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isVi
                ? `Xác nhận tình trạng máy trước tiếp nhận: ${passCount}/8 Đạt, ${failCount}/8 Lỗi`
                : `Pre-intake condition checklist: ${passCount}/8 Passed, ${failCount}/8 Failed`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={setAllPassed}
            className="neu-raised hover:neu-pressed text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {isVi ? 'Đạt tất cả' : 'Pass All'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePowerOffToggle}
            className={`neu-raised text-xs flex items-center gap-1.5 transition-all ${
              isPowerOff
                ? 'bg-rose-500 text-white border-rose-600 shadow-inner font-bold'
                : 'border-amber-500/30 text-amber-600 dark:text-amber-400 hover:neu-pressed'
            }`}
          >
            <PowerOff className="w-3.5 h-3.5" />
            {isPowerOff
              ? (isVi ? 'Đang bật: Máy mất nguồn' : 'Active: No Power')
              : (isVi ? 'Máy mất nguồn / Không lên' : 'Device Has No Power')}
          </Button>
        </div>
      </div>

      {isPowerOff && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <p>
            {isVi
              ? 'Thiết bị tiếp nhận trong trạng thái mất nguồn/không khởi động được. Toàn bộ 8 mục kiểm tra đã được đánh dấu không thể kiểm tra để bảo vệ quyền lợi kỹ thuật viên và khách hàng.'
              : 'Device received in power-off/unbootable condition. All 8 checkpoints marked as untested.'}
          </p>
        </div>
      )}

      {/* 8 Canonical Checkpoints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CANONICAL_CHECKPOINTS.map((cfg) => {
          const cp = checkpoints.find((c) => c.checkPointName === cfg.key) || {
            checkPointName: cfg.key,
            isPassed: true,
            issueDescription: '',
          };

          return (
            <div
              key={cfg.key}
              className={`p-4 rounded-2xl border transition-all ${
                cp.isPassed
                  ? 'bg-card neu-raised border-border/40'
                  : 'bg-rose-500/5 border-rose-500/30 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {isVi ? cfg.nameVi : cfg.nameEn}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      cp.isPassed
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}>
                      {cp.isPassed ? (isVi ? 'ĐẠT' : 'PASS') : (isVi ? 'LỖI' : 'FAIL')}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isVi ? cfg.hintVi : cfg.hintEn}
                  </p>
                </div>

                {/* Pass / Fail Toggle Controls */}
                <div className="flex items-center rounded-xl p-1 bg-background neu-inset border border-border/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleStatus(cfg.key, true)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      cp.isPassed
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-emerald-500'
                    }`}
                    title={isVi ? 'Bình thường' : 'Normal / Passed'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(cfg.key, false)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      !cp.isPassed
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-rose-500'
                    }`}
                    title={isVi ? 'Có lỗi / Hỏng' : 'Defective / Failed'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Note input when failed */}
              {!cp.isPassed && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <Input
                    type="text"
                    value={cp.issueDescription || ''}
                    onChange={(e) => updateNotes(cfg.key, e.target.value)}
                    placeholder={isVi ? 'Chi tiết lỗi (VD: Sọc màn, liệt mic, bể kính...)' : 'Issue details...'}
                    className="w-full neu-inset bg-background/50 border-rose-500/30 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* BẢNG GHI CHÚ KIỂM ĐỊNH QC TÙY CHỈNH (CÓ NÚT ON / OFF CHỨC NĂNG) */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-card border border-border/40 neu-raised space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isQcActive ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-muted text-muted-foreground'
            }`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isVi ? 'Bảng Ghi Chú & Thẩm Định QC Mở Rộng' : 'Custom QC & Extended Inspection Table'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isVi
                  ? 'Ghi nhận chuyên sâu về pin, áp suất, tem ốc, phụ kiện và bổ sung tiêu chí kiểm định tùy ý'
                  : 'Detailed battery, pressure, seal, accessory inspection and custom criteria'}
              </p>
            </div>
          </div>

          {/* ON / OFF Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${isQcActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
              {isQcActive ? (isVi ? 'ĐANG BẬT [ON]' : 'ACTIVE [ON]') : (isVi ? 'ĐANG TẮT [OFF]' : 'INACTIVE [OFF]')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isQcActive}
              onClick={() => setIsQcActive(!isQcActive)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 neu-inset ${
                isQcActive ? 'bg-indigo-600' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isQcActive ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Content visible only when ON */}
        {isQcActive ? (
          <div className="space-y-4 pt-1">
            {/* Quick Inspection Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group 1: Battery */}
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isVi ? 'Tình Trạng Pin & Chu Kỳ' : 'Battery Status'}</span>
                </div>
                <Input
                  type="text"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder={isVi ? 'VD: 86%, Zin nguyên bản...' : 'E.g: 86%, OEM...'}
                  className="w-full neu-inset bg-background/60 text-xs text-foreground py-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {BATTERY_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBatteryHealth(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        batteryHealth === t
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold'
                          : 'bg-card border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 2: Water resistance */}
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isVi ? 'Áp Suất & Kháng Nước' : 'Water Resistance'}</span>
                </div>
                <Input
                  type="text"
                  value={waterResistance}
                  onChange={(e) => setWaterResistance(e.target.value)}
                  placeholder={isVi ? 'VD: Còn áp suất, đã tháo máy...' : 'E.g: Intact pressure, opened...'}
                  className="w-full neu-inset bg-background/60 text-xs text-foreground py-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {WATER_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWaterResistance(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        waterResistance === t
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-bold'
                          : 'bg-card border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 3: Screws & Warranty seal */}
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isVi ? 'Ốc Đít & Tem Niêm Phong' : 'Seal & Screws'}</span>
                </div>
                <Input
                  type="text"
                  value={sealCondition}
                  onChange={(e) => setSealCondition(e.target.value)}
                  placeholder={isVi ? 'VD: Ốc zin, toét ren...' : 'E.g: OEM screws, damaged...'}
                  className="w-full neu-inset bg-background/60 text-xs text-foreground py-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {SEAL_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSealCondition(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        sealCondition === t
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold'
                          : 'bg-card border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 4: Included Accessories */}
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Package className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isVi ? 'Phụ Kiện Đi Kèm Máy' : 'Included Accessories'}</span>
                </div>
                <Input
                  type="text"
                  value={includedAccessories}
                  onChange={(e) => setIncludedAccessories(e.target.value)}
                  placeholder={isVi ? 'VD: Khay SIM, ốp lưng...' : 'E.g: SIM tray, case...'}
                  className="w-full neu-inset bg-background/60 text-xs text-foreground py-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {ACCESSORY_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const current = includedAccessories ? `${includedAccessories}, ${t}` : t;
                        setIncludedAccessories(current);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-border/30 bg-card text-muted-foreground hover:text-foreground"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Checklist Rows */}
            <div className="p-4 rounded-2xl bg-background/40 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {isVi ? 'Tiêu Chí Thẩm Định Bổ Sung (Tùy biến)' : 'Custom Criteria Items'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {customItems.length} {isVi ? 'hạng mục thêm' : 'items'}
                </span>
              </div>

              {customItems.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-card neu-raised border border-border/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-semibold text-foreground">{item.name}</span>
                    <Input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateCustomItemNotes(item.id, e.target.value)}
                      placeholder={isVi ? 'Ghi chú thêm...' : 'Notes...'}
                      className="neu-inset text-[11px] py-1 h-7 flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCustomItem(item.id, true)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                        item.isPassed ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:text-emerald-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCustomItem(item.id, false)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                        !item.isPassed ? 'bg-rose-500 text-white' : 'text-muted-foreground hover:text-rose-500'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/10 ml-1"
                      title={isVi ? 'Xóa mục này' : 'Delete item'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add row bar */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomItem())}
                  placeholder={isVi ? 'Tên tiêu chí cần kiểm tra thêm (VD: Bút S-Pen, Cảm biến tiệm cận, Rung Haptic...)' : 'New test item...'}
                  className="neu-inset text-xs py-1.5 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddCustomItem}
                  disabled={!newItemName.trim()}
                  className="neu-raised text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isVi ? 'Thêm' : 'Add'}
                </Button>
              </div>
            </div>

            {/* General QC Textarea */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {isVi ? 'Ghi Chú Tổng Hợp Kỹ Thuật Viên QC' : 'Technician General QC Summary'}
              </label>
              <textarea
                rows={2}
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                placeholder={isVi ? 'Ghi nhận thêm dặn dò riêng của kỹ thuật viên khi nhận máy...' : 'Additional QC observations...'}
                className="w-full neu-inset bg-background/50 border border-border/40 rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/20 text-xs text-muted-foreground text-center">
            {isVi
              ? 'Bảng ghi chú kiểm định mở rộng đang TẮT. Bật công tắc phía trên nếu muốn ghi nhận pin, áp suất, tem niêm phong hoặc thêm tiêu chí kiểm tra tùy chỉnh.'
              : 'Advanced QC inspection table is turned OFF. Switch toggle above to enable extended criteria.'}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          className="neu-raised hover:neu-pressed text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {isVi ? 'Quay lại (Thiết bị)' : 'Back (Device)'}
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
        >
          {isVi ? 'Tiếp tục: Báo giá dự kiến' : 'Continue: Cost Estimate'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
