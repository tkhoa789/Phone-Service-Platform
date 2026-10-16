import React, { useState } from 'react';
import { ShieldCheck, Save, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useCreateRepairChecklist } from '../api/useRepairs';
import toast from 'react-hot-toast';
import type { RepairTicketDto, ChecklistItemDto } from '@/types/api.types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs } from '@/components/ui/Tabs';

interface Props {
  ticket: RepairTicketDto;
  onClose: () => void;
  onSuccess: () => void;
}

const CANONICAL_CHECKPOINTS: Array<{ key: string; labelVi: string; labelEn: string }> = [
  { key: 'Display', labelVi: 'Màn hình hiển thị', labelEn: 'Display / Screen' },
  { key: 'Touch', labelVi: 'Cảm ứng', labelEn: 'Touch / Digitizer' },
  { key: 'FaceID', labelVi: 'Face ID / Vân tay', labelEn: 'Face ID / Touch ID' },
  { key: 'Camera', labelVi: 'Camera trước & sau', labelEn: 'Cameras (Front & Rear)' },
  { key: 'Speakers', labelVi: 'Loa ngoài & Micro', labelEn: 'Speakers & Mic' },
  { key: 'Charging', labelVi: 'Cổng sạc & Pin', labelEn: 'Charging Port & Battery' },
  { key: 'Wifi', labelVi: 'Wi-Fi & Bluetooth', labelEn: 'Wi-Fi & Bluetooth' },
  { key: 'Body', labelVi: 'Phím vật lý & Khung vỏ', labelEn: 'Physical Buttons & Body' },
];

export const RepairChecklistModal: React.FC<Props> = ({ ticket, onClose, onSuccess }) => {
  const { language } = useThemeStore();
  const isVi = language === 'vi';
  const [activeTab, setActiveTab] = useState<'CheckIn' | 'CheckOut'>('CheckIn');
  
  const existingChecklist = ticket.checklists?.find(c => c.type === activeTab);

  const initItems = (existingItems?: ChecklistItemDto[]): ChecklistItemDto[] => {
    return CANONICAL_CHECKPOINTS.map(cp => {
      const found = existingItems?.find(item => item.checkPointName === cp.key);
      return {
        checkPointName: cp.key,
        isPassed: found ? found.isPassed : true,
        issueDescription: found?.issueDescription || ''
      };
    });
  };
  
  const [items, setItems] = useState<ChecklistItemDto[]>(initItems(existingChecklist?.items));
  const [notes, setNotes] = useState(existingChecklist?.notes || '');

  const createChecklistMutation = useCreateRepairChecklist();

  const handleTabChange = (value: string) => {
    const tab = value as 'CheckIn' | 'CheckOut';
    setActiveTab(tab);
    const existing = ticket.checklists?.find(c => c.type === tab);
    setItems(initItems(existing?.items));
    setNotes(existing?.notes || '');
  };

  const toggleAll = (isPassed: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, isPassed, issueDescription: isPassed ? '' : item.issueDescription })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChecklistMutation.mutate({
      repairTicketId: ticket.id,
      type: activeTab,
      notes,
      items: items.map(i => ({
        checkPointName: i.checkPointName,
        isPassed: i.isPassed,
        issueDescription: i.issueDescription
      }))
    }, {
      onSuccess: () => {
        toast.success(isVi ? 'Lưu biên bản kiểm định thành công!' : 'Checklist saved successfully!');
        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || (isVi ? 'Lỗi khi lưu checklist!' : 'Failed to save checklist!');
        toast.error(msg);
      }
    });
  };

  const isReadOnly = Boolean(existingChecklist);

  return (
    <Dialog 
      open 
      onOpenChange={onClose} 
      title={isVi ? 'Kiểm Định & QC Thiết Bị' : 'Device QC & Functional Checklist'}
    >
      <div className="py-2 space-y-4">
        <Tabs 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          tabs={[
            { id: 'CheckIn', label: isVi ? 'Lúc Nhận Máy (Check-In)' : 'Intake (Check-In)' }, 
            { id: 'CheckOut', label: isVi ? 'Lúc Giao Máy (Check-Out)' : 'Delivery (Check-Out)' }
          ]} 
        />

        {existingChecklist ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {isVi 
                  ? `Biên bản ${activeTab === 'CheckIn' ? 'Nhận máy' : 'Giao máy'} đã được lưu trữ (Audit-Locked).`
                  : `${activeTab} checklist is permanently recorded for audit & warranty.`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isVi
                  ? 'Theo quy định kiểm định kỹ thuật, biên bản đã lập không thể ghi đè để bảo vệ tính toàn vẹn dữ liệu.'
                  : 'Checklist records are immutable once saved to preserve inspection integrity.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {isVi 
                ? 'Vui lòng kiểm tra kỹ 8 hạng mục tiêu chuẩn trước khi lưu biên bản.' 
                : 'Please verify all 8 standard checkpoints before recording.'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground font-medium">
            {isVi ? 'Tiêu chuẩn 8 điểm AppleCare/OEM' : '8-Point OEM Standard'}
          </span>
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={() => toggleAll(true)}
                className="text-xs h-7 px-2.5 neu-raised text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {isVi ? 'Đạt tất cả' : 'Pass All'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={() => toggleAll(false)}
                className="text-xs h-7 px-2.5 neu-raised text-rose-500"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                {isVi ? 'Lỗi tất cả' : 'Fail All'}
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const cpDef = CANONICAL_CHECKPOINTS.find(c => c.key === item.checkPointName);
              const label = isVi ? (cpDef?.labelVi || item.checkPointName) : (cpDef?.labelEn || item.checkPointName);

              return (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border transition-all ${
                    item.isPassed 
                      ? 'bg-card border-border/40 neu-raised' 
                      : 'bg-rose-500/5 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">{label}</span>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        if (isReadOnly) return;
                        const newItems = [...items];
                        newItems[idx].isPassed = !newItems[idx].isPassed;
                        setItems(newItems);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isReadOnly ? 'cursor-default opacity-90' : 'cursor-pointer'
                      } ${
                        item.isPassed 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-rose-500 text-white shadow-sm'
                      }`}
                    >
                      {item.isPassed ? (isVi ? 'Đạt (PASS)' : 'PASS') : (isVi ? 'Lỗi (FAIL)' : 'FAIL')}
                    </button>
                  </div>

                  {!item.isPassed && (
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={item.issueDescription || ''}
                      onChange={(e) => {
                        if (isReadOnly) return;
                        const newItems = [...items];
                        newItems[idx].issueDescription = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder={isVi ? 'Ghi chú lỗi chi tiết...' : 'Describe issue...'}
                      className={`w-full mt-2 bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500/50 ${
                        isReadOnly ? 'opacity-80 cursor-not-allowed bg-muted/20' : ''
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {isVi ? 'Ghi chú bổ sung (Ngoại quan, trầy xước, phụ kiện đi kèm...)' : 'Additional Notes (Cosmetic condition, accessories...)'}
            </label>
            <Textarea
              disabled={isReadOnly}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isVi ? 'VD: Khách mang máy không kèm sim, ốp lưng trầy nhẹ...' : 'Ex: Device without SIM card, case slightly scratched...'}
              rows={2}
              className={`text-xs bg-background ${isReadOnly ? 'opacity-80 cursor-not-allowed bg-muted/20' : ''}`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button type="button" variant="secondary" onClick={onClose} className="neu-raised">
              {isVi ? 'Đóng' : 'Close'}
            </Button>
            {isReadOnly ? (
              <Button type="button" variant="outline" disabled className="opacity-70 cursor-not-allowed text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                <span>{isVi ? 'Đã lưu trữ (Audit-Locked)' : 'Archived (Locked)'}</span>
              </Button>
            ) : (
              <Button type="submit" variant="primary" disabled={createChecklistMutation.isPending} className="shadow-md">
                {createChecklistMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {isVi ? 'Đang lưu...' : 'Saving...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    {isVi ? 'Lưu Biên Bản' : 'Save Checklist'}
                  </span>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Dialog>
  );
};
