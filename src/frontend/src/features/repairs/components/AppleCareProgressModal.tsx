import React from 'react';
import {
  Wrench, CheckCircle2, Clock, ShieldCheck, AlertCircle
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface AppleCareProgressModalProps {
  ticket: {
    ticketCode?: string;
    code?: string;
    customerName?: string;
    customerPhone?: string;
    deviceModel?: string;
    productName?: string;
    serialImei?: string;
    imei?: string;
    status: string;
  };
  onClose: () => void;
}

export const AppleCareProgressModal: React.FC<AppleCareProgressModalProps> = ({ ticket, onClose }) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';

  const codeDisplay = ticket.ticketCode || ticket.code || 'REP-888888';
  
  const statusMap: Record<string, number> = {
    PendingAssignment: 1,
    Received: 1,
    Diagnosing: 2,
    WaitingApproval: 2,
    WaitingForParts: 2,
    Repairing: 3,
    WaitingQC: 4,
    Completed: 5,
    WaitingPickup: 5,
    Delivered: 5,
    Cancelled: -1,
  };

  const currentStep = statusMap[ticket.status] || 1;

  const steps = [
    {
      id: 1,
      title: isVi 
        ? (ticket.status === 'PendingAssignment' ? '1. Tiếp nhận & Phân công' : '1. Tiếp nhận') 
        : (ticket.status === 'PendingAssignment' ? '1. Intake & Assignment' : '1. Received'),
      desc: isVi 
        ? (ticket.status === 'PendingAssignment' ? 'Đã nhận thiết bị, đang chờ phân công kỹ thuật viên' : 'Đã nhận thiết bị và bàn giao kỹ thuật viên') 
        : 'Device received and technician assigned',
      icon: Clock,
    },
    {
      id: 2,
      title: isVi ? '2. Chuẩn đoán & Phê duyệt' : '2. Diagnostics & Approval',
      desc: isVi ? 'Kỹ thuật viên kiểm tra lỗi chuyên sâu và báo giá khách hàng' : 'Technician running diagnostics and customer approval',
      icon: ShieldCheck,
    },
    {
      id: 3,
      title: isVi ? '3. Sửa chữa & Thay thế' : '3. Repair & Replacement',
      desc: isVi ? 'Đang thực hiện sửa chữa hoặc thay thế linh kiện chính hãng' : 'Active bench repair and genuine parts replacement',
      icon: Wrench,
    },
    {
      id: 4,
      title: isVi ? '4. Kiểm định chất lượng (QC)' : '4. Quality Control (QC)',
      desc: isVi ? 'Kiểm tra độ ổn định theo tiêu chuẩn trước khi bàn giao' : 'Functional testing and stability verification',
      icon: AlertCircle,
    },
    {
      id: 5,
      title: isVi ? '5. Hoàn tất & Giao máy' : '5. Ready & Delivered',
      desc: isVi ? 'Sẵn sàng tại quầy để khách hàng kiểm tra và nhận lại máy' : 'Ready at customer service desk for pickup',
      icon: CheckCircle2,
    }
  ];

  return (
    <Dialog 
      open 
      onOpenChange={onClose} 
      title={isVi ? 'Tiến Độ Quy Trình Sửa Chữa' : 'Repair Workflow Timeline'}
    >
      <div className="py-3 space-y-6">
        <div className="p-4 rounded-2xl neu-inset bg-card text-center space-y-1">
          <h3 className="text-base font-bold font-mono text-primary">{codeDisplay}</h3>
          <p className="text-xs text-muted-foreground">
            {ticket.deviceModel || ticket.productName || 'Thiết bị di động'}
            {(ticket.imei || ticket.serialImei) ? ` • IMEI: ${ticket.imei || ticket.serialImei}` : ''}
          </p>
          {ticket.customerName && (
            <p className="text-xs text-foreground font-medium">
              {ticket.customerName} {ticket.customerPhone ? `(${ticket.customerPhone})` : ''}
            </p>
          )}
        </div>

        <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-6">
          {steps.map(s => {
            const isPast = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            const isFuture = s.id > currentStep;
            const Icon = s.icon;

            return (
              <div key={s.id} className={`relative transition-opacity ${isFuture ? 'opacity-40' : 'opacity-100'}`}>
                <div 
                  className={`absolute -left-[37px] top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20' 
                      : isPast
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                    {s.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-border/40">
          <Button type="button" variant="secondary" onClick={onClose} className="neu-raised">
            {isVi ? 'Đóng' : 'Close'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
