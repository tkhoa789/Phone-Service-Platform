import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { QrCode, Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { useSystemStore } from '../../../stores/systemStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PosPaymentModalProps {
  totalAmount: number;
  customerName: string;
  onConfirmPayment: (method: 'CASH' | 'BANK_TRANSFER', cashGiven?: number) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

interface PaymentFormValues {
  cashGivenText: string;
}

export const PosPaymentModal: React.FC<PosPaymentModalProps> = ({
  totalAmount,
  customerName,
  onConfirmPayment,
  onClose,
  isSubmitting = false,
}) => {
  const { language } = useThemeStore();
  const { settings } = useSystemStore();
  const tPos = i18nDictionary[language].pos;
  const tCommon = i18nDictionary[language].common;

  const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');

  const { register, watch, setValue, handleSubmit } = useForm<PaymentFormValues>({
    defaultValues: {
      cashGivenText: '',
    },
  });

  const cashGivenText = watch('cashGivenText');
  const cashGiven = parseFloat(cashGivenText) || 0;
  const changeGiven = Math.max(0, cashGiven - totalAmount);
  const isCashEnough = cashGiven >= totalAmount;

  // VietQR Dynamic QR Code Image URL
  const vietQrUrl = `https://api.vietqr.io/image/${settings.vietQrBank || '970422'}-${settings.vietQrAccountNo || '038921104'}-compact2.png?amount=${totalAmount}&addInfo=PSP_POS_${Date.now().toString().slice(-6)}&accountName=${encodeURIComponent(settings.vietQrAccountHolder || '')}`;

  const onSubmit = async () => {
    if (method === 'CASH' && !isCashEnough) return;
    await onConfirmPayment(method, method === 'CASH' ? cashGiven : undefined);
  };

  return (
    <Dialog 
      open={true} 
      onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
      title={tPos.paymentModalTitle}
      description={language === 'vi' ? 'Khách hàng: ' + customerName : 'Customer: ' + customerName}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
        {/* Total Amount Summary */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <span className="text-sm text-emerald-700/70 font-medium">{language === 'vi' ? 'Tổng tiền cần thanh toán:' : 'Total amount due:'}</span>
          <span className="font-heading font-bold text-2xl text-emerald-600">
            {totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{tPos.paymentMethodLabel}</label>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline"
              type="button"
              onClick={() => setMethod('CASH')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                method === 'CASH'
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              <Banknote className={`w-5 h-5 ${method === 'CASH' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <div className="text-left">
                <span className={`font-bold text-sm block ${method === 'CASH' ? 'text-emerald-700' : 'text-foreground'}`}>{tPos.cashMethod}</span>
                <span className="text-[10px] text-muted-foreground">{language === 'vi' ? 'Thu ngân nhận trực tiếp' : 'Direct cash register'}</span>
              </div>
            </Button>

            <Button variant="outline"
              type="button"
              onClick={() => setMethod('BANK_TRANSFER')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                method === 'BANK_TRANSFER'
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              <QrCode className={`w-5 h-5 ${method === 'BANK_TRANSFER' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <div className="text-left">
                <span className={`font-bold text-sm block ${method === 'BANK_TRANSFER' ? 'text-emerald-700' : 'text-foreground'}`}>{tPos.transferMethod}</span>
                <span className="text-[10px] text-muted-foreground">{language === 'vi' ? 'Quét mã QR Ngân hàng' : 'Banking QR Code scan'}</span>
              </div>
            </Button>
          </div>
        </div>

        {/* CASH Method Section */}
        {method === 'CASH' && (
          <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{tPos.amountTenderedLabel}</label>
              <Input
                {...register('cashGivenText')}
                type="number"
                placeholder="0"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-bold text-emerald-600 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex flex-wrap gap-2">
              {[totalAmount, 100000, 200000, 500000, 1000000, 2000000, 5000000].map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('cashGivenText', amt.toString(), { shouldValidate: true })}
                >
                  {amt.toLocaleString('vi-VN')} đ
                </Button>
              ))}
            </div>

            {/* Change Result */}
            <div className="flex items-center justify-between border-t pt-3 mt-3 text-sm">
              <span className="text-muted-foreground font-medium">{tPos.changeDueLabel}</span>
              <span className={`font-bold text-lg ${isCashEnough ? 'text-emerald-600' : 'text-destructive'}`}>
                {changeGiven.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {!isCashEnough && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                <AlertCircle className="w-4 h-4" /> {language === 'vi' ? 'Số tiền khách đưa chưa đủ!' : 'Insufficient cash tendered!'}
              </div>
            )}
          </div>
        )}

        {/* BANK_TRANSFER Method Section (VietQR) */}
        {method === 'BANK_TRANSFER' && (
          <div className="p-4 rounded-xl border bg-muted/30 flex flex-col items-center space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{language === 'vi' ? 'Khách hàng mở app Ngân hàng (MB, Vietcombank, Techcombank...) để quét mã QR:' : 'Scan Banking QR code with mobile app:'}</p>
            <div className="bg-white p-3 rounded-xl border shadow-sm">
              <img src={vietQrUrl} alt="VietQR" className="w-48 h-48 object-contain mx-auto" />
            </div>
            <div className="text-xs text-muted-foreground">
              {language === 'vi' ? 'Chủ TK:' : 'Account Holder:'} <span className="font-bold text-foreground">{settings.vietQrAccountHolder || 'CONG TY THIET BI PSP'}</span> | STK: <span className="font-mono text-emerald-600 font-bold">{settings.vietQrAccountNo}</span> ({settings.vietQrBankName})
            </div>
          </div>
        )}

        {/* Action Confirm Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {tCommon.cancel}
          </Button>
          <Button
            type="submit"
            disabled={(method === 'CASH' && !isCashEnough) || isSubmitting}
          >
            {isSubmitting ? tCommon.loading : <><CheckCircle2 className="w-4 h-4 mr-2" /> {tPos.confirmPrintBtn}</>}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
