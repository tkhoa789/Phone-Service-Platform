import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSubmitDiagnosis } from '../api/useRepairs';
import { useThemeStore } from '@/stores/themeStore';
import { formatCurrency } from '@/utils/formatCurrency';
import type { RepairTicketDto } from '@/types/api.types';
import toast from 'react-hot-toast';
import { 
  AlertCircle, Wrench, Clock, DollarSign, 
  CheckCircle2, ArrowRight, PackageOpen, HelpCircle 
} from 'lucide-react';

interface SubmitDiagnosisModalProps {
  ticket: RepairTicketDto;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitDiagnosisModal: React.FC<SubmitDiagnosisModalProps> = ({
  ticket,
  onClose,
  onSuccess,
}) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';

  const [rootCause, setRootCause] = useState(ticket.diagnosisRootCause || '');
  const [proposedSolution, setProposedSolution] = useState(ticket.diagnosisProposedSolution || '');
  const [estimatedCost, setEstimatedCost] = useState<number>(ticket.estimatedCost || 0);
  const [estimatedDays, setEstimatedDays] = useState<number>(ticket.estimatedDays || 1);
  const [technicalNotes, setTechnicalNotes] = useState(ticket.technicalNotes || '');
  
  // Route selection: 'repairing' | 'approval' | 'parts'
  const [nextRoute, setNextRoute] = useState<'repairing' | 'approval' | 'parts'>('repairing');

  const submitDiagnosisMutation = useSubmitDiagnosis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rootCause.trim()) {
      toast.error(isVi ? 'Vui lòng nhập nguyên nhân hư hỏng của thiết bị!' : 'Please enter the root cause!');
      return;
    }

    if (!proposedSolution.trim()) {
      toast.error(isVi ? 'Vui lòng nhập phương án xử lý kỹ thuật!' : 'Please enter the proposed solution!');
      return;
    }

    submitDiagnosisMutation.mutate(
      {
        repairTicketId: ticket.id,
        rootCause: rootCause.trim(),
        proposedSolution: proposedSolution.trim(),
        estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
        estimatedDays: estimatedDays > 0 ? estimatedDays : undefined,
        technicalNotes: technicalNotes.trim() || undefined,
        requiresCustomerApproval: nextRoute === 'approval',
        waitingForParts: nextRoute === 'parts',
      },
      {
        onSuccess: () => {
          toast.success(
            isVi 
              ? 'Đã lập biên bản chẩn đoán và cập nhật quy trình thành công!' 
              : 'Diagnosis submitted successfully!'
          );
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || 
            (isVi ? 'Không thể lưu kết quả chẩn đoán!' : 'Failed to submit diagnosis!')
          );
        },
      }
    );
  };

  return (
    <Dialog
      open
      onOpenChange={onClose}
      title={isVi ? 'Biên Bản Chẩn Đoán Kỹ Thuật' : 'Technical Diagnostic Report'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs font-sans">
        {/* Ticket & Device Overview Banner */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary">{ticket.ticketCode || (ticket as any).code}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-semibold text-foreground">{ticket.customModelName || ticket.productName || ticket.deviceModel || 'Thiết bị'}</span>
            </div>
            <p className="text-muted-foreground text-[11px] truncate max-w-[280px] sm:max-w-md">
              {isVi ? 'Lỗi ban đầu:' : 'Reported Fault:'} {ticket.problemDescription || (isVi ? 'Chưa ghi nhận' : 'None')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-muted-foreground block">{isVi ? 'Kỹ thuật viên' : 'Technician'}</span>
            <span className="font-semibold text-foreground text-[11px]">{ticket.technicianName || 'Tôi phụ trách'}</span>
          </div>
        </div>

        {/* Root Cause (Required) */}
        <div>
          <label className="block font-bold text-foreground mb-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{isVi ? 'Nguyên nhân hư hỏng / Bệnh phát hiện *' : 'Identified Root Cause *'}</span>
          </label>
          <textarea
            required
            rows={2}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder={isVi ? 'Ví dụ: Chập IC nguồn do vô nước, đứt cáp màn hình hiển thị...' : 'E.g., IC power short due to liquid damage...'}
            className="w-full p-2.5 rounded-xl border border-border/40 bg-background/50 text-foreground text-xs neu-inset focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
          />
        </div>

        {/* Proposed Solution (Required) */}
        <div>
          <label className="block font-bold text-foreground mb-1.5 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isVi ? 'Phương án kỹ thuật đề xuất *' : 'Proposed Technical Solution *'}</span>
          </label>
          <textarea
            required
            rows={2}
            value={proposedSolution}
            onChange={(e) => setProposedSolution(e.target.value)}
            placeholder={isVi ? 'Ví dụ: Vệ sinh main, câu lại đường áp 3.3V, thay cụm cáp màn hình zin...' : 'E.g., Clean logic board, reball IC, replace flex cable...'}
            className="w-full p-2.5 rounded-xl border border-border/40 bg-background/50 text-foreground text-xs neu-inset focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
          />
        </div>

        {/* Estimated Cost & Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isVi ? 'Chi phí sửa chữa ước tính (VNĐ):' : 'Estimated Cost (VND):'}</span>
            </label>
            <Input
              type="number"
              min={0}
              step={10000}
              value={estimatedCost || ''}
              onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)}
              placeholder="0"
              className="h-9 text-xs font-mono neu-inset bg-background/50"
            />
            {estimatedCost > 0 && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                {formatCurrency(estimatedCost)}
              </span>
            )}
          </div>

          <div>
            <label className="block font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{isVi ? 'Thời gian hoàn thành ước tính (ngày):' : 'Estimated Turnaround (days):'}</span>
            </label>
            <Input
              type="number"
              min={1}
              max={30}
              value={estimatedDays || ''}
              onChange={(e) => setEstimatedDays(Number(e.target.value) || 1)}
              placeholder="1"
              className="h-9 text-xs font-mono neu-inset bg-background/50"
            />
          </div>
        </div>

        {/* Technical Internal Notes */}
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            {isVi ? 'Ghi chú kỹ thuật nội bộ (Tùy chọn):' : 'Internal Technical Notes (Optional):'}
          </label>
          <Input
            type="text"
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder={isVi ? 'Ghi chú chi tiết cho KTV tiếp theo hoặc thủ kho...' : 'Internal notes for techs or warehouse...'}
            className="h-9 text-xs neu-inset bg-background/50"
          />
        </div>

        {/* Next Step / Route Selection */}
        <div className="space-y-2 pt-1">
          <label className="block font-bold text-foreground flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <span>{isVi ? 'Quyết định chuyển bước sau chẩn đoán:' : 'Next Action Post-Diagnosis:'}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Route 1: Tiến hành sửa ngay */}
            <label
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                nextRoute === 'repairing'
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/20 text-foreground'
                  : 'bg-card border-border/40 hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <input
                    type="radio"
                    name="nextRoute"
                    value="repairing"
                    checked={nextRoute === 'repairing'}
                    onChange={() => setNextRoute('repairing')}
                    className="accent-primary"
                  />
                  <span>{isVi ? 'Sửa máy ngay' : 'Repair Now'}</span>
                </div>
                <Wrench className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-[10px] leading-relaxed">
                {isVi ? 'Đã có đủ linh kiện và khách đã đồng ý từ trước.' : 'Parts in stock and pre-approved.'}
              </p>
              <span className="text-[9.5px] font-mono font-bold text-primary">→ Repairing</span>
            </label>

            {/* Route 2: Chờ khách duyệt giá */}
            <label
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                nextRoute === 'approval'
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-foreground'
                  : 'bg-card border-border/40 hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <input
                    type="radio"
                    name="nextRoute"
                    value="approval"
                    checked={nextRoute === 'approval'}
                    onChange={() => setNextRoute('approval')}
                    className="accent-amber-500"
                  />
                  <span>{isVi ? 'Chờ khách duyệt' : 'Wait Approval'}</span>
                </div>
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[10px] leading-relaxed">
                {isVi ? 'Chi phí phát sinh cao, cần báo giá khách trước khi làm.' : 'Requires customer approval on quote.'}
              </p>
              <span className="text-[9.5px] font-mono font-bold text-amber-600 dark:text-amber-400">→ WaitingApproval</span>
            </label>

            {/* Route 3: Chờ linh kiện */}
            <label
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                nextRoute === 'parts'
                  ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 text-foreground'
                  : 'bg-card border-border/40 hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <input
                    type="radio"
                    name="nextRoute"
                    value="parts"
                    checked={nextRoute === 'parts'}
                    onChange={() => setNextRoute('parts')}
                    className="accent-blue-500"
                  />
                  <span>{isVi ? 'Chờ linh kiện' : 'Wait Parts'}</span>
                </div>
                <PackageOpen className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-[10px] leading-relaxed">
                {isVi ? 'Kho tạm hết linh kiện thay thế, cần chờ điều chuyển kho.' : 'Parts currently out of stock.'}
              </p>
              <span className="text-[9.5px] font-mono font-bold text-blue-600 dark:text-blue-400">→ WaitingForParts</span>
            </label>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitDiagnosisMutation.isPending}
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitDiagnosisMutation.isPending}
            className="flex items-center gap-1.5 px-4 font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {submitDiagnosisMutation.isPending
                ? (isVi ? 'Đang lưu kết quả...' : 'Submitting...')
                : (isVi ? 'Hoàn tất Chẩn Đoán' : 'Submit Diagnosis')}
            </span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
