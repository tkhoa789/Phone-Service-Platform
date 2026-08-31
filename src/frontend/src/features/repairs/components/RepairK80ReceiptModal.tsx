import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface RepairK80ReceiptModalProps {
  ticket: any;
  onClose: () => void;
}

export const RepairK80ReceiptModal: React.FC<RepairK80ReceiptModalProps> = ({ ticket, onClose }) => {
  const { language } = useThemeStore();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload();
  };

  const codeDisplay = ticket.ticketCode || ticket.code || 'REP-888888';
  const total = ticket.totalAmount || ticket.totalCost || ticket.laborCost || 0;

  return (
    <Dialog open onOpenChange={onClose} title={language === 'vi' ? 'In Biên Nhận K80' : 'Print K80 Receipt'}>


        <div className="py-4 flex justify-center bg-slate-100 rounded-lg max-h-[60vh] overflow-y-auto">
          <div ref={printRef} className="w-[80mm] bg-white p-4 text-black text-sm font-mono leading-tight">
            <div className="text-center mb-4">
              <h1 className="font-bold text-xl uppercase">TECHCELL POS</h1>
              <p className="text-xs">123 Nguyen Van Linh, Q7, TP.HCM</p>
              <p className="text-xs">Tel: 1900 8888</p>
            </div>
            
            <div className="text-center font-bold text-lg uppercase mb-2 border-y border-dashed border-black py-2">
              {language === 'vi' ? 'Phiếu Tiếp Nhận' : 'Repair Receipt'}
            </div>

            <div className="mb-4 space-y-1">
              <p>Mã Hóa Đơn: {codeDisplay}</p>
              <p>Ngày: {new Date(ticket.createdAt || Date.now()).toLocaleString()}</p>
              <p>Khách hàng: {ticket.customerName}</p>
              <p>SĐT: {ticket.customerPhone}</p>
            </div>

            <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1">
              <p className="font-bold">Thiết bị: {ticket.deviceModel || ticket.productName}</p>
              <p>IMEI/SN: {ticket.imei || ticket.serialImei}</p>
              <p>Tình trạng: {ticket.problemDescription}</p>
            </div>

            <div className="border-t border-dashed border-black pt-2 mb-4">
              <div className="flex justify-between font-bold text-base">
                <span>Tổng Phí Dự Kiến:</span>
                <span>{total.toLocaleString()} ₫</span>
              </div>
            </div>

            <div className="text-center text-xs mt-8 italic">
              <p>Vui lòng giữ phiếu để nhận máy.</p>
              <p>Cảm ơn quý khách!</p>
            </div>
          </div>
        </div>

        
<div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">

          <Button variant="outline" onClick={onClose}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'In Hóa Đơn' : 'Print'}
          </Button>
        
</div>
</Dialog>
  );
};

