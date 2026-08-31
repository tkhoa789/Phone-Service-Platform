import React, { useState } from 'react';
import { Truck, CheckCircle2, Clock, MapPin, ArrowRightLeft, User, Phone, Printer, PackageCheck, Search, Filter } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';

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
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SHIPPING' | 'COMPLETED'>('ALL');

  const [mockTickets, setMockTickets] = useState([
    {
      id: 'TR-240801', code: 'TR-240801', createdAt: '24/08/2026 14:30', status: 'SHIPPING',
      fromBranch: 'Trụ sở chính (HQ)', toBranch: 'Chi nhánh Quận 1', driverName: 'Nguyễn Văn Giao', driverPhone: '0901.234.567', licensePlate: '51C-123.45', note: 'Chuyển hàng iPhone 13 gấp',
      items: [ { sku: 'IP13-128-BLK', variantName: 'iPhone 13 Đen 128GB', quantity: 5 }, { sku: 'IP13-256-WHT', variantName: 'iPhone 13 Trắng 256GB', quantity: 2 } ]
    },
    {
      id: 'TR-240728', code: 'TR-240728', createdAt: '28/07/2026 09:15', status: 'COMPLETED',
      fromBranch: 'Chi nhánh Thủ Đức', toBranch: 'Trụ sở chính (HQ)', driverName: 'Lê Tài Xế', driverPhone: '0988.777.666', licensePlate: '59D-987.65', note: 'Hoàn trả hàng bảo hành',
      items: [ { sku: 'SS-S23-256', variantName: 'Samsung Galaxy S23 256GB', quantity: 1 } ]
    }
  ]);

  const filteredTickets = mockTickets.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchTerm && !t.code.toLowerCase().includes(searchTerm.toLowerCase()) && !t.fromBranch.toLowerCase().includes(searchTerm.toLowerCase()) && !t.toBranch.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleReceiveStock = (ticketId: string, ticketCode: string) => {
    setMockTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'COMPLETED' } : t));
    toast.success(
      language === 'vi'
        ? `Kho đích đã xác nhận nhận đủ hàng cho phiếu [${ticketCode}]! Tồn kho đã được cập nhật.`
        : `Destination warehouse confirmed receipt for [${ticketCode}]!`,
      { icon: '✅' }
    );
    onRefreshInventory();
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={language === 'vi' ? 'Theo Dõi Luân Chuyển (Transfer Tracker)' : 'Transfer Tracker'}
      description={language === 'vi' ? 'Quản lý và xác nhận trạng thái các chuyến xe luân chuyển hàng hóa nội bộ.' : 'Track and confirm internal stock transfers.'}
      className="max-w-4xl h-[85vh] flex flex-col"
    >
      <div className="flex flex-col h-full gap-4 pt-4 min-h-0">
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Input
            
            placeholder={language === 'vi' ? 'Tìm theo mã phiếu, kho xuất, kho nhập...' : 'Search transfer tickets...'}
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="ALL">🌐 {language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
              <option value="SHIPPING">🚚 {language === 'vi' ? 'Đang giao hàng (Shipping)' : 'Shipping'}</option>
              <option value="COMPLETED">✅ {language === 'vi' ? 'Kho Đích Đã Nhận (Completed)' : 'Completed'}</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {language === 'vi' ? 'Không tìm thấy phiếu chuyển kho phù hợp' : 'No matching transfer tickets'}
            </div>
          ) : (
            filteredTickets.map((t) => (
              <Card key={t.id} className="p-4 flex flex-col gap-4 bg-white border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-primary">{t.code}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {t.createdAt}
                    </span>
                  </div>
                  <div>
                    {t.status === 'SHIPPING' ? (
                      <Badge variant="warning" className="animate-pulse">
                        <Truck className="w-3.5 h-3.5 mr-1" /> {language === 'vi' ? 'Đang Giao Hàng' : 'Shipping'}
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {language === 'vi' ? 'Kho Đích Đã Nhận' : 'Completed'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" /> {language === 'vi' ? 'Lộ Trình Luân Chuyển:' : 'Route:'}
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="bg-white px-2 py-1 rounded border border-slate-200">{t.fromBranch}</span>
                      <ArrowRightLeft className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-primary font-bold bg-primary/5 px-2 py-1 rounded border border-primary/20">{t.toBranch}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" /> {language === 'vi' ? 'Thông Tin Shipper:' : 'Driver Info:'}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-800">
                      <span>👤 {t.driverName}</span>
                      <span className="text-primary font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {t.driverPhone}
                      </span>
                      <span className="text-slate-500 font-mono">🚙 {t.licensePlate}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">📦 {language === 'vi' ? 'Sản Phẩm' : 'Items'} ({t.items.length})</span>
                    <span className="text-slate-500">Ghi chú: {t.note}</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 border-b border-slate-100 text-xs">
                      <tr>
                        <th className="p-2 pl-3">Mã SKU</th>
                        <th className="p-2">Tên Sản Phẩm</th>
                        <th className="p-2 pr-3 text-right">SL Chuyển</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {t.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 pl-3 font-mono text-primary font-bold">{item.sku}</td>
                          <td className="p-2 font-medium text-slate-800">{item.variantName}</td>
                          <td className="p-2 pr-3 text-right font-mono font-bold text-primary">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      toast.success(`Đã in Giấy Bàn Giao Vận Chuyển [${t.code}] cho tài xế ${t.driverName}!`, { icon: '📄' });
                      window.print();
                    }}
                    
                  >
                    {language === 'vi' ? 'In Giấy Giao Hàng' : 'Print Waybill'}
                  </Button>

                  {t.status === 'SHIPPING' && (
                    <Button
                      type="button"
                      onClick={() => handleReceiveStock(t.id, t.code)}
                      
                    >
                      {language === 'vi' ? 'Kho Đích Nhận Hàng' : 'Confirm Receipt'}
                    </Button>
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
