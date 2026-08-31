import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { SalesOrderDto } from '../../types/api.types';
import { ShoppingBag, Search, FileText, CheckCircle2, Clock, XCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const SalesOrderListPage: React.FC = () => {
  const { language } = useThemeStore();
  const tSales = i18nDictionary[language].sales;
  const tCommon = i18nDictionary[language].common;

  const { data: fetchedOrders, isLoading: loading, refetch: loadOrders } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => salesService.getOrders(),
    staleTime: 5 * 60 * 1000
  });
  const orders = Array.isArray(fetchedOrders) ? fetchedOrders : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await salesService.updateOrderStatus(id, status);
      toast.success(
        language === 'vi'
          ? `Đã chuyển đơn hàng sang trạng thái ${status}!`
          : `Order status updated to ${status}!`
      );
      loadOrders();
    } catch (e: any) {
      toast.error(language === 'vi' ? 'Lỗi khi cập nhật trạng thái đơn hàng!' : 'Failed to update order status!');
    }
  };

  const handleCreateInvoice = async (orderId: string) => {
    try {
      const invoiceId = await salesService.createInvoice({ salesOrderId: orderId });
      toast.success(
        language === 'vi'
          ? `Xuất hóa đơn #${invoiceId.substring(0, 8)} thành công!`
          : `Invoice #${invoiceId.substring(0, 8)} issued successfully!`,
        { icon: '🧾' }
      );
      loadOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || (language === 'vi' ? 'Không thể tạo hóa đơn!' : 'Failed to issue invoice!'));
    }
  };

  const filteredOrders = (orders || []).filter((o) => {
    const code = o.orderCode || o.code || '';
    const cust = o.customerName || '';
    const term = searchTerm.toLowerCase();
    return code.toLowerCase().includes(term) || cust.toLowerCase().includes(term);
  });

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-[var(--neu-accent-mint)] border border-emerald-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusCompleted}</span>;
      case 'Confirmed':
        return <span className="px-3 py-1.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusConfirmed}</span>;
      case 'Cancelled':
        return <span className="px-3 py-1.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusCancelled}</span>;
      default:
        return <span className="px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusPending}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--neu-text-sub)]">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--neu-bg-base)] shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-[var(--neu-accent-mint)] border border-emerald-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-[var(--neu-text-title)] tracking-tight">{tSales.salesTitle}</h1>
            <p className="text-xs text-[var(--neu-text-sub)] mt-0.5 font-normal">{tSales.salesSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neu-accent-mint)]" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder={tSales.searchPlaceholder}
          className="w-full bg-[var(--neu-bg-base)] border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-[var(--neu-text-title)] placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-normal"
        />
      </div>

      {/* Table Card */}
      <div className="p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] uppercase font-medium border-b border-slate-400/20">
              <tr>
                <th className="p-3.5">{tSales.colOrderCode}</th>
                <th className="p-3.5">{tSales.colCustomer}</th>
                <th className="p-3.5 text-right">{tSales.colTotalAmount}</th>
                <th className="p-3.5">{tSales.colStatus}</th>
                <th className="p-3.5 text-right">{tSales.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400/20 text-[var(--neu-text-sub)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-normal">{tCommon.loading}</td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-normal">{tSales.emptyOrders}</td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-500/10 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[var(--neu-accent-mint)]">{order.orderCode}</td>
                    <td className="p-3.5">
                      <span className="flex items-center gap-1.5 font-medium text-[var(--neu-text-title)]">
                        <User className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" />
                        {order.customerName || tSales.guestRetailCustomer}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-medium text-[var(--neu-accent-mint)] text-sm">
                      {order.total.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-3.5">{getStatusBadge(order.status)}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button variant="outline"
                        onClick={() => handleCreateInvoice(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--neu-bg-base)] text-[var(--neu-accent-mint)] border border-emerald-500/30 shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 hover:scale-105 transition-all font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> {tSales.btnCreateInvoice}
                      </Button>

                      {order.status === 'Pending' && (
                        <Button variant="outline"
                          onClick={() => handleUpdateStatus(order.id, 'Completed')}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-[11px] shadow-[var(--neu-shadow-button)] hover:scale-105 transition-all cursor-pointer"
                        >
                          {tSales.btnApproveOrder}
                        </Button>
                      )}
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
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
