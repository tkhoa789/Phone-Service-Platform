import React, { useState, useEffect, useCallback } from 'react';
import { Truck, CheckCircle2, Clock, MapPin, ArrowRightLeft, Search, Filter, Ban, RefreshCw, Send, PackageCheck } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { inventoryService } from '../services/inventory.service';
import type { WarehouseTransferDto } from '../../../types/api.types';

interface TransferTrackerModalProps {
  onClose: () => void;
  onRefreshInventory: () => void;
}

export const TransferTrackerModal: React.FC<TransferTrackerModalProps> = ({
  onClose,
  onRefreshInventory,
}) => {
  const { language } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [transfers, setTransfers] = useState<WarehouseTransferDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getTransfers();
      setTransfers(data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || (language === 'vi' ? 'Không thể tải danh sách phiếu điều chuyển.' : 'Failed to load transfers.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const filteredTickets = transfers.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const matchCode = t.code.toLowerCase().includes(lower);
      const matchFrom = (t.fromWarehouseName || '').toLowerCase().includes(lower);
      const matchTo = (t.toWarehouseName || '').toLowerCase().includes(lower);
      if (!matchCode && !matchFrom && !matchTo) return false;
    }
    return true;
  });

  const handleShipStock = async (ticketId: string, ticketCode: string) => {
    setActionLoadingId(ticketId);
    try {
      await inventoryService.shipTransfer(ticketId, { id: ticketId });
      toast.success(
        language === 'vi'
          ? `Phiếu [${ticketCode}] đã xuất kho & chuyển sang trạng thái Đang Vận Chuyển!`
          : `Transfer [${ticketCode}] has been shipped (InTransit)!`,
        { icon: '🚚' }
      );
      await loadTransfers();
      onRefreshInventory();
    } catch (err: any) {
      const msg = err.response?.data?.message || (language === 'vi' ? 'Xuất giao hàng thất bại.' : 'Failed to ship transfer.');
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReceiveStock = async (ticketId: string, ticketCode: string) => {
    setActionLoadingId(ticketId);
    try {
      await inventoryService.receiveTransfer(ticketId, { id: ticketId });
      toast.success(
        language === 'vi'
          ? `Kho đích đã xác nhận nhận đủ hàng cho phiếu [${ticketCode}]! Tồn kho đã được cập nhật.`
          : `Destination warehouse confirmed receipt for [${ticketCode}]! Stock updated.`,
        { icon: '✅' }
      );
      await loadTransfers();
      onRefreshInventory();
    } catch (err: any) {
      const msg = err.response?.data?.message || (language === 'vi' ? 'Nhận hàng thất bại.' : 'Failed to receive transfer.');
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelTransfer = async (ticketId: string, ticketCode: string) => {
    setActionLoadingId(ticketId);
    try {
      await inventoryService.cancelTransfer(ticketId);
      toast.success(
        language === 'vi'
          ? `Đã hủy phiếu điều chuyển [${ticketCode}]!`
          : `Cancelled transfer [${ticketCode}]!`,
        { icon: '🚫' }
      );
      await loadTransfers();
      onRefreshInventory();
    } catch (err: any) {
      const msg = err.response?.data?.message || (language === 'vi' ? 'Hủy phiếu điều chuyển thất bại.' : 'Failed to cancel transfer.');
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="warning">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {language === 'vi' ? 'Chờ Xuất Kho' : 'Pending'}
          </Badge>
        );
      case 'InTransit':
        return (
          <Badge variant="warning" className="animate-pulse bg-amber-500 text-white border-amber-600">
            <Truck className="w-3.5 h-3.5 mr-1" />
            {language === 'vi' ? 'Đang Giao Hàng' : 'In Transit'}
          </Badge>
        );
      case 'Received':
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {language === 'vi' ? 'Kho Đích Đã Nhận' : 'Received'}
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="danger">
            <Ban className="w-3.5 h-3.5 mr-1" />
            {language === 'vi' ? 'Đã Hủy' : 'Cancelled'}
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={language === 'vi' ? 'Theo Dõi Luân Chuyển (Transfer Tracker)' : 'Transfer Tracker'}
      description={language === 'vi' ? 'Quản lý và xác nhận trạng thái các phiếu điều chuyển hàng hóa nội bộ.' : 'Track and confirm internal stock transfers.'}
      className="max-w-4xl h-[85vh] flex flex-col"
    >
      <div className="flex flex-col h-full gap-4 pt-4 min-h-0">
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Input
            placeholder={language === 'vi' ? 'Tìm theo mã phiếu, kho xuất, kho nhập...' : 'Search transfer tickets...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-card text-foreground border border-border/40 shadow-inset rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="ALL">🌐 {language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
              <option value="Pending">⏳ {language === 'vi' ? 'Chờ Xuất Kho (Pending)' : 'Pending'}</option>
              <option value="InTransit">🚚 {language === 'vi' ? 'Đang Giao Hàng (In Transit)' : 'In Transit'}</option>
              <option value="Received">✅ {language === 'vi' ? 'Kho Đích Đã Nhận (Received)' : 'Received'}</option>
              <option value="Cancelled">🚫 {language === 'vi' ? 'Đã Hủy (Cancelled)' : 'Cancelled'}</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={loadTransfers}
              disabled={loading}
              title={language === 'vi' ? 'Làm mới' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {loading && transfers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              {language === 'vi' ? 'Đang tải dữ liệu từ máy chủ...' : 'Loading transfers from server...'}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {language === 'vi' ? 'Không tìm thấy phiếu chuyển kho phù hợp.' : 'No matching transfer tickets.'}
            </div>
          ) : (
            filteredTickets.map((t) => (
              <Card key={t.id} className="p-4 flex flex-col gap-4 bg-card neu-raised border border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-primary">{t.code}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(t.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                  </div>
                  <div>
                    {renderStatusBadge(t.status)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border/40 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> {language === 'vi' ? 'Lộ Trình Luân Chuyển:' : 'Route:'}
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="bg-card text-foreground px-2.5 py-1 rounded-lg border border-border/40 shadow-inset font-semibold">
                      {t.fromWarehouseName || 'Kho xuất'}
                    </span>
                    <ArrowRightLeft className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      {t.toWarehouseName || 'Kho nhận'}
                    </span>
                  </div>
                </div>

                <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
                  <div className="px-3 py-2 bg-surface-elevated/70 border-b border-border/40 flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">📦 {language === 'vi' ? 'Sản Phẩm' : 'Items'} ({t.items.length})</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-elevated/70 text-muted-foreground border-b border-border/40 text-xs">
                      <tr>
                        <th className="p-2 pl-3">Mã SKU</th>
                        <th className="p-2">Tên Sản Phẩm</th>
                        <th className="p-2 pr-3 text-right">SL Chuyển</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {t.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-muted/20">
                          <td className="p-2 pl-3 font-mono text-primary font-bold">{item.sku}</td>
                          <td className="p-2 font-medium text-foreground">{item.variantName}</td>
                          <td className="p-2 pr-3 text-right font-mono font-bold text-primary">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {t.status === 'Pending' && (
                    <>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={actionLoadingId === t.id}
                        onClick={() => handleCancelTransfer(t.id, t.code)}
                      >
                        <Ban className="w-4 h-4 mr-1.5" />
                        {language === 'vi' ? 'Hủy Phiếu' : 'Cancel'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={actionLoadingId === t.id}
                        onClick={() => handleShipStock(t.id, t.code)}
                      >
                        <Send className="w-4 h-4 mr-1.5" />
                        {language === 'vi' ? 'Xuất Kho Giao Hàng' : 'Ship Transfer'}
                      </Button>
                    </>
                  )}

                  {t.status === 'InTransit' && (
                    <>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={actionLoadingId === t.id}
                        onClick={() => handleCancelTransfer(t.id, t.code)}
                      >
                        <Ban className="w-4 h-4 mr-1.5" />
                        {language === 'vi' ? 'Hủy Phiếu' : 'Cancel'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={actionLoadingId === t.id}
                        onClick={() => handleReceiveStock(t.id, t.code)}
                      >
                        <PackageCheck className="w-4 h-4 mr-1.5" />
                        {language === 'vi' ? 'Kho Đích Nhận Hàng' : 'Confirm Receipt'}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
};
