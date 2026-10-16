import React, { useState } from 'react';
import { Search, Wrench, ShieldCheck, AlertCircle, Headphones, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const OrderTrackingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSubmittedQuery(searchTerm.trim());
    setSearched(true);
  };

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
            Tra Cứu Tiến Độ Sửa Chữa & Bảo Hành 📱
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Nhập Mã phiếu sửa (SC-...), Số IMEI hoặc Số điện thoại để tra cứu thông tin
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
              placeholder="Nhập Mã phiếu SC-..., Số IMEI hoặc Số điện thoại..."
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 shadow-[inset_3px_3px_8px_#cbd5e1,inset_-3px_-3px_8px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              required
            />
          </div>
          <Button variant="outline"
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0"
          >
            Tra Cứu
          </Button>
        </form>

        {/* Truthful Search Notice */}
        {searched ? (
          <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200/80 shadow-[6px_6px_16px_#cbd5e1,-6px_-6px_16px_#ffffff] space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Cổng tra cứu trực tuyến đang được nâng cấp đồng bộ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Để đảm bảo bảo mật thông tin khách hàng và tính chính xác cao nhất theo thời gian thực, cổng tra cứu công cộng tự phục vụ cho mã <strong className="font-mono text-slate-800 font-bold">{submittedQuery}</strong> đang được đồng bộ hóa an toàn với hệ thống kỹ thuật chi nhánh.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quý khách vui lòng liên hệ trực tiếp hotline hoặc mang phiếu tiếp nhận đến quầy kỹ thuật tại chi nhánh tiếp nhận máy để được hỗ trợ kiểm tra tiến độ ngay lập tức.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Headphones className="w-4 h-4 text-rose-500" />
                <span>Hotline hỗ trợ: <strong className="text-rose-600">1900 8888</strong> (8h00 - 21h00)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>Quầy tiếp nhận: Tất cả các chi nhánh hệ thống PSP</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200/80 shadow-[6px_6px_16px_#cbd5e1,-6px_-6px_16px_#ffffff] space-y-3 text-xs text-slate-600">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Hướng dẫn tra cứu bảo hành & sửa chữa
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Mã phiếu sửa chữa bắt đầu bằng tiền tố SC (ví dụ: SC-2026...) được in trên biên nhận tiếp nhận máy.</li>
              <li>Số IMEI gồm 15 chữ số có thể tìm thấy trong cài đặt máy hoặc trên khay SIM thiết bị.</li>
              <li>Mọi thông tin tiến độ sửa chữa, thay thế linh kiện đều được quản lý tập trung và bảo mật.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
