import React, { useState } from 'react';
import { Search, Wrench, ShieldCheck, Clock, CheckCircle2, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const OrderTrackingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearched(true);
    // Demo real-time repair order tracking matching Lê Tuấn Khoa sample
    if (searchTerm.includes('09') || searchTerm.includes('356') || searchTerm.includes('SC')) {
      setSearchResult({
        orderCode: 'SC-20260804-001',
        customerName: 'Nguyễn Văn Anh',
        phone: '0901234567',
        deviceModel: 'iPhone 13 Pro Max',
        serialImei: '356890123456789',
        issueDescription: 'Ép kính màn hình + Thay Pin dung lượng cao',
        cosmeticCondition: 'Trầy nhẹ viền góc dưới, kính vỡ nát góc trên',
        depositAmount: 500000,
        totalCost: 1850000,
        remainingAmount: 1350000,
        status: 'InRepair',
        statusText: 'Đang sửa chữa tại xưởng kỹ thuật',
        technicianName: 'KTV Trần Văn Tuấn',
        receivedDate: '04/08/2026 09:30',
        expectedDate: '04/08/2026 17:00',
        timeline: [
          { time: '09:30 04/08', title: 'Tiếp nhận máy tại quầy', done: true },
          { time: '10:15 04/08', title: 'Kỹ thuật viên chẩn đoán lỗi & báo giá', done: true },
          { time: '11:00 04/08', title: 'Đang ép kính & thay pin mới', done: true },
          { time: 'Dự kiến 17:00', title: 'Hoàn tất sửa chữa & Kiểm tra chức năng', done: false },
          { time: 'Chưa giao', title: 'Bàn giao trả máy cho khách', done: false },
        ],
      });
    } else {
      setSearchResult(null);
    }
  };

  const formatCurrency = (val: number) => `${val.toLocaleString('vi-VN')} ₫`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="outline"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
        </Button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 shadow-[6px_6px_16px_#cbd5e1,-6px_-6px_16px_#ffffff] mx-auto flex items-center justify-center text-rose-500">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            Tra Cứu Tiến Độ Sửa Chữa & Bảo Hành Real-time 📱
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Nhập Mã phiếu sửa (SC-...), Số IMEI hoặc Số điện thoại để kiểm tra tiến độ máy trực tiếp tại cửa hàng
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="p-4 rounded-3xl bg-slate-100 shadow-[6px_6px_16px_#cbd5e1,-6px_-6px_16px_#ffffff] border border-slate-200/80 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập Mã phiếu SC-..., Số IMEI (356...) hoặc Số điện thoại..."
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 shadow-[inset_3px_3px_8px_#cbd5e1,inset_-3px_-3px_8px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              required
            />
          </div>
          <Button variant="outline"
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0"
          >
            Tra Cứu Ngay
          </Button>
        </form>

        {/* Search Result */}
        {searched && (
          searchResult ? (
            <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200/80 shadow-[6px_6px_16px_#cbd5e1,-6px_-6px_16px_#ffffff] space-y-6">
              {/* Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider font-mono">Mã Phiếu: {searchResult.orderCode}</span>
                  <h3 className="font-heading font-extrabold text-xl text-slate-900">{searchResult.deviceModel}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">IMEI: {searchResult.serialImei}</p>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" /> {searchResult.statusText}
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                  <span className="font-bold text-slate-500">Khách Hàng:</span>
                  <p className="font-bold text-slate-900 text-sm">{searchResult.customerName} ({searchResult.phone})</p>
                  <p className="text-slate-600">Ngày gửi máy: {searchResult.receivedDate}</p>
                  <p className="text-rose-600 font-semibold">Dự kiến hoàn thành: {searchResult.expectedDate}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                  <span className="font-bold text-slate-500">Chi Phí Sửa Chữa:</span>
                  <p className="text-slate-700">Tổng chi phí: <strong className="text-slate-900">{formatCurrency(searchResult.totalCost)}</strong></p>
                  <p className="text-emerald-700 font-semibold">Đã đặt cọc: {formatCurrency(searchResult.depositAmount)}</p>
                  <p className="text-rose-600 font-bold text-sm">Còn lại phải thu: {formatCurrency(searchResult.remainingAmount)}</p>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-500" /> Tiến Độ Xử Lý Ca Máy:
                </h4>
                <div className="space-y-2">
                  {searchResult.timeline.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 flex justify-between">
                        <span className={`font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{step.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-100 border border-slate-200/80 shadow-[6px_6px_16px_#cbd5e1,-6px_-6px_16px_#ffffff] text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
              <h3 className="font-heading font-bold text-base text-slate-900">Không tìm thấy thông tin ca sửa chữa!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Vui lòng kiểm tra lại Mã phiếu SC-..., Số IMEI hoặc Số điện thoại đã đăng ký tại cửa hàng.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
