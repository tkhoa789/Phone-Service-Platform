import React, { useState } from 'react';
import type { IntakeState } from '../../pages/RepairIntakePage';
import { useThemeStore } from '@/stores/themeStore';
import { Calculator, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EstimateStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const [costInput, setCostInput] = useState<string>(
    state.estimatedCost ? state.estimatedCost.toString() : ''
  );

  const handleNext = () => {
    const cost = parseFloat(costInput) || 0;
    updateState({ estimatedCost: cost });
    onNext();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-slate-900">
            {language === 'vi' ? '4. Báo giá Dự kiến' : '4. Estimated Cost'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'vi' ? 'Nhập chi phí sửa chữa dự kiến cho khách hàng' : 'Enter the estimated repair cost for the customer'}
          </p>
        </div>
      </div>

      <div className="mt-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-6">
        <div className="text-center w-full max-w-sm">
          <label className="block text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
            {language === 'vi' ? 'Tổng chi phí dự kiến (VND)' : 'Total Estimated Cost'}
          </label>
          
          <div className="relative group">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500 transition-transform group-focus-within:scale-110" />
            <Input
              type="number"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder="0"
              className="w-full bg-white border-2 border-slate-300/40 rounded-2xl pl-12 pr-4 py-4 text-3xl font-heading font-bold text-center text-slate-900 shadow-sm focus:shadow-inner focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/20">
        <Button variant="outline"
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-white text-slate-500 hover:text-slate-900 font-medium text-sm shadow-sm hover:shadow-sm transition-all"
        >
          {language === 'vi' ? 'Quay lại' : 'Back'}
        </Button>
        <Button variant="outline"
          onClick={handleNext}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {language === 'vi' ? 'Xác nhận Báo giá' : 'Confirm Estimate'}
        </Button>
      </div>
    </div>
  );
};


