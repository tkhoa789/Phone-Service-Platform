import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { CustomerStep } from '../components/intake-steps/CustomerStep';
import { DeviceStep } from '../components/intake-steps/DeviceStep';
import { ChecklistStep } from '../components/intake-steps/ChecklistStep';
import { EstimateStep } from '../components/intake-steps/EstimateStep';
import { DepositStep } from '../components/intake-steps/DepositStep';
import { ReceiptStep } from '../components/intake-steps/ReceiptStep';
import { ArrowLeft, Check, Wrench, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import type { IntakeCheckpoint, IntakeState } from '../types/intake.types';
export type { IntakeCheckpoint, IntakeState };

interface StepDef {
  id: number;
  nameVi: string;
  nameEn: string;
}

const STEPS: StepDef[] = [
  { id: 1, nameVi: 'Khách Hàng', nameEn: 'Customer' },
  { id: 2, nameVi: 'Thiết Bị & Lỗi', nameEn: 'Device & Issue' },
  { id: 3, nameVi: 'Kiểm Định QC', nameEn: '8-Point QC' },
  { id: 4, nameVi: 'Báo Giá Dự Kiến', nameEn: 'Estimate' },
  { id: 5, nameVi: 'Đặt Cọc / Tạo Phiếu', nameEn: 'Deposit & Ticket' },
  { id: 6, nameVi: 'Hoàn Tất & In', nameEn: 'Receipt & K80' },
];

export const RepairIntakePage: React.FC = () => {
  const { language } = useThemeStore();
  const navigate = useNavigate();

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

  const handleStepClick = (stepId: number) => {
    // Only allow clicking prior steps if not yet on Receipt step
    if (stepId < currentStep && currentStep < 6) {
      setCurrentStep(stepId);
    }
  };

  const handleReset = () => {
    setIntakeState({});
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6 font-sans text-foreground">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/repairs')}
            className="w-10 h-10 rounded-2xl neu-raised hover:neu-pressed flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            title={language === 'vi' ? 'Về danh sách sửa chữa' : 'Back to repairs'}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading font-black text-2xl text-foreground tracking-tight flex items-center gap-2.5">
              <Wrench className="w-6 h-6 text-indigo-500" />
              {language === 'vi' ? 'Tiếp Nhận Phiếu Sửa Chữa Mới' : 'New Repair Ticket Intake'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'vi'
                ? 'Quy trình chuẩn 6 bước: định danh khách hàng, kiểm định 8 điểm, báo giá và cấp biên nhận K80'
                : 'Standard 6-step intake: customer identification, 8-point QC check, estimate, and thermal receipt'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          {language === 'vi' ? `Bước ${currentStep} / 6` : `Step ${currentStep} of 6`}
        </div>
      </div>

      {/* Interactive Progress Bar */}
      <div className="p-6 rounded-3xl bg-card border border-border/40 neu-raised overflow-x-auto">
        <div className="flex items-center justify-between relative min-w-[580px]">
          {/* Background Connector Bar */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-border/40 z-0">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isClickable = isCompleted && currentStep < 6;

            return (
              <div
                key={step.id}
                onClick={() => isClickable && handleStepClick(step.id)}
                className={`relative z-10 flex flex-col items-center gap-2 select-none ${
                  isClickable ? 'cursor-pointer group' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/20 scale-105'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm group-hover:scale-110'
                      : 'bg-card border-2 border-border/60 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span
                  className={`text-[11px] font-semibold text-center whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : isCompleted
                      ? 'text-foreground group-hover:text-indigo-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {language === 'vi' ? step.nameVi : step.nameEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Step Card */}
      <Card className="p-6 md:p-8 min-h-[440px] bg-card border border-border/40 neu-raised rounded-3xl">
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
          <ReceiptStep
            state={intakeState}
            onReset={handleReset}
          />
        )}
      </Card>
    </div>
  );
};
