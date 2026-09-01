import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { voucherService } from '../../services/voucherService';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { VoucherDto } from '../../types/api.types';
import { Tag, Plus, Search, Calendar, CheckCircle2, Clock, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/common/Pagination';
import { VoucherFormModal } from '../../components/vouchers/VoucherFormModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const VoucherListPage: React.FC = () => {
  const { language } = useThemeStore();
  const tVoucher = i18nDictionary[language].vouchers;
  const tCommon = i18nDictionary[language].common;

  const { data: fetchedVouchers, isLoading: loading, refetch: loadVouchers } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => voucherService.getAll(),
    staleTime: 5 * 60 * 1000
  });
  const vouchers = Array.isArray(fetchedVouchers) ? fetchedVouchers : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: '', code: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [showModal, setShowModal] = useState(false);

  

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn thu hồi/xóa mã Voucher này?' : 'Are you sure you want to revoke/delete this voucher code?')) return;
    try {
      await voucherService.delete(id);
      toast.success(language === 'vi' ? 'Xóa/Thu hồi Voucher thành công!' : 'Voucher revoked/deleted successfully!');
      loadVouchers();
    } catch (e: any) {
      toast.error(language === 'vi' ? 'Không thể xóa Voucher!' : 'Failed to delete voucher!');
    }
  };

  const filteredVouchers = (vouchers || []).filter((v) =>
    (v.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedVouchers = (filteredVouchers || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string, expiryDate?: string, usageCount?: number, limit?: number) => {
    const isExpired = expiryDate && new Date(expiryDate) < new Date();
    const isFull = limit && usageCount ? usageCount >= limit : false;

    if (status === 'Cancelled') {
      return <span className="px-3 py-1.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium text-[11px] whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[90px] shadow-inner border border-border/50 bg-muted/20">{tVoucher.statusCancelled}</span>;
    }
    if (isExpired || status === 'Expired') {
      return <span className="px-3 py-1.5 rounded-2xl bg-slate-500/20 text-slate-400 border border-slate-400/30 font-medium text-[11px] whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[90px] shadow-inner border border-border/50 bg-muted/20">{tVoucher.statusExpired}</span>;
    }
    if (isFull || status === 'Used') {
      return <span className="px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium text-[11px] whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[90px] shadow-inner border border-border/50 bg-muted/20">{tVoucher.statusExhausted}</span>;
    }
    return <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-primary border border-emerald-500/30 font-medium text-[11px] whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[90px] shadow-inner border border-border/50 bg-muted/20">{tVoucher.statusAvailable}</span>;
  };

  return (
    <div className="space-y-6 font-sans text-muted-foreground">
      {/* Top Action Bar */}
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary border border-emerald-500/30">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">{tVoucher.vouchersTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">{tVoucher.vouchersSubtitle}</p>
          </div>
        </div>

        <Button variant="danger"
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-medium text-xs shadow-sm hover:scale-[1.02] active:scale-95 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {tVoucher.btnCreateVoucher}
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder={tVoucher.searchPlaceholder}
          className="w-full bg-card border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-foreground placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-normal"
        />
      </div>

      {/* Voucher Table Card */}
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-card text-foreground font-medium border-b border-slate-400/20 uppercase">
              <tr>
                <th className="p-3.5">{tVoucher.colCode}</th>
                <th className="p-3.5">{tVoucher.colDiscountAmount}</th>
                <th className="p-3.5">{tVoucher.colMinOrder}</th>
                <th className="p-3.5">{tVoucher.colUsage}</th>
                <th className="p-3.5">{tVoucher.colExpiry}</th>
                <th className="p-3.5">{tVoucher.colStatus}</th>
                <th className="p-3.5 text-right">{tVoucher.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400/20 text-muted-foreground">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">{tCommon.loading}</td>
                </tr>
              ) : paginatedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">{tVoucher.emptyVouchers}</td>
                </tr>
              ) : (
                paginatedVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-500/10 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-xs text-primary px-3 py-1 rounded-xl bg-card border border-emerald-500/30 shadow-inner border border-border/50 bg-muted/20 inline-block">
                        {v.code}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-primary text-sm">
                      {(v.discountAmount || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-3.5 text-foreground font-normal">
                      {v.minOrderValue ? `${v.minOrderValue.toLocaleString('vi-VN')} ₫` : tVoucher.noMinOrder}
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <span className="font-bold text-foreground">{v.usageCount || 0}</span>
                      <span className="text-muted-foreground"> / {v.usageLimit || '∞'} {language === 'vi' ? 'lượt' : 'uses'}</span>
                    </td>
                    <td className="p-3.5 text-foreground font-mono font-medium">
                      {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('vi-VN') : tVoucher.foreverExpiry}
                    </td>
                    <td className="p-3.5">{getStatusBadge(v.status, v.expiryDate, v.usageCount, v.usageLimit)}</td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button variant="outline"
                        onClick={() => handleDelete(v.id)}
                        className="p-2 rounded-xl bg-card text-rose-500 hover:text-rose-600 shadow-sm active:shadow-inner border border-border/50 bg-muted/20 transition-colors cursor-pointer"
                        title="Thu hồi / Xóa Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredVouchers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Voucher Form Modal */}
      {showModal && (
        <VoucherFormModal
          onClose={() => setShowModal(false)}
          onSuccess={loadVouchers}
        />
      )}
    </div>
  );
};
