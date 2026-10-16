import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useSystemStore } from '../../../stores/systemStore';
import { useAuthStore } from '../../../stores/authStore';
import { useBranchStore } from '../../../stores/branchStore';
import { useBranches } from '../../branches/hooks/useBranches';

interface PosK80ReceiptProps {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{ productName?: string; variantName?: string; name?: string; quantity: number; unitPrice: number; imei?: string }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  cashGiven?: number;
  changeGiven?: number;
  onClose: () => void;
}

export const PosK80Receipt: React.FC<PosK80ReceiptProps> = ({
  orderId,
  customerName,
  customerPhone,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  cashGiven,
  changeGiven,
  onClose,
}) => {
  const { settings } = useSystemStore();
  const { user, roles } = useAuthStore();
  const { activeBranchId, activeBranchName, activeBranchAddress, activeBranchPhone } = useBranchStore();

  const targetBranchId = user?.branchId || (activeBranchId !== 'all' ? activeBranchId : undefined);
  const { data: branches = [] } = useBranches(Boolean((!activeBranchAddress || !activeBranchPhone) && targetBranchId));
  const matchedBranch = branches.find(b => b.id === targetBranchId);

  const displayBranchName = activeBranchName || matchedBranch?.name || user?.branchName || 'Chi nhánh mặc định';
  const displayAddress = activeBranchAddress || user?.branchAddress || matchedBranch?.address || settings.storeAddress || 'Trụ sở chính';
  const displayPhone = activeBranchPhone || user?.branchPhone || matchedBranch?.phone || settings.storePhone || '0901 234 567';

  const handlePrint = () => {
    window.print();
  };

  // Fallback to active logged in user role if customer is demo/retail
  const displayCustomerName =
    customerName && customerName !== 'Khách bán lẻ' && customerName !== 'Khách vãng lai'
      ? customerName
      : `Khách lẻ [Thu ngân: ${user?.fullName || 'Admin'} - ${roles[0] || 'Sales'}]`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header Control Buttons */}
        <div className="flex items-center justify-between no-print border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-bold text-sm text-white">Thanh Toán Hoàn Tất</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white h-8 w-8">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* K80 Thermal Receipt Container */}
        <div id="k80-receipt" className="bg-white text-black p-5 rounded-xl font-mono text-xs space-y-4 shadow-lg border border-slate-300">
          <div className="text-center space-y-1">
            <h2 className="font-extrabold text-sm tracking-wider uppercase">{settings.systemName || 'PSP PLATFORM ENTERPRISE'}</h2>
            <h3 className="font-bold text-xs uppercase">{displayBranchName}</h3>
            <p className="text-[10px] text-slate-700">ĐC: {displayAddress}</p>
            <p className="text-[10px] text-slate-700">Hotline: {displayPhone} | Website: www.phoneserviceplatform.vn</p>
            <div className="border-b border-dashed border-black my-2" />
            <h3 className="font-bold text-sm uppercase">HÓA ĐƠN BÁN HÀNG (K80)</h3>
            <p className="text-[10px]">Mã đơn: #{orderId.substring(0, 8).toUpperCase()}</p>
            <p className="text-[10px]">Ngày: {new Date().toLocaleString('vi-VN')}</p>
          </div>

          <div className="space-y-1 border-t border-b border-dashed border-black py-2 text-[11px]">
            <p><span className="font-bold">Khách hàng:</span> {displayCustomerName}</p>
            {customerPhone && <p><span className="font-bold">SĐT:</span> {customerPhone}</p>}
            <p><span className="font-bold">HT Thanh toán:</span> {paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}</p>
            <p><span className="font-bold">Thu ngân:</span> {user?.fullName || 'Admin'}</p>
          </div>

          {/* Items Table */}
          <div className="space-y-2 text-[11px]">
            <div className="grid grid-cols-12 font-bold border-b border-black pb-1">
              <span className="col-span-6">Mặt Hàng</span>
              <span className="col-span-2 text-center">SL</span>
              <span className="col-span-4 text-right">Thành Tiền</span>
            </div>

            {items.map((it, idx) => {
              const itemName = it.productName
                ? `${it.productName} (${it.variantName || ''})`
                : it.name || 'Sản phẩm';
              return (
                <div key={idx} className="space-y-0.5 border-b border-slate-200 pb-1">
                  <div className="grid grid-cols-12 font-medium">
                    <span className="col-span-6 truncate">{itemName}</span>
                    <span className="col-span-2 text-center">{it.quantity}</span>
                    <span className="col-span-4 text-right">{(it.quantity * it.unitPrice).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {it.imei && <p className="text-[9px] text-slate-600">IMEI: {it.imei}</p>}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Giảm giá Voucher:</span>
                <span>-{discount.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm border-t border-black pt-1">
              <span>TỔNG CỘNG:</span>
              <span>{total.toLocaleString('vi-VN')} ₫</span>
            </div>
            {paymentMethod === 'CASH' && cashGiven !== undefined && (
              <>
                <div className="flex justify-between text-[10px] text-slate-600 border-t border-slate-300 pt-1">
                  <span>Tiền khách đưa:</span>
                  <span className="font-bold text-black">{cashGiven.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Tiền thừa thối khách:</span>
                  <span className="text-black font-extrabold">{(changeGiven || 0).toLocaleString('vi-VN')} ₫</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-3 border-t border-dashed border-black space-y-1">
            <p className="font-bold text-[10px]">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
            <p className="text-[9px] text-slate-600">Bảo hành chính hãng 12 tháng tại {settings.systemName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 no-print">
          <Button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" /> In Hóa Đơn (K80)
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl font-semibold text-xs transition-all"
          >
            Hoàn tất
          </Button>
        </div>
      </div>
    </div>
  );
};
