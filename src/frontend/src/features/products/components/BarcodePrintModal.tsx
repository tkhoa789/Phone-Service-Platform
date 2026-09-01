import React, { useState } from 'react';
import { X, Printer, Barcode, QrCode, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface BarcodePrintModalProps {
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  onClose: () => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  productName,
  variantName,
  sku,
  price,
  onClose,
}) => {
  const { language } = useThemeStore();
  const [printQty, setPrintQty] = useState(2);
  const [labelSize, setLabelSize] = useState('50x30'); // Standard thermal label 50mm x 30mm

  const handlePrint = () => {
    toast.success(
      language === 'vi'
        ? `Đã gửi lệnh in ${printQty} tem mã vạch [${sku}] tới máy in tem Xprinter!`
        : `Sent ${printQty} barcode label jobs for [${sku}] to thermal printer!`,
      { icon: '🖨️' }
    );
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl p-6 border border-border/50 shadow-md space-y-5 text-foreground animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-400/20 pb-3">
          <h3 className="font-heading font-medium text-base text-foreground flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <span>{language === 'vi' ? 'In Tem Mã Vạch Barcode / QR Label' : 'Print Barcode / QR Label'}</span>
          </h3>
          <Button variant="outline" onClick={onClose} className="p-1.5 rounded-xl bg-card text-slate-400 hover:text-foreground shadow-sm transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Real Label Thermal Sticker Live Preview Box */}
        <div className="p-4 rounded-2xl bg-white text-slate-900 border-2 border-dashed border-slate-400 shadow-inner flex flex-col items-center justify-center space-y-2 select-none print:m-0 print:border-none">
          <div className="text-center font-bold text-xs leading-tight tracking-tight uppercase text-slate-950">
            {productName}
          </div>
          <div className="text-[11px] text-slate-700 font-medium">{variantName}</div>

          {/* Simulated Code-128 Barcode & QR Code */}
          <div className="w-full py-1.5 flex items-center justify-center gap-3 bg-slate-100 rounded-lg px-2 border border-slate-300">
            <div className="flex flex-col items-center">
              {/* SVG Code-128 Barcode Simulation */}
              <svg className="h-10 w-36" viewBox="0 0 140 40">
                <rect x="5" y="0" width="2" height="30" fill="#000" />
                <rect x="9" y="0" width="1" height="30" fill="#000" />
                <rect x="13" y="0" width="3" height="30" fill="#000" />
                <rect x="19" y="0" width="1" height="30" fill="#000" />
                <rect x="23" y="0" width="4" height="30" fill="#000" />
                <rect x="30" y="0" width="2" height="30" fill="#000" />
                <rect x="35" y="0" width="1" height="30" fill="#000" />
                <rect x="39" y="0" width="3" height="30" fill="#000" />
                <rect x="45" y="0" width="2" height="30" fill="#000" />
                <rect x="50" y="0" width="4" height="30" fill="#000" />
                <rect x="57" y="0" width="1" height="30" fill="#000" />
                <rect x="61" y="0" width="3" height="30" fill="#000" />
                <rect x="67" y="0" width="2" height="30" fill="#000" />
                <rect x="72" y="0" width="1" height="30" fill="#000" />
                <rect x="76" y="0" width="4" height="30" fill="#000" />
                <rect x="83" y="0" width="2" height="30" fill="#000" />
                <rect x="88" y="0" width="1" height="30" fill="#000" />
                <rect x="92" y="0" width="3" height="30" fill="#000" />
                <rect x="98" y="0" width="2" height="30" fill="#000" />
                <rect x="103" y="0" width="4" height="30" fill="#000" />
                <rect x="110" y="0" width="1" height="30" fill="#000" />
                <rect x="114" y="0" width="3" height="30" fill="#000" />
                <rect x="120" y="0" width="2" height="30" fill="#000" />
                <rect x="125" y="0" width="4" height="30" fill="#000" />
                <text x="70" y="38" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#000">
                  {sku}
                </text>
              </svg>
            </div>

            <div className="border-l border-slate-300 pl-2 flex flex-col items-center">
              <QrCode className="w-8 h-8 text-slate-900" />
              <span className="text-[9px] font-mono font-bold text-slate-700">QR POS</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full pt-1 px-1 border-t border-slate-200">
            <span className="text-[10px] font-mono text-slate-600 font-bold">Mã SKU: {sku}</span>
            <span className="font-bold text-xs text-emerald-800 font-mono">{price.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        {/* Print Options Form */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-foreground font-medium block mb-1">
              {language === 'vi' ? 'Kích Thước Tem Nhãn *' : 'Label Size *'}
            </label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value)}
              className="w-full bg-card border border-slate-300/40 rounded-xl px-3 py-2 text-xs text-foreground shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="50x30">Standard Thermal (50mm x 30mm)</option>
              <option value="35x22">Jewelry/Phone Sticker (35mm x 22mm)</option>
              <option value="A4">A4 Sticker Sheet (3x10 Labels)</option>
            </select>
          </div>

          <div>
            <label className="text-foreground font-medium block mb-1">
              {language === 'vi' ? 'Số Lượng Tem Cần In *' : 'Print Quantity *'}
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={printQty}
              onChange={(e) => setPrintQty(Number(e.target.value))}
              className="w-full bg-card border border-slate-300/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-card text-muted-foreground hover:text-foreground font-medium shadow-sm active:shadow-inner border border-border/50 bg-muted/20 transition-all cursor-pointer text-xs"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
          <Button variant="outline"
            type="button"
            onClick={handlePrint}
            className="flex-[2] py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'vi' ? `In ${printQty} Tem Ngay` : `Print ${printQty} Labels`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
