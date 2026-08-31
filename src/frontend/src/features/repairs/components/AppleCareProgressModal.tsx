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
    customerName: string;
    customerPhone: string;
    deviceModel: string;
    serialImei?: string;
    status: string;
  };
  onClose: () => void;
}

export const AppleCareProgressModal: React.FC<AppleCareProgressModalProps> = ({ ticket, onClose }) => {
  const { language } = useThemeStore();

  const codeDisplay = ticket.ticketCode || ticket.code || 'REP-888888';
  
  const statusMap: Record<string, number> = {
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
      title: language === 'vi' ? 'Tiếp nhận' : 'Received',
      desc: language === 'vi' ? 'Đã nhận máy và lưu kho' : 'Device received and logged',
      icon: Clock,
    },
    {
      id: 2,
      title: language === 'vi' ? 'Chuẩn đoán' : 'Diagnostics',
      desc: language === 'vi' ? 'Kỹ thuật viên đang kiểm tra lỗi' : 'Technician is running diagnostics',
      icon: ShieldCheck,
    },
    {
      id: 3,
      title: language === 'vi' ? 'Sửa chữa' : 'Repairing',
      desc: language === 'vi' ? 'Đang thay thế linh kiện' : 'Replacing parts',
      icon: Wrench,
    },
    {
      id: 4,
      title: language === 'vi' ? 'Kiểm định (QC)' : 'Quality Control',
      desc: language === 'vi' ? 'Kiểm tra độ ổn định sau sửa' : 'Testing stability after repair',
      icon: AlertCircle,
    },
    {
      id: 5,
      title: language === 'vi' ? 'Hoàn tất' : 'Completed',
      desc: language === 'vi' ? 'Sẵn sàng giao cho khách' : 'Ready for pickup',
      icon: CheckCircle2,
    }
  ];

  return (
    <Dialog open onOpenChange={onClose} title={language === 'vi' ? 'Tiến độ sửa chữa' : 'Repair Progress'}>


        <div className="py-6 space-y-8">
          <div className="text-center">
            <h3 className="text-lg font-bold">{codeDisplay}</h3>
            <p className="text-slate-500">{ticket.deviceModel}</p>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
            {steps.map(s => {
              const isPast = s.id < currentStep;
              const isCurrent = s.id === currentStep;
              const isFuture = s.id > currentStep;
              const Icon = s.icon;

              return (
                <div key={s.id} className={`relative ${isFuture ? 'opacity-50' : ''}`}>
                  <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center ${isPast || isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isCurrent ? 'text-indigo-600' : 'text-slate-900'}`}>{s.title}</h4>
                    <p className="text-sm text-slate-500">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
<div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">

          <Button variant="outline" onClick={onClose}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        
</div>
</Dialog>
  );
};

