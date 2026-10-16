import React from 'react';
import { BookOpen, DollarSign, Clock, ShieldAlert, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { SupplierDto, SupplierDebtTransactionDto } from '../types/supplier.types';
import { useSupplierLedger } from '../hooks/useSuppliers';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';

interface SupplierDebtLedgerModalProps {
  supplier: SupplierDto;
  onClose: () => void;
  onPayClick: () => void;
}

export const SupplierDebtLedgerModal: React.FC<SupplierDebtLedgerModalProps> = ({
  supplier,
  onClose,
  onPayClick
}) => {
  const { data: ledger = [], isLoading } = useSupplierLedger(supplier.id);

  const totalCreditLimit = supplier.creditLimit || 500000000;
  const isOverLimit = supplier.debtAmount > totalCreditLimit;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()} title="Sổ Chi Tiết Công Nợ Phải Trả (AP Ledger)" className="max-w-5xl">
      <div className="py-4 space-y-4">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Dư Nợ Hiện Tại</span>
              <span className="text-lg font-bold text-destructive">
                {(supplier.debtAmount ?? 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Hạn Mức Nợ Cho Phép</span>
              <span className="text-lg font-bold text-emerald-500">
                {(totalCreditLimit ?? 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Kỳ Hạn Nợ (Credit Term)</span>
              <span className="text-lg font-bold text-cyan-500">
                {supplier.paymentTermsDays || 30} Ngày
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onPayClick();
              }}
            >
              Trả Nợ
            </Button>
          </div>
        </div>

        {/* Overdue / Limit Alert Banner */}
        {isOverLimit && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Cảnh báo AP: Nhà cung cấp này đang vượt hạn mức nợ ({(supplier.debtAmount ?? 0).toLocaleString('vi-VN')} đ &gt; {(totalCreditLimit ?? 0).toLocaleString('vi-VN')} đ). Hãy ưu tiên thanh toán trước khi lên phiếu nhập kho mới.
            </span>
          </div>
        )}

        {/* Ledger Table */}
        <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground font-medium uppercase tracking-wider">
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Loại Giao Dịch</th>
                <th className="py-3 px-4">Mã Chứng Từ</th>
                <th className="py-3 px-4 text-right">Số Tiền Phát Sinh</th>
                <th className="py-3 px-4 text-right">Dư Nợ Lũy Kế</th>
                <th className="py-3 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y text-foreground">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Đang tải sổ giao dịch công nợ...
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chưa có lịch sử phát sinh công nợ cho Nhà cung cấp này.
                  </td>
                </tr>
              ) : (
                ledger.map((item: SupplierDebtTransactionDto) => {
                  const isInvoice = item.transactionType === 'INVOICE';
                  const isPayment = item.transactionType === 'PAYMENT';
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isInvoice ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            <ArrowUpRight className="w-3 h-3" /> Nhập Hàng (+Nợ)
                          </span>
                        ) : isPayment ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <ArrowDownLeft className="w-3 h-3" /> Thanh Toán (-Nợ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                            <ArrowDownLeft className="w-3 h-3" /> Trả Hàng Lỗi (-Nợ)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {item.referenceNo}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${isInvoice ? 'text-destructive' : 'text-emerald-600'}`}>
                        {isInvoice ? '+' : '-'}{(item.amount ?? 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {(item.balanceAfter ?? 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={item.note || ''}>
                        {item.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
        <span className="text-xs text-muted-foreground">
          Hệ thống tự động đồng bộ sổ công nợ AP khi hoàn tất phiếu nhập hoặc lập phiếu chi.
        </span>
        <Button variant="outline" onClick={onClose}>Đóng</Button>
      </div>
    </Dialog>
  );
};
