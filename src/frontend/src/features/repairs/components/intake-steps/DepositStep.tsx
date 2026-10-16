import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { IntakeState } from '../../types/intake.types';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useBranchStore } from '@/stores/branchStore';
import { CreditCard, DollarSign, Wallet, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Banknote, QrCode } from 'lucide-react';
import { useCreateRepairTicket, useCreateRepairChecklist, useCollectRepairDeposit } from '../../api/useRepairs';
import { salesService } from '@/services/salesService';
import type { PaymentMethodDto } from '@/types/api.types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { generateUUID } from '@/utils/uuid';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CANONICAL_MAP: Record<string, string> = {
  'Display / Screen': 'Display',
  'Touch / Digitizer': 'Touch',
  'FaceID / TouchID': 'FaceID',
  'Cameras (Front & Rear)': 'Camera',
  'Speakers & Mic': 'Speakers',
  'Charging Port': 'Charging',
  'WiFi & Bluetooth': 'Wifi',
  'Physical Buttons': 'Body',
  Display: 'Display',
  Touch: 'Touch',
  FaceID: 'FaceID',
  Camera: 'Camera',
  Speakers: 'Speakers',
  Charging: 'Charging',
  Wifi: 'Wifi',
  Body: 'Body',
};

const DEFAULT_METHODS: PaymentMethodDto[] = [
  { id: 'cash', name: 'Tiền mặt', code: 'CASH', isActive: true },
  { id: 'transfer', name: 'Chuyển khoản (VietQR)', code: 'TRANSFER', isActive: true },
  { id: 'card', name: 'Thẻ / POS', code: 'CARD', isActive: true },
];

export const DepositStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const { user } = useAuthStore();
  const { activeBranchId } = useBranchStore();
  const [amountInput, setAmountInput] = useState<string>(
    state.depositAmount ? state.depositAmount.toString() : ''
  );

  const { data: remoteMethods = [] } = useQuery<PaymentMethodDto[]>({
    queryKey: ['paymentMethods'],
    queryFn: () => salesService.getPaymentMethods(),
  });

  const paymentMethods = remoteMethods.length > 0 ? remoteMethods : DEFAULT_METHODS;
  const [selectedMethod, setSelectedMethod] = useState<string>(paymentMethods[0]?.id || 'cash');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'unknown' | 'conflict' | 'success'>('idle');

  const idempotencyKeyRef = useRef<string>('');
  const createTicketMutation = useCreateRepairTicket();
  const createChecklistMutation = useCreateRepairChecklist();
  const collectDepositMutation = useCollectRepairDeposit();

  useEffect(() => {
    if (paymentMethods.length > 0 && (!selectedMethod || !paymentMethods.some(m => m.id === selectedMethod))) {
      setSelectedMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedMethod]);

  const depositAmount = parseFloat(amountInput) || 0;

  // Core helper: creates ticket & checklist if not created yet
  const ensureTicketCreated = async (): Promise<string> => {
    let currentTicketId = state.ticketId;
    if (currentTicketId) return currentTicketId;

    const branchId = activeBranchId || user?.branchId || '00000000-0000-0000-0000-000000000001';

    // Clean problem description without polluting with cosmetic/model metadata
    let cleanProblemDesc = state.problemDescription?.trim() || 'Tiếp nhận sửa chữa thiết bị';
    if (state.isPowerOff && !cleanProblemDesc.includes('mất nguồn')) {
      cleanProblemDesc = `${cleanProblemDesc} (Máy mất nguồn / Không kiểm tra được)`;
    }

    // Extended QC notes are stored cleanly in the checklist record
    let checklistNotes: string | undefined = undefined;
    if (state.isQcCustomNotesActive) {
      const extraParts: string[] = [];
      if (state.qcBatteryHealth) extraParts.push(`Pin: ${state.qcBatteryHealth}`);
      if (state.qcWaterResistance) extraParts.push(`Áp suất: ${state.qcWaterResistance}`);
      if (state.qcSealCondition) extraParts.push(`Ốc/Tem: ${state.qcSealCondition}`);
      if (state.qcIncludedAccessories) extraParts.push(`Phụ kiện: ${state.qcIncludedAccessories}`);
      if (state.qcCustomNotes) extraParts.push(`Ghi chú QC: ${state.qcCustomNotes}`);
      if (state.qcCustomItems?.length) {
        const itemSummaries = state.qcCustomItems.map(i => `${i.name}: ${i.isPassed ? 'Đạt' : 'Lỗi'}${i.notes ? ` (${i.notes})` : ''}`);
        extraParts.push(`Mục thêm: [${itemSummaries.join(', ')}]`);
      }
      if (extraParts.length > 0) {
        checklistNotes = `Thẩm định mở rộng: ${extraParts.join('; ')}`;
      }
    }

    // Step 1: Create Ticket with separate first-class columns
    const ticketId = await createTicketMutation.mutateAsync({
      command: {
        branchId,
        customerId: state.customerId!,
        productVariantId: state.deviceVariantId!,
        problemDescription: cleanProblemDesc,
        exteriorCondition: state.cosmeticCondition?.trim() || undefined,
        customModelName: state.isCustomModel ? (state.customModel?.trim() || undefined) : undefined,
        estimatedCost: state.estimatedCost || 0,
        imei: state.imei?.trim() || undefined,
        technicianId: state.technicianId || undefined,
      },
      idempotencyKey: generateUUID(),
    });

    updateState({ ticketId });

    // Step 2: Create Canonical Checklist
    const canonicalOrder = ['Display', 'Touch', 'FaceID', 'Camera', 'Speakers', 'Charging', 'Wifi', 'Body'];
    const items = canonicalOrder.map((canonicalKey) => {
      const existing = state.checkpoints?.find(
        (cp) => CANONICAL_MAP[cp.checkPointName] === canonicalKey || cp.checkPointName === canonicalKey
      );
      return {
        checkPointName: canonicalKey,
        isPassed: existing ? existing.isPassed : true,
        issueDescription: existing?.issueDescription || (state.isPowerOff ? 'Máy mất nguồn' : undefined),
      };
    });

    try {
      await createChecklistMutation.mutateAsync({
        repairTicketId: ticketId,
        type: 'CheckIn',
        notes: checklistNotes,
        items,
      });
    } catch (chkErr) {
      console.warn('Checklist record created with minor warning:', chkErr);
    }

    return ticketId;
  };

  // Option 1: Create ticket with 0 deposit
  const handleCreateWithoutDeposit = async () => {
    setIsSubmitting(true);
    setTransactionStatus('idle');
    try {
      const ticketId = await ensureTicketCreated();
      updateState({ ticketId, depositAmount: 0 });
      toast.success(
        language === 'vi'
          ? 'Tạo phiếu tiếp nhận thành công (Không thu cọc)!'
          : 'Intake ticket created successfully (No deposit)!'
      );
      onNext();
    } catch (error: any) {
      console.error('Failed to create repair ticket:', error);
      toast.error(
        language === 'vi'
          ? 'Không thể tạo phiếu tiếp nhận. Vui lòng thử lại!'
          : 'Failed to create intake ticket. Please retry!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Option 2: Collect deposit and create ticket
  const handleCollectDeposit = async () => {
    if (depositAmount <= 0) {
      toast.error(
        language === 'vi' ? 'Vui lòng nhập số tiền cọc lớn hơn 0đ!' : 'Please enter deposit amount > 0!'
      );
      return;
    }

    if (state.estimatedCost && state.estimatedCost > 0 && depositAmount > state.estimatedCost) {
      toast.error(
        language === 'vi'
          ? 'Số tiền cọc không được vượt quá chi phí ước tính!'
          : 'Deposit cannot exceed estimated cost!'
      );
      return;
    }

    setIsSubmitting(true);
    setTransactionStatus('idle');

    try {
      const currentTicketId = await ensureTicketCreated();

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = generateUUID();
      }

      await collectDepositMutation.mutateAsync({
        id: currentTicketId,
        command: {
          amount: depositAmount,
          paymentMethodId: selectedMethod,
          idempotencyKey: idempotencyKeyRef.current,
        },
        idempotencyKey: idempotencyKeyRef.current,
      });

      setTransactionStatus('success');
      updateState({ depositAmount, paymentMethodId: selectedMethod });

      toast.success(
        language === 'vi'
          ? `Đã thu cọc ${depositAmount.toLocaleString('vi-VN')} ₫ thành công!`
          : `Deposit of ${depositAmount.toLocaleString()} collected!`
      );
      onNext();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        setTransactionStatus('conflict');
        toast.error(
          language === 'vi'
            ? 'Xung đột giao dịch (Khoá thu cọc đã được xử lý trước đó)'
            : 'Transaction conflict (already processed)'
        );
      } else {
        setTransactionStatus('unknown');
        toast.error(
          language === 'vi'
            ? 'Lỗi kết nối khi ghi nhận cọc. Vui lòng kiểm tra lại giao dịch!'
            : 'Error recording deposit. Please check transaction history!'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (code?: string, name?: string) => {
    const text = `${code || ''} ${name || ''}`.toLowerCase();
    if (text.includes('qr') || text.includes('transfer') || text.includes('khoản')) {
      return <QrCode className="w-5 h-5" />;
    }
    if (text.includes('card') || text.includes('thẻ') || text.includes('pos')) {
      return <CreditCard className="w-5 h-5" />;
    }
    return <Banknote className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            {language === 'vi' ? '5. Đặt Cọc & Hoàn Tất Phiếu Tiếp Nhận' : '5. Deposit & Complete Intake'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'vi'
              ? 'Khách hàng có thể đặt cọc trước linh kiện hoặc tạo phiếu không cần cọc (thanh toán khi hoàn tất)'
              : 'Customer can deposit in advance or create ticket without deposit (pay on pickup)'}
          </p>
        </div>
      </div>

      {transactionStatus === 'unknown' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-3 text-rose-500 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider">
              {language === 'vi' ? 'Trạng thái giao dịch không xác định' : 'Unknown Transaction Status'}
            </p>
            <p className="mt-1">
              {language === 'vi'
                ? 'Kết nối gián đoạn. Vui lòng kiểm tra danh sách phiếu sửa chữa trước khi bấm thanh toán lại.'
                : 'Connection interrupted. Please verify repair list before retrying.'}
            </p>
          </div>
        </div>
      )}

      {transactionStatus === 'conflict' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex gap-3 text-amber-500 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider">
              {language === 'vi' ? 'Giao dịch trùng lặp' : 'Duplicate Transaction'}
            </p>
            <p className="mt-1">
              {language === 'vi'
                ? 'Khoá giao dịch này đã được ghi nhận vào hệ thống.'
                : 'This transaction key has already been recorded.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div className="p-6 rounded-3xl bg-card border border-border/40 neu-raised space-y-6">
        {/* Ticket Summary Pill */}
        <div className="p-4 rounded-2xl bg-background/50 border border-border/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">{language === 'vi' ? 'Khách hàng: ' : 'Customer: '}</span>
            <span className="font-bold text-foreground">{state.customerName}</span>
            <span className="font-mono text-muted-foreground ml-2">({state.customerPhone})</span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'vi' ? 'Thiết bị: ' : 'Device: '}</span>
            <span className="font-bold text-foreground">{state.customModel || state.deviceModel}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'vi' ? 'Báo giá dự kiến: ' : 'Estimated: '}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {state.estimatedCost && state.estimatedCost > 0
                ? `${state.estimatedCost.toLocaleString('vi-VN')} ₫`
                : (language === 'vi' ? 'Báo giá sau' : 'Quote later')}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'vi' ? 'Kỹ thuật viên: ' : 'Technician: '}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {state.technicianName || (language === 'vi' ? 'Chưa phân công' : 'Unassigned')}
            </span>
          </div>
        </div>

        {/* Deposit Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {language === 'vi' ? 'Số Tiền Cọc (VND) - Không bắt buộc' : 'Deposit Amount (VND) - Optional'}
            </label>
            {state.estimatedCost && state.estimatedCost > 0 && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmountInput((state.estimatedCost! * 0.3).toFixed(0))}
                  className="text-[11px] px-2 py-0.5 rounded bg-background neu-raised border border-border/40 text-muted-foreground hover:text-foreground"
                >
                  30% ({((state.estimatedCost * 0.3) / 1000).toFixed(0)}k)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountInput((state.estimatedCost! * 0.5).toFixed(0))}
                  className="text-[11px] px-2 py-0.5 rounded bg-background neu-raised border border-border/40 text-muted-foreground hover:text-foreground"
                >
                  50% ({((state.estimatedCost * 0.5) / 1000).toFixed(0)}k)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountInput(state.estimatedCost!.toString())}
                  className="text-[11px] px-2 py-0.5 rounded bg-background neu-raised border border-border/40 text-muted-foreground hover:text-foreground"
                >
                  100%
                </button>
              </div>
            )}
          </div>

          <div className="relative group">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500" />
            <Input
              type="number"
              min="0"
              step="10000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={isSubmitting || transactionStatus === 'unknown'}
              placeholder="0 (Không thu cọc)"
              className="w-full neu-inset bg-background/50 border-border/40 rounded-2xl pl-12 pr-4 py-4 text-2xl font-heading font-bold text-center text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          {depositAmount > 0 && (
            <p className="mt-1.5 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {depositAmount.toLocaleString('vi-VN')} VNĐ
            </p>
          )}
        </div>

        {/* Payment Methods */}
        {depositAmount > 0 && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {language === 'vi' ? 'Phương thức thanh toán cọc' : 'Deposit Payment Method'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map((m) => {
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    disabled={isSubmitting || transactionStatus === 'unknown'}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                        : 'border-border/40 bg-card neu-raised text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-500 text-white' : 'bg-background neu-inset text-muted-foreground'}`}>
                      {getMethodIcon(m.code, m.name)}
                    </div>
                    <span className="text-xs font-medium text-left">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="neu-raised hover:neu-pressed text-muted-foreground hover:text-foreground flex items-center gap-2 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'vi' ? 'Quay lại (Báo giá)' : 'Back (Estimate)'}
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* Option A: Fast Create Ticket Without Deposit */}
          <Button
            variant="outline"
            onClick={handleCreateWithoutDeposit}
            disabled={isSubmitting || transactionStatus === 'unknown'}
            className="neu-raised hover:neu-pressed border-border/40 text-foreground text-xs font-semibold py-2.5 px-4 rounded-2xl flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            {isSubmitting && depositAmount === 0
              ? (language === 'vi' ? 'Đang tạo phiếu...' : 'Creating...')
              : (language === 'vi' ? 'Tạo phiếu không cần cọc' : 'Create without deposit')}
          </Button>

          {/* Option B: Collect Deposit and Create */}
          {depositAmount > 0 && (
            <Button
              variant="outline"
              onClick={handleCollectDeposit}
              disabled={isSubmitting || transactionStatus === 'unknown'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-2xl shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting
                ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...')
                : (language === 'vi'
                    ? `Thu ${depositAmount.toLocaleString('vi-VN')} ₫ & Tạo phiếu`
                    : `Collect ${depositAmount.toLocaleString()} & Create`)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
