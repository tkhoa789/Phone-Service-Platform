import React, { useState } from 'react';
import { useAllCustomers } from '@/features/customers/hooks/useCustomers';
import type { IntakeState } from '../../types/intake.types';
import { useThemeStore } from '@/stores/themeStore';
import { Search, UserPlus, CheckCircle2, User, Phone, MapPin, UserCheck, ArrowRight } from 'lucide-react';
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

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleSelect = (c: CustomerDto) => {
    updateState({
      customerId: c.id,
      customerName: c.fullName,
      customerPhone: c.phone,
      customerAddress: c.address || '',
    });
    toast.success(
      language === 'vi'
        ? `Đã chọn khách hàng: ${c.fullName}`
        : `Selected customer: ${c.fullName}`
    );
    onNext();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.fullName.trim() || !newCustomer.phone.trim()) {
      toast.error(
        language === 'vi'
          ? 'Vui lòng điền họ tên và số điện thoại!'
          : 'Please enter name and phone number!'
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const newCust = await customerService.create(newCustomer);
      toast.success(
        language === 'vi'
          ? `Đã thêm khách hàng mới: ${newCust.fullName}`
          : `Created new customer: ${newCust.fullName}`
      );
      updateState({
        customerId: newCust.id,
        customerName: newCust.fullName,
        customerPhone: newCust.phone,
        customerAddress: newCust.address || '',
      });
      refetchCustomers();
      setIsCreating(false);
      onNext();
    } catch {
      toast.error(language === 'vi' ? 'Lỗi khi tạo hồ sơ khách hàng' : 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold border border-emerald-500/20">
              1
            </span>
            {language === 'vi' ? 'Thông tin Khách hàng Tiếp nhận' : 'Customer Intake Information'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'vi'
              ? 'Tìm kiếm khách hàng hiện có qua số điện thoại/họ tên hoặc tạo nhanh khách hàng mới'
              : 'Search existing customer by phone/name or quickly register a new customer'}
          </p>
        </div>

        {!isCreating && (
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="neu-raised hover:neu-pressed text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            {language === 'vi' ? '+ Thêm khách mới' : '+ New Customer'}
          </Button>
        )}
      </div>

      {/* Selected Customer Banner if already chosen */}
      {state.customerId && !isCreating && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground">{state.customerName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                  {language === 'vi' ? 'Đã chọn' : 'Selected'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-foreground/80">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {state.customerPhone}
                </span>
                {state.customerAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    {state.customerAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateState({ customerId: undefined, customerName: undefined, customerPhone: undefined })}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              {language === 'vi' ? 'Chọn khách khác' : 'Change'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-1.5 shadow-sm"
            >
              {language === 'vi' ? 'Tiếp tục' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create New Customer Form */}
      {isCreating ? (
        <form onSubmit={handleCreateCustomer} className="p-6 rounded-3xl bg-card border border-border/40 neu-raised space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" />
              {language === 'vi' ? 'Đăng ký Hồ sơ Khách Hàng Mới' : 'Register New Customer Profile'}
            </h3>
            <span className="text-xs text-muted-foreground">
              {language === 'vi' ? '(*) Trường bắt buộc' : '(*) Required fields'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === 'vi' ? 'Họ và tên khách hàng' : 'Full Name'} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                required
                placeholder={language === 'vi' ? 'VD: Nguyễn Văn An' : 'E.g: John Doe'}
                value={newCustomer.fullName}
                onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                className="w-full neu-inset bg-background/50 border-border/40 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === 'vi' ? 'Số điện thoại' : 'Phone Number'} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="tel"
                required
                placeholder={language === 'vi' ? 'VD: 0912345678' : 'E.g: 0912345678'}
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full neu-inset bg-background/50 border-border/40 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === 'vi' ? 'Email (Không bắt buộc)' : 'Email (Optional)'}
              </label>
              <Input
                type="email"
                placeholder={language === 'vi' ? 'khachhang@example.com' : 'customer@example.com'}
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full neu-inset bg-background/50 border-border/40 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {language === 'vi' ? 'Địa chỉ' : 'Address'}
              </label>
              <Input
                type="text"
                placeholder={language === 'vi' ? 'VD: 123 Trần Phú, Nha Trang' : 'E.g: 123 Tran Phu, Nha Trang'}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="w-full neu-inset bg-background/50 border-border/40 text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreating(false)}
              disabled={isSubmitting}
              className="text-muted-foreground"
            >
              {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting
                ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                : (language === 'vi' ? 'Lưu & Chọn khách' : 'Save & Select')}
            </Button>
          </div>
        </form>
      ) : (
        /* Search and List Existing Customers */
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm theo số điện thoại hoặc tên khách hàng...' : 'Search by phone number or customer name...'}
              className="w-full neu-inset bg-background/50 border-border/40 rounded-2xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="rounded-2xl border border-border/40 bg-card neu-raised overflow-hidden min-h-[160px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                {language === 'vi' ? 'Đang tải danh bạ khách hàng...' : 'Loading customers...'}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <User className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  {searchTerm
                    ? (language === 'vi' ? `Không tìm thấy khách hàng khớp với "${searchTerm}"` : `No customer matches "${searchTerm}"`)
                    : (language === 'vi' ? 'Chưa có danh sách khách hàng' : 'No customers found')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (searchTerm.match(/^[0-9+]+$/)) {
                      setNewCustomer((prev) => ({ ...prev, phone: searchTerm }));
                    } else if (searchTerm.trim()) {
                      setNewCustomer((prev) => ({ ...prev, fullName: searchTerm }));
                    }
                    setIsCreating(true);
                  }}
                  className="neu-raised hover:neu-pressed text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {language === 'vi' ? 'Tạo mới với thông tin này' : 'Create new with this info'}
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/30 max-h-[340px] overflow-y-auto">
                {filteredCustomers.map((c) => {
                  const isCurrent = state.customerId === c.id;
                  return (
                    <li
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500/10'
                          : 'hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCurrent
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm">{c.fullName}</p>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-medium">
                                {language === 'vi' ? 'Đang chọn' : 'Selected'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span className="font-mono">{c.phone}</span>
                            {c.address && <span>• {c.address}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-emerald-500"
                          >
                            {language === 'vi' ? 'Chọn' : 'Select'}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
