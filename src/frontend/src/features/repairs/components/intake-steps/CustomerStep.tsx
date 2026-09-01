import React, { useState } from 'react';
import { useAllCustomers } from '@/features/customers/hooks/useCustomers';
import type { IntakeState } from '../../pages/RepairIntakePage';
import { useThemeStore } from '@/stores/themeStore';
import { Search, UserPlus, CheckCircle2 } from 'lucide-react';
import { customerService } from '@/services/customerService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CustomerDto } from '@/types/api.types';
import toast from 'react-hot-toast';

interface Props {
  state: IntakeState;
  updateState: (updates: Partial<IntakeState>) => void;
  onNext: () => void;
}

export const CustomerStep: React.FC<Props> = ({ state, updateState, onNext }) => {
  const { language } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data, isLoading: loading, refetch: refetchCustomers } = useAllCustomers();
  const customers = Array.isArray(data) ? data : [];
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '', address: '' });
  const [creatingSubmit, setCreatingSubmit] = useState(false);

  

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleSelect = (c: CustomerDto) => {
    updateState({ customerId: c.id, customerName: c.fullName, customerPhone: c.phone });
    onNext();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.fullName || !newCustomer.phone) {
      toast.error('Vui lòng điền tên và số điện thoại');
      return;
    }
    setIsSubmitting(true);
      try {
        const newCust = await customerService.create(newCustomer);
      toast.success('Khách hàng mới đã được tạo');
      updateState({ customerId: newCust.id, customerName: newCust.fullName, customerPhone: newCust.phone });
      refetchCustomers();
      setIsCreating(false);
      onNext();
    } catch {
      toast.error('Lỗi khi tạo khách hàng');
      setIsSubmitting(false);
      }
    };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-slate-900">
        {language === 'vi' ? '1. Thông tin Khách hàng' : '1. Customer Information'}
      </h2>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10b981]" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'vi' ? 'Tìm số điện thoại hoặc tên khách...' : 'Search by phone or name...'}
          className="w-full bg-white border border-slate-300/40 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          disabled={isCreating}
        />
      </div>

      <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[150px]">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : isCreating ? (
          <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 bg-white">
            <h3 className="text-sm font-medium text-slate-900 mb-4">{language === 'vi' ? 'Thêm Khách Hàng Mới' : 'Add New Customer'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder={language === 'vi' ? 'Họ và Tên *' : 'Full Name *'}
                value={newCustomer.fullName}
                onChange={e => setNewCustomer({...newCustomer, fullName: e.target.value})}
                className="w-full bg-white border border-slate-300/40 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <Input
                type="text"
                placeholder={language === 'vi' ? 'Số điện thoại *' : 'Phone *'}
                value={newCustomer.phone}
                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="w-full bg-white border border-slate-300/40 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <Input
                placeholder="Email (Optional)"
                value={newCustomer.email}
                onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
              />
              <Input
                type="text"
                placeholder={language === 'vi' ? 'Địa chỉ' : 'Address'}
                value={newCustomer.address}
                onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                className="w-full bg-white border border-slate-300/40 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={isSubmitting || creatingSubmit}>Hủy Bỏ</Button>
              <Button type="submit" variant="success">Save & Select</Button>
            </div>
          </form>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <p className="text-slate-400 mb-4">{language === 'vi' ? 'Không tìm thấy khách hàng' : 'No customers found'}</p>
            <Button variant="outline" onClick={() => setIsCreating(true)} className="px-5 py-2.5 rounded-2xl bg-white border-2 border-dashed border-emerald-500/50 text-[#10b981] hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {language === 'vi' ? 'Tạo Khách hàng Mới' : 'Create New Customer'}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-400/20 max-h-[300px] overflow-y-auto">
            {filteredCustomers.map((c) => (
              <li 
                key={c.id} 
                onClick={() => handleSelect(c)}
                className="p-4 flex items-center justify-between hover:bg-emerald-500/5 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900 text-sm">{c.fullName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                </div>
                {state.customerId === c.id && <CheckCircle2 className="w-5 h-5 text-[#10b981]" />}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {state.customerId && (
         <div className="flex justify-end mt-4">
            <Button variant="outline"
              onClick={onNext}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
            >
              {language === 'vi' ? 'Tiếp tục' : 'Continue'}
            </Button>
         </div>
      )}
    </div>
  );
};


