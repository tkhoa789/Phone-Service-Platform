import React, { useState } from 'react';
import { serviceService } from '../../services/serviceService';
import {
  Smartphone,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const PublicWarrantyCheckPage: React.FC = () => {
  const [imei, setImei] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imei.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await serviceService.checkWarrantyStatus(imei.trim());
      setResult(data);
    } catch (err: any) {
      setError('Không tìm thấy thông tin bảo hành cho mã số IMEI này hoặc máy đã hết hạn bảo hành.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Đăng nhập Hệ thống
          </Link>
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Cổng Tra Cứu Công Khai
          </span>
        </div>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-white tracking-tight flex items-center justify-center gap-2">
            Tra Cứu Bảo Hành Thiết Bị PSP <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400">
            Nhập chuỗi 15 số IMEI trên vỏ hộp hoặc cài đặt điện thoại để kiểm tra thời hạn bảo hành 12 tháng.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              placeholder="Ví dụ: 358921104829102"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <Button variant="outline"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Đang tra cứu trên hệ thống...' : 'Tra cứu Trạng thái Bảo hành'}
          </Button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-mono font-bold text-white text-sm">IMEI: {result.imei}</span>
              <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đang bảo hành
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-400 block text-[11px]">Tên sản phẩm:</span>
                <span className="font-semibold text-white">{result.productName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Khách hàng:</span>
                <span className="font-semibold text-white">{result.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Mã đơn mua hàng:</span>
                <span className="font-mono text-slate-200">{result.salesOrderCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời hạn 12 tháng:</span>
                <span className="font-semibold text-emerald-400">Còn hiệu lực</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
