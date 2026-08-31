import React, { useState } from 'react';
import { ShieldCheck, Save, AlertCircle } from 'lucide-react';
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

const DEFAULT_CHECKPOINTS = [
  'Màn hình hiển thị',
  'Cảm ứng',
  'Face ID / Vân tay',
  'Camera trước / sau',
  'Loa ngoài / Loa trong',
  'Sạc / Pin',
  'Wi-Fi / Bluetooth',
  'Phím vật lý'
];

export const RepairChecklistModal: React.FC<Props> = ({ ticket, onClose, onSuccess }) => {
  const { language } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'CheckIn' | 'CheckOut'>('CheckIn');
  
  const existingChecklist = ticket.checklists?.find(c => c.type === activeTab);
  
  const [items, setItems] = useState<ChecklistItemDto[]>(
    existingChecklist?.items || DEFAULT_CHECKPOINTS.map(cp => ({ checkPointName: cp, isPassed: true, note: '' }))
  );
  
  const [notes, setNotes] = useState(existingChecklist?.notes || '');

  const createChecklistMutation = useCreateRepairChecklist();

  const handleTabChange = (value: string) => {
    const tab = value as 'CheckIn' | 'CheckOut';
    setActiveTab(tab);
    const existing = ticket.checklists?.find(c => c.type === tab);
    setItems(existing?.items || DEFAULT_CHECKPOINTS.map(cp => ({ checkPointName: cp, isPassed: true, note: '' })));
    setNotes(existing?.notes || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChecklistMutation.mutate({
      repairTicketId: ticket.id,
      type: activeTab,
      notes,
      items
    }, {
      onSuccess: () => {
        toast.success(language === 'vi' ? 'Lưu checklist thành công!' : 'Checklist saved!');
        onSuccess();
        onClose();
      },
      onError: () => {
        toast.error(language === 'vi' ? 'Lỗi khi lưu checklist!' : 'Failed to save checklist!');
      }
    });
  };

  return (
    <Dialog open onOpenChange={onClose} title={language === 'vi' ? 'Ki?m �?nh & QC M�y' : 'Device QC & Checklist'}>
      
        
          
        

        <div className="py-2">
          <Tabs activeTab={activeTab} onChange={handleTabChange} tabs={[{ id: 'CheckIn', label: language === 'vi' ? 'Lúc Nhận Máy' : 'Intake' }, { id: 'CheckOut', label: language === 'vi' ? 'Lúc Giao Máy' : 'Delivery' }]} />
<div>
            
            <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                {existingChecklist 
                  ? (language === 'vi' ? 'Checklist này đã được ghi nhận. Bạn đang xem hoặc cập nhật lại.' : 'This checklist was already recorded. You are viewing or updating it.')
                  : (language === 'vi' ? 'Vui lòng kiểm tra kỹ các chức năng trước khi lưu.' : 'Please test all functions carefully before saving.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between bg-white shadow-sm hover:border-slate-300 transition-colors">
                    <span className="text-sm font-medium text-slate-700">{item.checkPointName}</span>
                    <Button variant="outline"
                      type="button"
                      onClick={() => {
                        const newItems = [...items];
                        newItems[idx].isPassed = !newItems[idx].isPassed;
                        setItems(newItems);
                      }}
                      className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${item.isPassed ? 'bg-emerald-500 justify-end' : 'bg-rose-500 justify-start'}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {language === 'vi' ? 'Ghi chú thêm (Tình trạng vỏ, xước xát...)' : 'Additional Notes (Cosmetic, scratches...)'}
                </label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={language === 'vi' ? 'Vd: Máy có vết cấn nhẹ ở góc trái...' : 'Ex: Minor dent on left corner...'}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </Button>
                <Button type="submit" variant="primary" disabled={createChecklistMutation.isPending}>
                  {createChecklistMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {language === 'vi' ? 'Đang lưu...' : 'Saving...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {language === 'vi' ? 'Lưu Checklist' : 'Save Checklist'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      
    </Dialog>
  );
};




