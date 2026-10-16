import React, { useRef } from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useBranchStore } from '@/stores/branchStore';
import { useSystemStore } from '@/stores/systemStore';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';

export interface RepairReceiptTicketViewModel {
  ticketCode?: string;
  code?: string;
  totalAmount?: number;
  totalCost?: number;
  laborCost?: number;
  estimatedCost?: number;
  actualCost?: number;
  deposits?: Array<{ amount?: number }>;
  depositAmount?: number;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
  deviceModel?: string;
  customModelName?: string;
  productName?: string;
  imei?: string;
  serialImei?: string;
  problemDescription?: string;
}

interface RepairK80ReceiptModalProps {
  ticket: RepairReceiptTicketViewModel;
  onClose: () => void;
}

export const RepairK80ReceiptModal: React.FC<RepairK80ReceiptModalProps> = ({ ticket, onClose }) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const { activeBranchName, activeBranchAddress, activeBranchPhone } = useBranchStore();
  const { settings } = useSystemStore();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Use a clean hidden iframe to print without corrupting React DOM or reloading the page
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${ticket.ticketCode || ticket.code || 'Repair Receipt'}</title>
          <style>
            @page { size: 80mm auto; margin: 3mm; }
            body { 
              font-family: 'Courier New', Courier, monospace, sans-serif; 
              width: 74mm; 
              margin: 0 auto; 
              padding: 4px;
              color: #000; 
              font-size: 11px; 
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-dashed { border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
            .border-t-dashed { border-top: 1px dashed #000; }
            .my-2 { margin-top: 6px; margin-bottom: 6px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 250);
  };

  const codeDisplay = ticket.ticketCode || ticket.code || 'REP-888888';
  const total = ticket.actualCost || ticket.totalAmount || ticket.totalCost || ticket.estimatedCost || ticket.laborCost || 0;
  const deposit = ticket.depositAmount ?? (ticket.deposits || []).reduce((acc, d) => acc + (d.amount || 0), 0);
  const remaining = Math.max(0, total - deposit);
  const deviceName = ticket.customModelName 
    ? `${ticket.deviceModel || ticket.productName || 'Thiết bị'} (${ticket.customModelName})`
    : ticket.deviceModel || ticket.productName || 'Thiết bị di động';

  const storeName = activeBranchName || settings.systemName || 'TECHCELL SERVICE CENTER';
  const storeAddr = activeBranchAddress || settings.storeAddress || 'Chi nhánh dịch vụ sửa chữa';
  const storePhone = activeBranchPhone || settings.storePhone || '1900 8888';

  return (
    <Dialog 
      open 
      onOpenChange={onClose} 
      title={isVi ? 'Biên Nhận Tiếp Nhận Sửa Chữa (K80)' : 'Repair Intake Receipt (K80)'}
    >
      <div className="py-2 space-y-4">
        <div className="p-4 flex justify-center bg-muted/40 rounded-2xl max-h-[60vh] overflow-y-auto">
          {/* Printable K80 Template */}
          <div ref={printRef} className="w-[74mm] bg-white text-black p-4 text-xs font-mono leading-tight rounded-xl shadow-lg border border-slate-300">
            <div className="text-center mb-3">
              <h1 className="font-bold text-base uppercase tracking-tight">{storeName}</h1>
              <p className="text-[10px] text-gray-700">{storeAddr}</p>
              <p className="text-[10px] text-gray-700">Hotline: {storePhone}</p>
            </div>
            
            <div className="text-center font-bold text-sm uppercase my-2 py-1.5 border-dashed">
              {isVi ? 'PHIẾU TIẾP NHẬN SỬA CHỮA' : 'REPAIR INTAKE RECEIPT'}
            </div>

            <div className="mb-3 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Mã Phiếu:</span>
                <span className="font-bold">{codeDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày nhận:</span>
                <span>{new Date(ticket.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-bold">{ticket.customerName || 'Khách vãng lai'}</span>
              </div>
              {ticket.customerPhone && (
                <div className="flex justify-between">
                  <span>SĐT:</span>
                  <span>{ticket.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="border-t-dashed pt-2 mb-3 space-y-1 text-[11px]">
              <div>
                <span className="font-bold">Thiết bị:</span> {deviceName}
              </div>
              {(ticket.imei || ticket.serialImei) && (
                <div>
                  <span className="font-bold">IMEI/SN:</span> {ticket.imei || ticket.serialImei}
                </div>
              )}
              {ticket.problemDescription && (
                <div>
                  <span className="font-bold">Tình trạng:</span> {ticket.problemDescription}
                </div>
              )}
            </div>

            <div className="border-t-dashed pt-2 mb-3 space-y-1">
              <div className="flex justify-between font-bold text-xs">
                <span>{ticket.actualCost ? 'Tổng Chi Phí:' : 'Chi Phí Dự Kiến:'}</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {deposit > 0 && (
                <>
                  <div className="flex justify-between text-[11px] text-gray-700">
                    <span>Đã đặt cọc:</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(deposit)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Còn lại khi nhận máy:</span>
                    <span>{formatCurrency(remaining)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-[10px] mt-4 pt-2 border-t-dashed text-gray-600 italic space-y-0.5">
              <p>Quý khách vui lòng giữ phiếu để đối chiếu khi nhận máy.</p>
              <p>Cảm ơn quý khách đã tin tưởng dịch vụ!</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
          <Button type="button" variant="secondary" onClick={onClose} className="neu-raised">
            {isVi ? 'Đóng' : 'Close'}
          </Button>
          <Button type="button" variant="primary" onClick={handlePrint} className="shadow-md">
            <Printer className="w-4 h-4 mr-1.5" />
            {isVi ? 'In Phiếu K80' : 'Print K80'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
