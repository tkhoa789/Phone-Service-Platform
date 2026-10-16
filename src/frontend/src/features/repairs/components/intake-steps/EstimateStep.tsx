import React, { useState } from 'react';
import type { IntakeState } from '../../types/intake.types';
import { useThemeStore } from '@/stores/themeStore';
import { Calculator, DollarSign, CheckCircle2, ArrowLeft, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const QUICK_AMOUNTS = [
  { label: '+100k', value: 100000 },
  { label: '+200k', value: 200000 },
  { label: '+350k', value: 350000 },
  { label: '+500k', value: 500000 },
  { label: '+1 Tr', value: 1000000 },
  { label: '+2 Tr', value: 2000000 },
];

export const EstimateStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const [costInput, setCostInput] = useState<string>(
    state.estimatedCost !== undefined ? state.estimatedCost.toString() : '0'
  );
  const [isQuoteLater, setIsQuoteLater] = useState<boolean>(
    Boolean(state.isQuoteLater || (state.estimatedCost === 0 && state.estimatedCost !== undefined))
  );

  const numericCost = parseFloat(costInput) || 0;

  const handleAddAmount = (val: number) => {
    setIsQuoteLater(false);
    const nextVal = numericCost + val;
    setCostInput(nextVal.toString());
  };

  const handleSetQuoteLater = () => {
    setIsQuoteLater(true);
    setCostInput('0');
  };

  const handleNext = () => {
    const cost = isQuoteLater ? 0 : parseFloat(costInput) || 0;
    updateState({ estimatedCost: cost, isQuoteLater });
    onNext();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            {language === 'vi' ? '4. Báo Giá Sửa Chữa Dự Kiến' : '4. Estimated Repair Cost'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'vi'
              ? 'Tạm tính chi phí dịch vụ/linh kiện hoặc để 0đ nếu cần bung máy chẩn đoán báo sau'
              : 'Estimate service/parts cost or set to 0 if deep diagnostic quote is required'}
          </p>
        </div>
      </div>

      {/* Main Calculation Card */}
      <div className="p-8 rounded-3xl bg-card border border-border/40 neu-raised space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {language === 'vi' ? 'Tổng chi phí ước tính (VND)' : 'Total Estimated Cost (VND)'}
          </label>

          {/* Big Amount Display */}
          <div className="relative w-full max-w-md">
            <div className="relative flex items-center">
              <span className="absolute left-4 font-mono text-xl font-bold text-amber-500 select-none">
                ₫
              </span>
              <Input
                type="number"
                min="0"
                step="10000"
                value={isQuoteLater ? '0' : costInput}
                onChange={(e) => {
                  setIsQuoteLater(false);
                  setCostInput(e.target.value);
                }}
                disabled={isQuoteLater}
                placeholder="0"
                className="w-full neu-inset bg-background/50 border-border/40 pl-11 pr-4 py-4 text-3xl font-heading font-black text-center text-foreground disabled:opacity-50"
              />
              {numericCost > 0 && !isQuoteLater && (
                <button
                  type="button"
                  onClick={() => setCostInput('0')}
                  className="absolute right-4 text-muted-foreground hover:text-foreground p-1"
                  title={language === 'vi' ? 'Đặt lại 0đ' : 'Reset to 0'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Human-readable formatted text */}
            <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
              {isQuoteLater
                ? (language === 'vi' ? '— Báo giá sau kiểm tra chuyên sâu —' : '— Quote after deep diagnosis —')
                : `${numericCost.toLocaleString('vi-VN')} VNĐ`}
            </p>
          </div>

          {/* Quick Denominations */}
          <div className="w-full max-w-md pt-2">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {language === 'vi' ? 'Cộng nhanh chi phí:' : 'Quick increments:'}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt.label}
                  type="button"
                  onClick={() => handleAddAmount(amt.value)}
                  className="py-1.5 px-2 rounded-xl bg-background neu-raised hover:neu-pressed border border-border/40 text-xs font-semibold text-foreground transition-all"
                >
                  {amt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quote Later Toggle Option */}
          <div className="pt-3 border-t border-border/30 w-full max-w-md flex justify-center">
            <button
              type="button"
              onClick={handleSetQuoteLater}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                isQuoteLater
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm'
                  : 'neu-raised border-border/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'vi'
                ? 'Báo giá sau kiểm tra chuyên sâu (Chưa báo giá)'
                : 'Quote later after deep technician diagnosis'}
            </button>
          </div>
        </div>

        {/* Advisory Box */}
        <div className="p-4 rounded-2xl bg-background/50 border border-border/30 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {language === 'vi' ? 'Chính sách minh bạch giá cả:' : 'Transparent Pricing Policy:'}
          </p>
          <p>
            {language === 'vi'
              ? 'Chi phí trên là dự kiến ban đầu. Nếu trong quá trình tháo lắp phát hiện hỏng hóc phát sinh, kỹ thuật viên bắt buộc liên hệ khách hàng để xác nhận trước khi sửa chữa.'
              : 'The estimate is tentative. If additional issues are identified during repair, technician must obtain customer approval prior to proceeding.'}
          </p>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          className="neu-raised hover:neu-pressed text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'vi' ? 'Quay lại (Kiểm định)' : 'Back (Checklist)'}
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
        >
          {language === 'vi' ? 'Tiếp tục: Đặt cọc / Tạo phiếu' : 'Continue: Deposit / Create Ticket'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
