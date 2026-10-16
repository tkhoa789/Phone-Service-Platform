import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, CreditCard } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { usePaySupplierDebt } from '../hooks/useSuppliers';
import type { SupplierDto, PaySupplierDebtCommand } from '../types/supplier.types';

// PC-03 Components
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface SupplierPaymentModalProps {
  supplier: SupplierDto;
  onClose: () => void;
}

type PaySupplierDebtFormValues = PaySupplierDebtCommand;

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  supplier,
  onClose
}) => {
  const payMutation = usePaySupplierDebt();
  const isSubmitting = payMutation.isPending;

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch
  } = useForm<PaySupplierDebtFormValues>({
    defaultValues: {
      supplierId: supplier.id,
      amount: 0,
      paymentMethod: 'VIETQR',
      referenceNo: `PAY-${Date.now().toString().slice(-6)}`,
      note: '',
    }
  });

  const paymentMethod = watch('paymentMethod');

  const handlePayFull = () => {
    setValue('amount', supplier.debtAmount, { shouldValidate: true });
  };

  const onSubmit = async (data: PaySupplierDebtFormValues) => {
    if (supplier.debtAmount > 0 && data.amount > supplier.debtAmount) {
      setError('amount', { message: 'Số tiền thanh toán vượt quá dư nợ hiện tại.' });
      return;
    }

    try {
      await payMutation.mutateAsync({
        ...data
      });
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          const fieldKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof PaySupplierDebtFormValues;
          setError(fieldKey, {
            type: 'server',
            message: backendErrors[key][0]
          });
        });
      }
    }
  };

  const formatCurrency = (val?: number | null) => {
    return `${(val ?? 0).toLocaleString('vi-VN')} đ`;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title="Thanh Toán Công Nợ" className="max-w-lg">
      <div className="py-4 space-y-4">
        {/* Supplier Debt Summary Card */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700/70 font-medium uppercase tracking-wider mb-1">Dư nợ hiện tại</p>
            <div className="text-2xl font-bold font-mono text-amber-600">
              {formatCurrency(supplier.debtAmount)}
            </div>
            <p className="text-xs text-amber-700/50 mt-1">{supplier.name}</p>
          </div>
          {(supplier.debtAmount ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePayFull}
              className="text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
            >
              Trả Toàn Bộ
            </Button>
          )}
        </div>

        <form id="payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ControlledInput
            name="amount"
            control={control}
            type="number"
            label="Số Tiền Thanh Toán (VNĐ)"
            placeholder="Ví dụ: 10000000"
            rules={{ required: true }}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Phương Thức Thanh Toán
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <Button variant="outline"
                type="button"
                onClick={() => setValue('paymentMethod', 'VIETQR', { shouldValidate: true })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'VIETQR'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Chuyển Khoản</span>
              </Button>
              <Button variant="outline"
                type="button"
                onClick={() => setValue('paymentMethod', 'CASH', { shouldValidate: true })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-xs font-bold">Tiền Mặt</span>
              </Button>
            </div>
          </div>

          <ControlledInput
            name="referenceNo"
            control={control}
            label="Mã Giao Dịch / Tham Chiếu"
            placeholder="VD: UNC-001 hoặc Ref..."
            rules={{ required: true }}
          />

          <ControlledInput
            name="note"
            control={control}
            label="Ghi Chú"
            placeholder="Nội dung diễn giải phiếu chi..."
          />
        </form>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Hủy Bỏ
        </Button>
        <Button
          type="submit"
          form="payment-form"
          disabled={isSubmitting || supplier.debtAmount === 0}
        >
          {isSubmitting ? 'Đang Xử Lý...' : 'Ghi Nhận Thanh Toán'}
        </Button>
      </div>
    </Dialog>
  );
};
