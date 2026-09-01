import React, { useState, useEffect } from 'react';
import type { IntakeState, IntakeCheckpoint } from '../../pages/RepairIntakePage';
import { useThemeStore } from '@/stores/themeStore';
import { ShieldCheck, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_CHECKPOINTS = [
  'Display / Screen',
  'Touch / Digitizer',
  'FaceID / TouchID',
  'Cameras (Front & Rear)',
  'Speakers & Mic',
  'Charging Port',
  'WiFi & Bluetooth',
  'Physical Buttons'
];

export const ChecklistStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  
  // Initialize checkpoints if empty
  const [checkpoints, setCheckpoints] = useState<IntakeCheckpoint[]>(
    state.checkpoints && state.checkpoints.length > 0
      ? state.checkpoints
      : DEFAULT_CHECKPOINTS.map(name => ({ checkPointName: name, isPassed: true, issueDescription: '' }))
  );

  // Sync to parent state when navigating away
  const handleNext = () => {
    updateState({ checkpoints });
    onNext();
  };

  const toggleStatus = (index: number, isPassed: boolean) => {
    const updated = [...checkpoints];
    updated[index].isPassed = isPassed;
    if (isPassed) {
      updated[index].issueDescription = '';
    }
    setCheckpoints(updated);
  };

  const updateNotes = (index: number, text: string) => {
    const updated = [...checkpoints];
    updated[index].issueDescription = text;
    setCheckpoints(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-slate-900">
            {language === 'vi' ? '3. Kiểm tra Chức năng (Checklist)' : '3. Functional Checklist'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'vi' ? 'Đánh giá 8 điểm chức năng tiêu chuẩn trước khi nhận máy' : 'Standard 8-point functional test before intake'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {checkpoints.map((cp, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-300/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-slate-900">{cp.checkPointName}</span>
              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200/20">
                <Button variant="outline"
                  onClick={() => toggleStatus(idx, true)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    cp.isPassed ? 'bg-emerald-500 text-white shadow-inner' : 'text-slate-400 hover:text-emerald-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button variant="outline"
                  onClick={() => toggleStatus(idx, false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    !cp.isPassed ? 'bg-rose-500 text-white shadow-inner' : 'text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {!cp.isPassed && (
              <Input
                type="text"
                value={cp.issueDescription}
                onChange={(e) => updateNotes(idx, e.target.value)}
                placeholder={language === 'vi' ? 'Ghi chú lỗi...' : 'Describe issue...'}
                className="w-full bg-white border border-slate-300/40 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-1 focus:ring-rose-500/50"
              />
            )}
          </div>
        ))}
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
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
        >
          {language === 'vi' ? 'Tiếp tục' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};


