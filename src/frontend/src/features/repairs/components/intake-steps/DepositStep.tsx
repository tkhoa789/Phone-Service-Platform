import React, { useState, useEffect, useRef } from 'react';
import type { IntakeState } from '../../pages/RepairIntakePage';
import { useThemeStore } from '@/stores/themeStore';
import { CreditCard, DollarSign, Wallet, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { serviceService } from '@/services/serviceService';
import { useCreateRepairTicket, useCreateRepairChecklist, useCollectRepairDeposit, useDeleteRepairTicket } from '../../api/useRepairs';
import { salesService } from '@/services/salesService';
import type { PaymentMethodDto } from '@/types/api.types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DepositStep: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const { language } = useThemeStore();
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'unknown' | 'conflict' | 'success'>('idle');
  
  // Store the idempotency key so we don't regenerate it across renders if it failed
  const idempotencyKeyRef = useRef<string>('');
  const createTicketMutation = useCreateRepairTicket();
  const createChecklistMutation = useCreateRepairChecklist();
  const collectDepositMutation = useCollectRepairDeposit();
  const deleteTicketMutation = useDeleteRepairTicket();

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const methods = await salesService.getPaymentMethods();
        setPaymentMethods(methods);
        if (methods.length > 0) {
          setSelectedMethod(methods[0].id);
        }
      } catch {
        toast.error('Failed to load payment methods');
      }
    };
    fetchMethods();
  }, []);

  const handleCollectDeposit = async () => {
    const amount = parseFloat(amountInput) || 0;
    if (amount <= 0) {
      toast.error(language === 'vi' ? 'Vui l�ng nh?p s? ti?n h?p l?' : 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setTransactionStatus('idle');

    try {
      let currentTicketId = state.ticketId;
      
              // Step 1: Create Ticket if not exists
        if (!currentTicketId) {
          const createTicketIdempotency = crypto.randomUUID();
          currentTicketId = await createTicketMutation.mutateAsync({
            command: {
            branchId: '00000000-0000-0000-0000-000000000001',
            customerId: state.customerId!,
            productVariantId: state.deviceVariantId!,
            problemDescription: state.problemDescription!,
            estimatedCost: state.estimatedCost,
            imei: state.imei
          },
            idempotencyKey: createTicketIdempotency
          });
        
        updateState({ ticketId: currentTicketId });

        // Submit Checklist
        if (state.checkpoints && state.checkpoints.length > 0) {
          await createChecklistMutation.mutateAsync({
            repairTicketId: currentTicketId,
            type: 'CheckIn',
            items: state.checkpoints.map(cp => ({
              checkPointName: cp.checkPointName,
              isPassed: cp.isPassed,
              issueDescription: cp.issueDescription
            }))
          });
        }
      }

      // Step 2: Generate Idempotency Key
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }

                      // Step 3: Collect Deposit
        await collectDepositMutation.mutateAsync({
          id: currentTicketId,
          command: {
          amount,
          paymentMethodId: selectedMethod,
          idempotencyKey: idempotencyKeyRef.current
        },
          idempotencyKey: idempotencyKeyRef.current
        });

      setTransactionStatus('success');
      updateState({ depositAmount: amount });
      
      toast.success(language === 'vi' ? 'Thu c?c th�nh c�ng' : 'Deposit collected');
      onNext();
      
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 409) {
        setTransactionStatus('conflict');
        toast.error(
          language === 'vi' 
            ? 'Xung d?t giao d?ch (C?c n�y c� th? d� du?c ghi nh?n ho?c sai payload)' 
            : 'Transaction conflict (already processed or payload mismatch)'
        );
      } else {
        // Timeout, Network Error, 500, etc.
        setTransactionStatus('unknown');
        toast.error(
          language === 'vi'
            ? 'L?i m?ng ho?c server. Kh�ng x�c d?nh du?c tr?ng th�i giao d?ch!'
            : 'Network or server error. Unknown transaction status!'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelTicket = async () => {
    if (!state.ticketId) {
      onBack();
      return;
    }
    
    // Rollback semantics
    try {
      setIsSubmitting(true);
      await deleteTicketMutation.mutateAsync(state.ticketId);
      updateState({ ticketId: undefined });
      toast.success(language === 'vi' ? '�� h?y phi?u s?a ch?a t?m' : 'Temporary ticket cancelled');
      onBack();
    } catch {
      toast.error(language === 'vi' ? 'Kh�ng th? h?y phi?u t?m, h�y b�o admin' : 'Cannot cancel temporary ticket, contact admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-slate-900">
            {language === 'vi' ? '5. Thu Ti?n C?c' : '5. Deposit Collection'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'vi' ? 'Luu �: M?i giao d?ch d?u du?c t?o kh�a ch?ng tr�ng l?p' : 'Notice: All transactions use idempotency keys'}
          </p>
        </div>
      </div>

      {transactionStatus === 'unknown' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex gap-3 text-rose-500">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">?? {language === 'vi' ? 'TR?NG TH�I KH�NG X�C �?NH' : 'UNKNOWN STATUS'}</p>
            <p className="mt-1">
              {language === 'vi' 
                ? 'Giao d?ch b? gi�n do?n k?t n?i. KH�NG �U?C B?M THU TI?N L?N N?A. H�y ki?m tra l?i l?ch s? thu c?c trong h? th?ng tru?c khi ti?p t?c.' 
                : 'Connection interrupted. DO NOT RETRY. Check the deposit history before proceeding.'}
            </p>
          </div>
        </div>
      )}

      {transactionStatus === 'conflict' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-3 text-amber-500">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">?? {language === 'vi' ? 'GIAO D?CH TR�NG L?P / XUNG �?T' : 'TRANSACTION CONFLICT'}</p>
            <p className="mt-1">
              {language === 'vi' 
                ? 'H? th?ng t? ch?i do kh�a giao d?ch d� t?n t?i ho?c c� s?a d?i n?i dung. H�y F5 ho?c ki?m tra DB.' 
                : 'System rejected the transaction due to existing key or payload mutation.'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
            {language === 'vi' ? 'S? Ti?n C?c (VND)' : 'Deposit Amount'}
          </label>
          <div className="relative group">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 transition-transform group-focus-within:scale-110" />
            <Input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={isSubmitting || transactionStatus === 'unknown'}
              placeholder="0"
              className="w-full bg-white border-2 border-slate-300/40 rounded-2xl pl-12 pr-4 py-4 text-3xl font-heading font-bold text-center text-slate-900 shadow-sm focus:shadow-inner focus:outline-none focus:border-indigo-500/50 transition-all appearance-none disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
            {language === 'vi' ? 'Phuong Th?c Thanh To�n' : 'Payment Method'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {paymentMethods.map(m => (
              <Button variant="outline"
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                disabled={isSubmitting || transactionStatus === 'unknown'}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all disabled:opacity-50 ${
                  selectedMethod === m.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-inner'
                    : 'border-slate-200/20 bg-white text-slate-500 shadow-sm hover:shadow-none'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">{m.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/20">
        <Button variant="outline"
          onClick={cancelTicket}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-2xl bg-white text-rose-500 hover:bg-rose-500/10 font-medium text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          {language === 'vi' ? 'H?y / Tr? l?i' : 'Cancel / Back'}
        </Button>
        <Button variant="outline"
          onClick={handleCollectDeposit}
          disabled={isSubmitting || transactionStatus === 'unknown' || !amountInput}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? (language === 'vi' ? '�ang x? l�...' : 'Processing...') : (language === 'vi' ? 'X�c Nh?n Thu Ti?n' : 'Confirm Payment')}
        </Button>
      </div>
    </div>
  );
};


