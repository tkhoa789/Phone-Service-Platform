import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { i18nDictionary } from '../../../locales/dictionary';

// React Query hooks from POS Feature
import {
  usePosProducts,
  usePosVariants,
  usePosCategories,
  usePosCustomers,
} from '../hooks/usePosCatalog';
import { usePosCheckout } from '../hooks/usePosCheckout';
import { usePosStock } from '../hooks/usePosStock';
import { useValidateVoucher } from '../hooks/usePosCatalog'; // actually I'll manually call validate to avoid unneeded renders

// UI Components
import { PageHeader } from '../../../components/shared/PageHeader';
import { SearchInput } from '../../../components/shared/SearchInput';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { PosPaymentModal } from '../components/PosPaymentModal';
import { PosK80Receipt } from '../components/PosK80Receipt';

// Icons
import {
  ShoppingCart,
  Barcode,
  Tag,
  User,
  CreditCard,
  Trash2,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { voucherService } from '../../../services/voucherService';

// Types
import type { VoucherDto, ProductVariantDto } from '../../../types/api.types';
import { Input } from '@/components/ui/Input';
import { generateUUID } from '../../../utils/uuid';


interface PosReceiptViewModel {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  cashGiven?: number;
  changeGiven?: number;
}

interface CartItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  imei?: string;
}

export const PosPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useThemeStore();
  const tPos = i18nDictionary[language].pos;

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Data Fetching
  const { data: products = [], isLoading: loadingProducts } = usePosProducts();
  const { data: variants = [] } = usePosVariants();
  const { data: stockMap = {} } = usePosStock(user?.branchId);
  const { data: categories = [] } = usePosCategories();
  const { data: customers = [] } = usePosCustomers();
  
  const checkoutMutation = usePosCheckout();

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherDto | null>(null);

  // Modals & Transaction State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showK80Receipt, setShowK80Receipt] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<PosReceiptViewModel | null>(null);

  // CRITICAL INVARIANT: Idempotency Key
  const idempotencyKeyRef = useRef<string>(generateUUID());

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // --- Filtering ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Cart Actions ---
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const code = barcodeInput.trim();
      const matchedVariant = variants.find(v => v.sku === code || v.sku === code);
      
      if (matchedVariant) {
        const product = products.find(p => p.id === matchedVariant.productId);
        addToCart(matchedVariant, product?.name || 'Sản phẩm');
        setBarcodeInput('');
        toast.success(`Đã thêm ${product?.name} (${matchedVariant.name})`);
      } else {
        toast.error(`Không tìm thấy sản phẩm mã: ${code}`);
      }
    }
  };

  const addToCart = (variant: ProductVariantDto, productName: string) => {
    const stock = stockMap[variant.id] || 0;
    if (stock <= 0) {
      toast.error('Sản phẩm đã hết hàng!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        return prev.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        variantId: variant.id,
        productName,
        variantName: variant.name,
        sku: variant.sku,
        unitPrice: variant.salePrice,
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateImei = (variantId: string, imei: string) => {
    setCart(prev => prev.map(item => 
      item.variantId === variantId ? { ...item, imei } : item
    ));
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setAppliedVoucher(null);
      return;
    }
    try {
      const res = await voucherService.validate(voucherCode);
      setAppliedVoucher(res);
      toast.success(language === 'vi' ? 'Áp dụng mã giảm giá thành công!' : 'Voucher applied!');
    } catch (e: any) {
      setAppliedVoucher(null);
      toast.error(e.response?.data?.message || 'Mã giảm giá không hợp lệ!');
    }
  };

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  let discountAmount = 0;
  if (appliedVoucher) {
    if (true) discountAmount = appliedVoucher!.discountAmount;
    else discountAmount = Math.floor((subtotal * appliedVoucher!.discountAmount) / 100);
    
    if (false) {
      discountAmount = appliedVoucher!.discountAmount;
    }
  }
  const total = Math.max(0, subtotal - discountAmount);

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomer);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (paymentMethod: 'CASH' | 'BANK_TRANSFER', cashGiven?: number) => {
    const command = {
      customerId: selectedCustomer || "",
      voucherCode: appliedVoucher ? voucherCode.trim() : undefined,
      items: cart.map(item => ({
        productVariantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        imei: item.imei || undefined,
      })),
    };

    const orderId = await checkoutMutation.mutateAsync({
      command,
      idempotencyKey: idempotencyKeyRef.current
    });

    // Reset idempotency ONLY after success
    idempotencyKeyRef.current = generateUUID();
    
    setShowPaymentModal(false);
    toast.success(
      language === 'vi'
        ? `Thanh toán đơn hàng #${orderId.substring(0, 8)} thành công!`
        : `Order #${orderId.substring(0, 8)} paid successfully!`,
      { icon: '💸' }
    );

    setLastOrderDetails({
      orderId,
      customerName: selectedCustomerObj?.fullName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest'),
      customerPhone: selectedCustomerObj?.phone,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      cashGiven,
      changeGiven: cashGiven ? Math.max(0, cashGiven - total) : 0,
    });
    
    // Reset Cart
    setCart([]);
    setSelectedCustomer('');
    setVoucherCode('');
    setAppliedVoucher(null);
    setShowK80Receipt(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPos.posTitle}
        description={tPos.posSubtitle}
        icon={<ShoppingCart className="w-6 h-6 text-emerald-500" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Left Pane: Catalog */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden bg-background">
          <div className="p-4 border-b border-border space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tPos.searchPlaceholder}
                />
              </div>
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  placeholder={tPos.barcodePlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Badge
                variant={selectedCategory === 'ALL' ? 'default' : 'info'}
                className="cursor-pointer whitespace-nowrap px-3 py-1"
                onClick={() => setSelectedCategory('ALL')}
              >
                {language === 'vi' ? 'Tất cả' : 'All'}
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'info'}
                  className="cursor-pointer whitespace-nowrap px-3 py-1"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Đang tải dữ liệu sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                <Package className="w-12 h-12 opacity-50" />
                <p>{language === 'vi' ? 'Không tìm thấy sản phẩm' : 'No products found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => {
                  const productVariants = variants.filter(v => v.productId === p.id);
                  const displayVariant = productVariants[0];
                  if (!displayVariant) return null;

                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(displayVariant, p.name)}
                      className="group cursor-pointer rounded-xl border bg-card hover:border-emerald-500/50 hover:shadow-md transition-all overflow-hidden flex flex-col"
                    >
                      <div className="aspect-square bg-muted/30 p-4 flex items-center justify-center relative">
                        {(p as any).imageUrl || "" ? (
                          <img src={(p as any).imageUrl || ""} alt={p.name} className="object-contain w-full h-full group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package className="w-12 h-12 text-muted-foreground/30" />
                        )}
                        <span className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-sm">
                          { (stockMap[displayVariant.id] || 0) > 0 ? `SL: ${stockMap[displayVariant.id] || 0}` : 'Hết hàng' }
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="font-medium text-sm line-clamp-2 leading-tight">{p.name}</h3>
                        <div className="mt-2 text-emerald-600 font-bold text-sm">
                          {displayVariant.salePrice.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right Pane: Cart */}
        <Card className="flex flex-col overflow-hidden bg-background border-emerald-500/20 shadow-sm">
          <div className="p-4 border-b border-border bg-emerald-500/5">
            <h2 className="font-semibold flex items-center gap-2 text-emerald-700">
              <ShoppingCart className="w-5 h-5" /> 
              {language === 'vi' ? 'Giỏ Hàng' : 'Shopping Cart'}
              <Badge variant="default" className="ml-auto">{cart.length}</Badge>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                <User className="w-4 h-4 text-emerald-500" /> {tPos.selectCustomerLabel}
              </label>
              <SearchableSelect
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.fullName,
                  sublabel: c.phone ? `SĐT: ${c.phone}` : 'SĐT: N/A',
                }))}
                value={selectedCustomer}
                onChange={(val) => setSelectedCustomer(val as string)}
                placeholder={language === 'vi' ? '-- Khách lẻ --' : '-- Retail Guest --'}
                searchPlaceholder={language === 'vi' ? 'Tìm tên hoặc SĐT...' : 'Search name or phone...'}
              />
            </div>

            <div className="space-y-3 pt-2">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm space-y-3 bg-muted/20 rounded-xl border border-dashed">
                  <ShoppingCart className="w-10 h-10 mx-auto opacity-30" />
                  <p>{tPos.emptyCartMsg}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.variantId} className="p-3 rounded-xl border bg-card shadow-sm space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground leading-tight pr-4">{item.productName} ({item.variantName})</h4>
                        <span className="text-[11px] font-mono font-bold text-muted-foreground">{item.sku}</span>
                      </div>
                      <Button variant="outline"
                        onClick={() => updateQuantity(item.variantId, -item.quantity)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-muted rounded-md px-1 py-0.5 border">
                        <Button variant="outline" onClick={() => updateQuantity(item.variantId, -1)} className="px-2 font-bold hover:text-emerald-600">-</Button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" onClick={() => updateQuantity(item.variantId, 1)} className="px-2 font-bold hover:text-emerald-600">+</Button>
                      </div>
                      <span className="font-medium text-emerald-600">
                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <Input
                      type="text"
                      value={item.imei || ''}
                      onChange={(e) => updateImei(item.variantId, e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập IMEI...' : 'Enter IMEI...'}
                      className="w-full bg-background border rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="p-4 border-t border-border bg-muted/10 space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
              <Input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder={tPos.voucherPlaceholder}
                className="flex-1 bg-background border rounded-md px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button variant="secondary" size="sm" onClick={applyVoucher}>
                {tPos.applyBtn}
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{tPos.subtotalLabel}</span>
                <span className="font-medium text-foreground">{subtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>{tPos.discountLabel}</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>{tPos.totalLabel}</span>
                <span className="text-emerald-600">{total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="w-full py-6 text-base"
            >
              <CreditCard className="w-5 h-5 mr-2" /> {tPos.proceedPaymentBtn}
            </Button>
          </div>
        </Card>
      </div>

      {showPaymentModal && (
        <PosPaymentModal
          totalAmount={total}
          customerName={selectedCustomerObj?.fullName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest')}
          onConfirmPayment={handleConfirmPayment}
          onClose={() => setShowPaymentModal(false)}
          isSubmitting={checkoutMutation.isPending}
        />
      )}

      {showK80Receipt && lastOrderDetails && (
        <PosK80Receipt
          orderId={lastOrderDetails.orderId}
          customerName={lastOrderDetails.customerName}
          customerPhone={lastOrderDetails.customerPhone}
          items={lastOrderDetails.items}
          subtotal={lastOrderDetails.subtotal}
          discount={lastOrderDetails.discount}
          total={lastOrderDetails.total}
          paymentMethod={lastOrderDetails.paymentMethod}
          cashGiven={lastOrderDetails.cashGiven}
          changeGiven={lastOrderDetails.changeGiven}
          onClose={() => setShowK80Receipt(false)}
        />
      )}
    </div>
  );
};
