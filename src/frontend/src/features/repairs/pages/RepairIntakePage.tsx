import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { i18nDictionary } from '@/locales/dictionary';
import { CustomerStep } from '../components/intake-steps/CustomerStep';
import { DeviceStep } from '../components/intake-steps/DeviceStep';
import { ChecklistStep } from '../components/intake-steps/ChecklistStep';
import { EstimateStep } from '../components/intake-steps/EstimateStep';
import { DepositStep } from '../components/intake-steps/DepositStep';
import { ReceiptStep } from '../components/intake-steps/ReceiptStep';
import { ArrowLeft, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface IntakeState {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  
  deviceVariantId?: string;
  deviceModel?: string;
  imei?: string;
  
  problemDescription?: string;
  cosmeticCondition?: string;
  checkpoints?: any[];
  
  estimatedCost?: number;
  
  depositAmount?: number;
  depositTransactionCode?: string;
  
  ticketId?: string;
  ticketCode?: string;
}

const STEPS = [
  { id: 1, name: 'Customer' },
  { id: 2, name: 'Device' },
  { id: 3, name: 'Checklist' },
  { id: 4, name: 'Estimate' },
  { id: 5, name: 'Deposit' },
  { id: 6, name: 'Receipt' }
];

export const RepairIntakePage: React.FC = () => {
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const tRep = i18nDictionary[language].repairs;

  const [currentStep, setCurrentStep] = useState(1);
  const [intakeState, setIntakeState] = useState<IntakeState>({});

  const updateState = (updates: Partial<IntakeState>) => {
    setIntakeState((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6 font-sans text-slate-500">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-[var(--neu-shadow-outer)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline"
            onClick={() => navigate('/repairs')}
            className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#10b981] transition-colors hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading font-medium text-2xl text-slate-900 tracking-tight">
              {language === 'vi' ? 'Tiếp nhận Phiếu Sửa Chữa Mới' : 'New Repair Intake'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              {language === 'vi' ? 'Quy trình tiếp nhận 6 bước tiêu chuẩn' : 'Standard 6-step intake process'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-[var(--neu-shadow-outer)]">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-400/20 z-0"></div>
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-[#10b981] text-white shadow-lg shadow-emerald-500/30'
                      : isCompleted
                      ? 'bg-white border-2 border-[#10b981] text-[#10b981]'
                      : 'bg-white border-2 border-slate-400/30 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-[11px] font-medium ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="p-6 min-h-[400px]">
        {currentStep === 1 && (
          <CustomerStep 
            state={intakeState} 
            updateState={updateState} 
            onNext={nextStep} 
          />
        )}
        {currentStep === 2 && (
          <DeviceStep 
            state={intakeState} 
            updateState={updateState} 
            onNext={nextStep} 
            onBack={prevStep} 
          />
        )}
        {currentStep === 3 && (
          <ChecklistStep 
            state={intakeState} 
            updateState={updateState} 
            onNext={nextStep} 
            onBack={prevStep} 
          />
        )}
        {currentStep === 4 && (
          <EstimateStep 
            state={intakeState} 
            updateState={updateState} 
            onNext={nextStep} 
            onBack={prevStep} 
          />
        )}
        {currentStep === 5 && (
          <DepositStep 
            state={intakeState} 
            updateState={updateState} 
            onNext={nextStep} 
            onBack={prevStep} 
          />
        )}
        {currentStep === 6 && (
          <ReceiptStep state={intakeState} />
        )}
      </Card>
    </div>
  );
};



