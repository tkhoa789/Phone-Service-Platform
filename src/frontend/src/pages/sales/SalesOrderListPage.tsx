import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';
import { salesSandboxService } from '../../features/sales/services/salesSandboxService';
import { managerSandboxService } from '../../features/dashboard/services/managerSandboxService';
import { exitSandboxMode } from '../../utils/sandboxUtils';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../constants/permissions';
import { i18nDictionary } from '../../locales/dictionary';
import type { SalesOrderDto } from '../../types/api.types';
import { ShoppingBag, Search, FileText, CheckCircle2, Clock, XCircle, User, Printer, RefreshCw, LogOut, Sparkles, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PosK80Receipt } from '../../features/pos/components/PosK80Receipt';
import { useManagerSalesTour } from '../../features/sales/hooks/useManagerSalesTour';

export const SalesOrderListPage: React.FC = () => {
  const { language } = useThemeStore();
  const { can, hasPermission, hasRole, roles } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isSandboxMode = 
    searchParams.get('mode') === 'training' || 
    location.search.includes('sandbox=true') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true');

  const [sandboxTick, setSandboxTick] = useState(0);
  const { startTour: startManagerSalesTour } = useManagerSalesTour();

  useEffect(() => {
    if (searchParams.get('tour') === 'auto') {
      const timer = setTimeout(() => {
        startManagerSalesTour();
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('tour');
        setSearchParams(newParams, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, startManagerSalesTour]);

  useEffect(() => {
    const handleUpdate = () => setSandboxTick((t) => t + 1);
    window.addEventListener('psp_sandbox_sales_updated', handleUpdate);
    return () => window.removeEventListener('psp_sandbox_sales_updated', handleUpdate);
  }, []);

  const isManagerOrAdmin = hasRole('Manager') || hasRole('Admin') || hasRole('Owner') || roles.includes('Manager') || roles.includes('Admin') || roles.includes('Owner');
  const checkPermission = typeof can === 'function' ? can : (typeof hasPermission === 'function' ? hasPermission : () => true);
  const canCreateInvoice = isManagerOrAdmin && checkPermission(PERMISSIONS.Invoice_Create);
  const canUpdateOrder = isManagerOrAdmin && checkPermission(PERMISSIONS.SalesOrder_Update);
  const canCancelOrder = isManagerOrAdmin && checkPermission(PERMISSIONS.SalesOrder_Cancel);

  const tSales = i18nDictionary[language].sales;
  const tCommon = i18nDictionary[language].common;

  const { data: fetchedOrders, isLoading: loadingLive, refetch: loadOrders } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => salesService.getOrders(),
    staleTime: 5 * 60 * 1000,
    enabled: !isSandboxMode,
  });

  const orders = useMemo(() => {
    if (isSandboxMode) {
      return salesSandboxService.getOrders();
    }
    return Array.isArray(fetchedOrders) ? fetchedOrders : [];
  }, [isSandboxMode, fetchedOrders, sandboxTick]);

  const loading = isSandboxMode ? false : loadingLive;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      if (isSandboxMode) {
        if (status === 'Completed') {
          salesSandboxService.completeOrder(id);
        } else if (status === 'Cancelled') {
          salesSandboxService.cancelOrder(id);
        }
        toast.success(
          language === 'vi'
            ? `Đã chuyển đơn hàng sang trạng thái ${status} (Sandbox)!`
            : `Order status updated to ${status} (Sandbox)!`
        );
        return;
      }
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

  const handleCancelOrder = async (id: string) => {
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn hủy đơn hàng này?' : 'Are you sure you want to cancel this order?')) return;
    try {
      if (isSandboxMode) {
        salesSandboxService.cancelOrder(id);
        managerSandboxService.resolveVoidOrder(id);
        toast.success(language === 'vi' ? 'Đã hủy đơn hàng thành công (Sandbox)!' : 'Order cancelled successfully (Sandbox)!');
        return;
      }
      await salesService.updateOrderStatus(id, 'Cancelled');
      toast.success(language === 'vi' ? 'Đã hủy đơn hàng thành công!' : 'Order cancelled successfully!');
      loadOrders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (language === 'vi' ? 'Lỗi khi hủy đơn hàng!' : 'Failed to cancel order!'));
    }
  };

  const handleViewOrPrintInvoice = async (order: SalesOrderDto) => {
    let orderDetail = order;
    if (isSandboxMode) {
      orderDetail = salesSandboxService.getOrderById(order.id) || order;
      setActiveReceipt({
        orderId: orderDetail.orderCode || orderDetail.code || orderDetail.id,
        customerName: orderDetail.customerName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest'),
        customerPhone: orderDetail.customerPhone,
        items: (orderDetail.items || []).map((it) => ({
          variantId: it.productVariantId,
          productName: it.productName,
          variantName: '',
          sku: it.sku || '',
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          imeis: [],
          isImeiControlled: false,
        })),
        subtotal: orderDetail.subtotal || orderDetail.total,
        discount: orderDetail.discount || 0,
        total: orderDetail.total,
        paymentMethod: 'CASH',
      });
      return;
    }

    if (!order.items || order.items.length === 0) {
      try {
        orderDetail = await salesService.getOrderById(order.id);
      } catch {
        orderDetail = order;
      }
    }

    // Nếu chưa xuất hóa đơn, gọi API xuất hóa đơn trước
    if (!order.hasInvoice) {
      try {
        const invoiceId = await salesService.createInvoice({ salesOrderId: order.id });
        toast.success(
          language === 'vi'
            ? `Xuất hóa đơn điện tử #${invoiceId.substring(0, 8)} thành công!`
            : `Invoice #${invoiceId.substring(0, 8)} issued successfully!`,
          { icon: '🧾' }
        );
        loadOrders();
      } catch (e: any) {
        const msg = e?.response?.data?.message || '';
        // Nếu đã xuất trước đó thì tiếp tục mở xem hóa đơn
        if (!msg.includes('đã được xuất')) {
          toast.error(msg || (language === 'vi' ? 'Không thể tạo hóa đơn!' : 'Failed to issue invoice!'));
          return;
        }
      }
    }

    // Mở phiếu in hóa đơn / hóa đơn bán lẻ K80
    setActiveReceipt({
      orderId: orderDetail.orderCode || orderDetail.code || orderDetail.id,
      customerName: orderDetail.customerName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest'),
      customerPhone: orderDetail.customerPhone,
      items: (orderDetail.items || []).map((it: any) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        imei: it.imei
      })),
      subtotal: orderDetail.subtotal,
      discount: orderDetail.discount,
      total: orderDetail.total,
      paymentMethod: 'CASH',
    });
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
        return <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-primary border border-emerald-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusCompleted}</span>;
      case 'Confirmed':
        return <span className="px-3 py-1.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusConfirmed}</span>;
      case 'Cancelled':
        return <span className="px-3 py-1.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusCancelled}</span>;
      default:
        return <span className="px-3 py-1.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[95px] shadow-inner border border-border/50 bg-muted/20">{tSales.statusPending}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-muted-foreground">
      {/* Top Banner */}
      <div id="tour-sales-order-header" className="p-6 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary border border-emerald-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight">{tSales.salesTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">{tSales.salesSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            id="tour-sales-order-guide-btn"
            type="button"
            onClick={startManagerSalesTour}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
            <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
          </Button>
        </div>
      </div>

      {/* Sandbox Alert Banner */}
      {isSandboxMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {language === 'vi'
                ? 'Chế độ Thực hành: Quản lý danh sách đơn hàng giả lập an toàn'
                : 'Sandbox Mode: Isolated sales order list active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                salesSandboxService.resetToDefault();
                toast.success(
                  language === 'vi' ? 'Đã đặt lại dữ liệu đơn hàng mẫu!' : 'Reset sandbox orders successfully!',
                  { icon: '🔄' }
                );
              }}
              className="h-8 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Sandbox'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exitSandboxMode({
                  searchParams,
                  setSearchParams,
                  language,
                });
              }}
              className="h-8 text-xs bg-card border-border hover:bg-rose-500/10 hover:border-rose-500/40 text-muted-foreground hover:text-rose-500 cursor-pointer font-semibold"
              title={language === 'vi' ? 'Thoát khỏi chế độ thực hành ngay lập tức' : 'Exit sandbox mode immediately'}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              <span>{language === 'vi' ? 'Thoát Thực Hành' : 'Exit Sandbox'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div id="tour-sales-order-search" className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder={tSales.searchPlaceholder}
          className="w-full bg-card border border-slate-300/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-foreground placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-normal"
        />
      </div>

      {/* Table Card */}
      <div id="tour-sales-order-table" className="p-6 rounded-3xl bg-card border border-border/50 shadow-md space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-card text-foreground uppercase font-medium border-b border-slate-400/20">
              <tr>
                <th className="p-3.5">{tSales.colOrderCode}</th>
                <th className="p-3.5">{tSales.colCustomer}</th>
                <th className="p-3.5 text-right">{tSales.colTotalAmount}</th>
                <th className="p-3.5">{tSales.colStatus}</th>
                <th className="p-3.5 text-right">{tSales.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400/20 text-muted-foreground">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-normal">{tCommon.loading}</td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-normal">{tSales.emptyOrders}</td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-slate-500/10 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-primary">{order.orderCode}</td>
                    <td className="p-3.5">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {order.customerName || tSales.guestRetailCustomer}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-medium text-primary text-sm">
                      {(order.total ?? 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-3.5">{getStatusBadge(order.status)}</td>
                    <td className="p-3.5 text-right space-x-2">
                      {canCreateInvoice && (
                        <Button 
                          id={idx === 0 ? "tour-sales-order-invoice-btn" : undefined}
                          variant="outline"
                          onClick={() => handleViewOrPrintInvoice(order)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 transition-all ${
                            order.hasInvoice
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20'
                              : 'bg-card text-primary border border-emerald-500/30 hover:bg-emerald-500/10'
                          }`}
                          title={order.hasInvoice ? (language === 'vi' ? 'Xem / In lại hóa đơn đã xuất' : 'Reprint invoice') : (language === 'vi' ? 'Xuất hóa đơn' : 'Create invoice')}
                        >
                          {order.hasInvoice ? (
                            <>
                              <Printer className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Xem / In lại HĐ' : 'Reprint Invoice'}</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" />
                              <span>{tSales.btnCreateInvoice}</span>
                            </>
                          )}
                        </Button>
                      )}

                      {order.status === 'Pending' && (
                        <>
                          {canUpdateOrder && (
                            <Button variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'Completed')}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-[11px] shadow-sm hover:scale-105 transition-all cursor-pointer"
                            >
                              {tSales.btnApproveOrder}
                            </Button>
                          )}
                          {canCancelOrder && (
                            <Button 
                              id="tour-manager-void-order-btn"
                              variant="outline"
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3 py-1.5 rounded-xl text-rose-500 hover:text-rose-600 border border-rose-500/30 bg-card hover:bg-rose-500/10 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              title={language === 'vi' ? 'Thẩm quyền Quản lý: Hủy đơn và hoàn tồn kho' : 'Manager Authority: Void order and restore inventory'}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {language === 'vi' ? 'Hủy đơn' : 'Cancel'}
                            </Button>
                          )}
                        </>
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

      {/* Printable K80 Receipt Modal */}
      {activeReceipt && (
        <PosK80Receipt
          orderId={activeReceipt.orderId}
          customerName={activeReceipt.customerName}
          customerPhone={activeReceipt.customerPhone}
          items={activeReceipt.items}
          subtotal={activeReceipt.subtotal}
          discount={activeReceipt.discount}
          total={activeReceipt.total}
          paymentMethod={activeReceipt.paymentMethod}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
