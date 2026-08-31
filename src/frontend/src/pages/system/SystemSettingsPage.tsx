import React, { useState } from 'react';
import {
  Settings,
  Building,
  QrCode,
  Phone,
  MapPin,
  Save,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSystemStore, type SystemSettings } from '../../stores/systemStore';
import { axiosClient } from '../../utils/axiosClient';
import toast from 'react-hot-toast';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const SystemSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSystemStore();
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { language } = useThemeStore();
  const t = i18nDictionary[language].settings;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosClient.put('/SystemSettings', {
        systemName: formData.systemName,
        systemLogoUrl: formData.systemLogoUrl,
        storePhone: formData.storePhone,
        storeAddress: formData.storeAddress,
        vietQrBank: formData.vietQrBank,
        vietQrBankName: formData.vietQrBankName,
        vietQrAccountNo: formData.vietQrAccountNo,
        vietQrAccountHolder: formData.vietQrAccountHolder,
      }).catch(console.error);

      updateSettings(formData);
      toast.success('Lưu cấu hình hệ thống & VietQR thành công!', { icon: '⚙️' });
    } catch {
      toast.error('Lỗi khi lưu cấu hình hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!');
      return;
    }

    setUploadingLogo(true);
    const data = new FormData();
    data.append('file', file);
    data.append('entityName', 'SystemLogo');
    data.append('entityId', '00000000-0000-0000-0000-000000000001');

    try {
      const response = await axiosClient.post('/FileAttachment', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = response.data?.data?.filePath || URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, systemLogoUrl: fileUrl }));
      toast.success('Đã tải ảnh logo lên thành công!');
    } catch {
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, systemLogoUrl: localUrl }));
      toast.success('Đã chọn ảnh logo mới!');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-10" style={{ color: 'var(--neu-text-title)' }}>
      {/* Action Header Banner */}
      <div
        className="p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          background: 'var(--neu-bg-base)',
          border: '1px solid var(--neu-border)',
          boxShadow: 'var(--neu-shadow-outer)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--neu-bg-base)',
              boxShadow: 'var(--neu-shadow-inset)',
              color: 'var(--neu-accent-mint)',
            }}
          >
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1
              className="font-heading text-2xl tracking-tight"
              style={{ color: 'var(--neu-text-title)', fontWeight: 500 }}
            >
              {t.settingsTitle}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-sub)' }}>
              {t.settingsSubtitle}
            </p>
          </div>
        </div>

        <Button variant="outline"
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-3 rounded-2xl text-white font-medium text-xs flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
          style={{
            background: 'linear-gradient(to right, #059669, #0d9488, #047857)',
          }}
        >
          <Save className="w-4 h-4" />
          {loading ? t.saving : t.btnSaveHeader}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: System & Store Branding */}
        <div
          className="p-6 rounded-3xl space-y-5"
          style={{
            background: 'var(--neu-bg-base)',
            border: '1px solid var(--neu-border)',
            boxShadow: 'var(--neu-shadow-outer)',
          }}
        >
          <div
            className="pb-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--neu-border)' }}
          >
            <h2
              className="font-heading text-base flex items-center gap-2"
              style={{ color: 'var(--neu-text-title)', fontWeight: 500 }}
            >
              <Building className="w-5 h-5" style={{ color: 'var(--neu-accent-mint)' }} />
              {t.section1Title}
            </h2>
            <span
              className="px-3 py-1 rounded-2xl text-[11px] font-medium"
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: 'var(--neu-accent-mint)',
                border: '1px solid rgba(16,185,129,0.35)',
                boxShadow: 'var(--neu-shadow-inset)',
              }}
            >
              {t.section1Badge}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                className="text-xs block mb-1.5 font-medium"
                style={{ color: 'var(--neu-text-title)' }}
              >
                {t.systemNameLabel}
              </label>
              <Input
                type="text"
                value={formData.systemName}
                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                placeholder="Ví dụ: Di Động Việt, PSP Enterprise..."
                className="w-full rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all"
                style={{
                  background: 'var(--neu-bg-base)',
                  border: '1px solid rgba(148,163,184,0.35)',
                  boxShadow: 'var(--neu-shadow-inset)',
                  color: 'var(--neu-text-title)',
                }}
                required
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--neu-text-sub)' }}>
                {t.systemNameHint}
              </p>
            </div>

            <div>
              <label
                className="text-xs block mb-1.5 font-medium"
                style={{ color: 'var(--neu-text-title)' }}
              >
                {t.storePhoneLabel}
              </label>
              <Input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                placeholder="0901 234 567"
                className="w-full rounded-2xl px-4 py-2.5 text-xs font-mono font-medium focus:outline-none transition-all"
                style={{
                  background: 'var(--neu-bg-base)',
                  border: '1px solid rgba(148,163,184,0.35)',
                  boxShadow: 'var(--neu-shadow-inset)',
                  color: 'var(--neu-text-title)',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label
              className="text-xs block mb-1.5 font-medium"
              style={{ color: 'var(--neu-text-title)' }}
            >
              {t.storeAddressLabel}
            </label>
            <Input
              type="text"
              value={formData.storeAddress}
              onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
              placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh..."
              className="w-full rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all"
              style={{
                background: 'var(--neu-bg-base)',
                border: '1px solid rgba(148,163,184,0.35)',
                boxShadow: 'var(--neu-shadow-inset)',
                color: 'var(--neu-text-title)',
              }}
              required
            />
          </div>

          {/* Logo File Upload Section */}
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{
              background: 'var(--neu-bg-base)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-shadow-inset)',
            }}
          >
            <label
              className="text-xs font-medium flex items-center gap-2"
              style={{ color: 'var(--neu-text-title)' }}
            >
              <ImageIcon className="w-4 h-4 text-purple-400" />
              {t.logoLabel}
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-16 h-16 aspect-square rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-[var(--neu-bg-base)]">
                {formData.systemLogoUrl ? (
                  <img src={formData.systemLogoUrl} alt="Logo Preview" className="w-full h-full aspect-square object-cover" />
                ) : (
                  <Building className="w-8 h-8" style={{ color: 'var(--neu-text-sub)' }} />
                )}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl z-10"
                  style={{
                    border: '1px solid var(--neu-border)',
                    boxShadow: 'var(--neu-shadow-inset)',
                  }}
                />
              </div>

              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  id="logoUploadInput"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logoUploadInput"
                  className="px-4 py-2 rounded-xl text-purple-400 font-medium text-xs inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
                  style={{
                    background: 'var(--neu-bg-base)',
                    border: '1px solid rgba(168,85,247,0.35)',
                    boxShadow: 'var(--neu-shadow-button)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? t.uploading : t.uploadLogoBtn}
                </label>
                <p className="text-[11px]" style={{ color: 'var(--neu-text-sub)' }}>
                  {t.logoHint}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: VietQR Payment Account Config */}
        <div
          className="p-6 rounded-3xl space-y-5"
          style={{
            background: 'var(--neu-bg-base)',
            border: '1px solid var(--neu-border)',
            boxShadow: 'var(--neu-shadow-outer)',
          }}
        >
          <div
            className="pb-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--neu-border)' }}
          >
            <h2
              className="font-heading text-base flex items-center gap-2"
              style={{ color: 'var(--neu-text-title)', fontWeight: 500 }}
            >
              <QrCode className="w-5 h-5" style={{ color: 'var(--neu-accent-mint)' }} />
              {t.section2Title}
            </h2>
            <span
              className="px-3 py-1 rounded-2xl text-[11px] font-medium"
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: 'var(--neu-accent-mint)',
                border: '1px solid rgba(16,185,129,0.35)',
                boxShadow: 'var(--neu-shadow-inset)',
              }}
            >
              {t.section2Badge}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                className="text-xs block mb-1.5 font-medium"
                style={{ color: 'var(--neu-text-title)' }}
              >
                {t.bankLabel}
              </label>
              <select
                value={formData.vietQrBank}
                onChange={(e) => {
                  const bankBin = e.target.value;
                  const bankNameMap: Record<string, string> = {
                    '970422': 'MBBank (NHTM CP Quân Đội)',
                    '970436': 'Vietcombank',
                    '970407': 'Techcombank',
                    '970415': 'VietinBank',
                    '970418': 'BIDV',
                  };
                  setFormData({
                    ...formData,
                    vietQrBank: bankBin,
                    vietQrBankName: bankNameMap[bankBin] || 'Ngân Hàng',
                  });
                }}
                className="w-full rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all"
                style={{
                  background: 'var(--neu-bg-base)',
                  border: '1px solid rgba(148,163,184,0.35)',
                  boxShadow: 'var(--neu-shadow-inset)',
                  color: 'var(--neu-text-title)',
                }}
              >
                <option value="970422">MBBank (MB - 970422)</option>
                <option value="970436">Vietcombank (VCB - 970436)</option>
                <option value="970407">Techcombank (TCB - 970407)</option>
                <option value="970415">VietinBank (CTG - 970415)</option>
                <option value="970418">BIDV (BIDV - 970418)</option>
              </select>
            </div>

            <div>
              <label
                className="text-xs block mb-1.5 font-medium"
                style={{ color: 'var(--neu-text-title)' }}
              >
                {t.accountNoLabel}
              </label>
              <Input
                type="text"
                value={formData.vietQrAccountNo}
                onChange={(e) => setFormData({ ...formData, vietQrAccountNo: e.target.value })}
                placeholder="Ví dụ: 038921104"
                className="w-full rounded-2xl px-4 py-2.5 text-xs font-mono font-medium focus:outline-none transition-all"
                style={{
                  background: 'var(--neu-bg-base)',
                  border: '1px solid rgba(148,163,184,0.35)',
                  boxShadow: 'var(--neu-shadow-inset)',
                  color: 'var(--neu-accent-mint)',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label
              className="text-xs block mb-1.5 font-medium"
              style={{ color: 'var(--neu-text-title)' }}
            >
              {t.accountHolderLabel}
            </label>
            <Input
              type="text"
              value={formData.vietQrAccountHolder}
              onChange={(e) => setFormData({ ...formData, vietQrAccountHolder: e.target.value.toUpperCase() })}
              placeholder="CONG TY PHONG SERVICE PLATFORM"
              className="w-full rounded-2xl px-4 py-2.5 text-xs font-medium uppercase focus:outline-none transition-all"
              style={{
                background: 'var(--neu-bg-base)',
                border: '1px solid rgba(148,163,184,0.35)',
                boxShadow: 'var(--neu-shadow-inset)',
                color: 'var(--neu-text-title)',
              }}
              required
            />
          </div>

          <div
            className="p-4 rounded-2xl flex items-start gap-3 text-xs"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.28)',
            }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--neu-accent-mint)' }} />
            <div className="space-y-1">
              <p className="font-medium" style={{ color: 'var(--neu-text-title)' }}>{t.vietQrNote}</p>
              <p className="text-[11px]" style={{ color: 'var(--neu-text-sub)' }}>
                {formData.vietQrAccountNo} — {formData.vietQrBankName}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <Button variant="outline"
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl text-white font-medium text-sm flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              background: 'linear-gradient(to right, #059669, #0d9488, #047857)',
            }}
          >
            <Save className="w-5 h-5" />
            {loading ? t.savingAll : t.btnSaveAll}
          </Button>
        </div>
      </form>
    </div>
  );
};
