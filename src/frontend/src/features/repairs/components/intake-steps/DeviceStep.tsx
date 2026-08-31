import React, { useState } from 'react';
import { usePosVariants } from '@/features/pos/hooks/usePosCatalog';
import type { IntakeState } from '../../pages/RepairIntakePage';
import { useThemeStore } from '@/stores/themeStore';
import { Smartphone, Search, CheckCircle2 } from 'lucide-react';
import { productService } from '@/services/productService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import type { ProductVariantDto } from '@/types/api.types';
import toast from 'react-hot-toast';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DeviceStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [variants, setVariants] = useState<ProductVariantDto[]>([]);
  const [loading, setLoading] = useState(false);

  

  const filteredVariants = variants.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (v: ProductVariantDto) => {
    updateState({ deviceVariantId: v.id, deviceModel: v.name });
  };

  const isFormValid = state.deviceVariantId && state.problemDescription && state.problemDescription.trim().length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-slate-900">
        {language === 'vi' ? '2. Thông tin Thiết bị & Lỗi' : '2. Device & Issue Information'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Device Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-900">
            {language === 'vi' ? 'Chọn Model Thiết Bị' : 'Select Device Model'}
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10b981]" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm tên thiết bị, model...' : 'Search device, model...'}
              className="w-full bg-white border border-slate-300/40 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
            ) : filteredVariants.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                {language === 'vi' ? 'Không tìm thấy' : 'No devices found'}
              </div>
            ) : (
              <ul className="divide-y divide-slate-400/20">
                {filteredVariants.map((v) => (
                  <li 
                    key={v.id} 
                    onClick={() => handleSelect(v)}
                    className="p-3 flex items-center justify-between hover:bg-emerald-500/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#10b981]">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{v.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{v.productName} - {v.sku}</p>
                      </div>
                    </div>
                    {state.deviceVariantId === v.id && <CheckCircle2 className="w-5 h-5 text-[#10b981]" />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Issue Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              IMEI / Serial Number
            </label>
            <Input
              type="text"
              value={state.imei || ''}
              onChange={(e) => updateState({ imei: e.target.value })}
              placeholder={language === 'vi' ? 'Nhập IMEI hoặc Serial...' : 'Enter IMEI or Serial...'}
              className="w-full bg-white border border-slate-300/40 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              {language === 'vi' ? 'Mô tả Lỗi & Tình trạng' : 'Issue Description'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={state.problemDescription || ''}
              onChange={(e) => updateState({ problemDescription: e.target.value })}
              placeholder={language === 'vi' ? 'VD: Bể màn hình, mất nguồn...' : 'E.g: Broken screen, no power...'}
              className="w-full bg-white border border-slate-300/40 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              {language === 'vi' ? 'Tình trạng ngoại quan' : 'Cosmetic Condition'}
            </label>
            <Input
              type="text"
              value={state.cosmeticCondition || ''}
              onChange={(e) => updateState({ cosmeticCondition: e.target.value })}
              placeholder={language === 'vi' ? 'VD: Trầy xước nhẹ...' : 'E.g: Minor scratches...'}
              className="w-full bg-white border border-slate-300/40 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack}>
          {language === 'vi' ? 'Quay lại' : 'Back'}
        </Button>
        <Button variant="outline"
          onClick={onNext}
          disabled={!isFormValid}
          className={`px-6 py-3 rounded-2xl font-medium text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-95 ${
            isFormValid
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
              : 'bg-slate-400/20 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {language === 'vi' ? 'Tiếp tục' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};


