import React, { useEffect, useState } from 'react';
import type { IntakeState } from '../../pages/RepairIntakePage';
import { useThemeStore } from '@/stores/themeStore';
import { serviceService } from '@/services/serviceService';
import type { RepairTicketDto } from '@/types/api.types';
import { CheckCircle2, Printer, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface Props {
  state: IntakeState;
}

export const ReceiptStep: React.FC<Props> = ({ state }) => {
  const { language } = useThemeStore();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<RepairTicketDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!state.ticketId) return;
      try {
        const data = await serviceService.getRepairById(state.ticketId);
        setTicket(data);
      } catch {
        toast.error('Failed to fetch verified ticket data from backend');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [state.ticketId]);

  if (!state.ticketId) {
    return (
      <div className="p-8 text-center text-rose-500">
        {language === 'vi' ? 'Lỗi: Không tìm thấy ID Phiếu. Giao dịch chưa thành công.' : 'Error: No Ticket ID found. Transaction incomplete.'}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
        <p>{language === 'vi' ? 'Đang xác minh giao dịch từ máy chủ...' : 'Verifying transaction from server...'}</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center text-rose-500">
        {language === 'vi' ? 'Không thể tải biên nhận' : 'Could not load receipt'}
      </div>
    );
  }

  // Find the successful deposit we just created
  const deposit = ticket.deposits && ticket.deposits.length > 0 
    ? ticket.deposits[ticket.deposits.length - 1] 
    : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {language === 'vi' ? 'Thu Cọc Thành Công!' : 'Deposit Successful!'}
          </h2>
          <p className="text-slate-500 mt-1">
            {language === 'vi' ? 'Phiếu tiếp nhận và giao dịch đã được xác nhận' : 'Intake ticket and transaction confirmed'}
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-sm space-y-6 print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start border-b border-slate-200/20 pb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Mã Phiếu Sửa Chữa' : 'Ticket Code'}</p>
            <p className="font-mono font-bold text-lg text-[#10b981]">{ticket.code || ticket.ticketCode}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Ngày Tiếp Nhận' : 'Received Date'}</p>
            <p className="font-medium text-slate-900">{new Date(ticket.receivedDate).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-slate-200/20 pb-4">
          <div>
            <p className="text-xs text-slate-500">{language === 'vi' ? 'Khách Hàng' : 'Customer'}</p>
            <p className="font-medium text-slate-900">{ticket.customerName}</p>
            <p className="text-xs text-slate-400">{ticket.customerPhone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{language === 'vi' ? 'Thiết Bị' : 'Device'}</p>
            <p className="font-medium text-slate-900">{ticket.productName}</p>
            <p className="text-xs text-slate-400">IMEI/Serial: {ticket.imei || 'N/A'}</p>
          </div>
        </div>

        <div className="border-b border-slate-200/20 pb-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">{language === 'vi' ? 'Chi phí dự kiến' : 'Estimated Cost'}</span>
            <span className="font-medium text-slate-900">
              {ticket.estimatedCost?.toLocaleString()} ₫
            </span>
          </div>
          {deposit && (
            <div className="flex justify-between items-center bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
              <div>
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  {language === 'vi' ? 'Đã Thu Cọc' : 'Deposit Paid'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {deposit.paymentMethodName} • {new Date(deposit.paidAt).toLocaleTimeString()}
                </p>
                {deposit.transactionCode && (
                  <p className="text-[11px] font-mono text-slate-400">Ref: {deposit.transactionCode}</p>
                )}
              </div>
              <span className="font-bold text-xl text-emerald-500">
                {deposit.amount.toLocaleString()} ₫
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 print:hidden">
        <Button variant="outline"
          onClick={() => window.print()}
          className="px-6 py-3 rounded-2xl bg-white text-slate-500 hover:text-slate-900 font-medium text-sm shadow-sm hover:shadow-sm transition-all flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          {language === 'vi' ? 'In Biên Nhận' : 'Print Receipt'}
        </Button>
        <Button variant="outline"
          onClick={() => navigate('/repairs')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          {language === 'vi' ? 'Về Danh Sách' : 'Back to List'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};


