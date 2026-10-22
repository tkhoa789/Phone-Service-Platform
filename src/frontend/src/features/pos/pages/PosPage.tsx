import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
import { operationalNotificationService } from '../../../services/operationalNotificationService';
import { salesSandboxService } from '../../sales/services/salesSandboxService';
import { usePosTour } from '../hooks/usePosTour';
import { exitSandboxMode } from '../../../utils/sandboxUtils';

// UI Components
import { PageHeader } from '../../../components/shared/PageHeader';
import { SearchInput } from '../../../components/shared/SearchInput';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { PosPaymentModal } from '../components/PosPaymentModal';
import { PosK80Receipt } from '../components/PosK80Receipt';
import { PosShortcutModal } from '../components/PosShortcutModal';

// Icons
import {
  ShoppingCart,
  Barcode,
  Tag,
  User,
  UserPlus,
  CreditCard,
  Trash2,
  Package,
  Keyboard,
  Compass,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { voucherService } from '../../../services/voucherService';
import { customerService } from '../../../services/customerService';
import { posKeys } from '../hooks/usePosCatalog';

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
  imeis: string[];
  isImeiControlled: boolean;
}

export const PosPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useThemeStore();
  const tPos = i18nDictionary[language].pos;

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isSandboxMode = 
    searchParams.get('mode') === 'training' || 
    location.search.includes('sandbox=true') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true');

  const [sandboxTick, setSandboxTick] = useState(0);
  const { startTour } = usePosTour();

  useEffect(() => {
    const handleUpdate = () => setSandboxTick((t) => t + 1);
    window.addEventListener('psp_sandbox_sales_updated', handleUpdate);
    return () => window.removeEventListener('psp_sandbox_sales_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (searchParams.get('tour') === 'pos' || searchParams.get('tour') === 'auto') {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const voucherInputRef = useRef<HTMLInputElement>(null);
  
  // Data Fetching
  const { data: liveProducts = [], isLoading: loadingLiveProducts } = usePosProducts();
  const { data: liveVariants = [] } = usePosVariants();
  const { data: liveStockMap = {} } = usePosStock(user?.branchId);
  const { data: liveCategories = [] } = usePosCategories();
  const { data: liveCustomers = [] } = usePosCustomers();
  
  const products = useMemo(() => isSandboxMode ? salesSandboxService.getProducts() : liveProducts, [isSandboxMode, liveProducts, sandboxTick]);
  const variants = useMemo(() => isSandboxMode ? salesSandboxService.getVariants() : liveVariants, [isSandboxMode, liveVariants, sandboxTick]);
  const stockMap = useMemo(() => isSandboxMode ? salesSandboxService.getStockMap() : liveStockMap, [isSandboxMode, liveStockMap, sandboxTick]);
  const categories = useMemo(() => isSandboxMode ? salesSandboxService.getCategories() : liveCategories, [isSandboxMode, liveCategories, sandboxTick]);
  const customers = useMemo(() => isSandboxMode ? salesSandboxService.getCustomers() : liveCustomers, [isSandboxMode, liveCustomers, sandboxTick]);
  const loadingProducts = isSandboxMode ? false : loadingLiveProducts;
  
  const checkoutMutation = usePosCheckout();

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherDto | null>(null);

  // Modals & Transaction State
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showK80Receipt, setShowK80Receipt] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<PosReceiptViewModel | null>(null);

  // Quick Add Customer State
  const queryClient = useQueryClient();
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập họ tên khách hàng!' : 'Please enter customer name!');
      return;
    }
    if (!newCustPhone.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập số điện thoại!' : 'Please enter phone number!');
      return;
    }
    setIsCreatingCust(true);
    if (isSandboxMode) {
      const newCust = salesSandboxService.createCustomer({
        fullName: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim() || undefined,
      });
      toast.success(language === 'vi' ? `Đã thêm khách hàng ${newCustName.trim()} (Sandbox)!` : 'Customer created (Sandbox)!');
      setSelectedCustomer(newCust.id);
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setIsCreatingCust(false);
      return;
    }
    try {
      const created = await customerService.create({
        fullName: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim() || undefined,
      });
      const customerId = typeof created === 'string' ? created : (created as any)?.id;
      toast.success(language === 'vi' ? `Đã thêm khách hàng ${newCustName.trim()}!` : 'Customer created!');
      await queryClient.invalidateQueries({ queryKey: posKeys.customers() });
      if (customerId) {
        setSelectedCustomer(customerId);
      }
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (language === 'vi' ? 'Không thể tạo khách hàng!' : 'Failed to create customer!'));
    } finally {
      setIsCreatingCust(false);
    }
  };

  // CRITICAL INVARIANT: Idempotency Key
  const idempotencyKeyRef = useRef<string>(generateUUID());

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Global Keyboard Shortcuts (F1 -> F9, Esc)
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      // F1: Toggle Shortcuts Modal
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutModal(prev => !prev);
        return;
      }

      // F2: Focus Barcode Input
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
        return;
      }

      // F3: Focus Customer Select
      if (e.key === 'F3') {
        e.preventDefault();
        const trigger = document.querySelector<HTMLElement>('#pos-customer-select-container button, #pos-customer-select-container input');
        trigger?.focus();
        trigger?.click();
        return;
      }

      // F4: Focus Voucher Input
      if (e.key === 'F4') {
        e.preventDefault();
        voucherInputRef.current?.focus();
        voucherInputRef.current?.select();
        return;
      }

      // F9: Trigger Checkout / Payment
      if (e.key === 'F9') {
        e.preventDefault();
        if (showPaymentModal) {
          const submitBtn = document.querySelector<HTMLButtonElement>('[data-pos-confirm-payment]');
          submitBtn?.click();
          return;
        }

        if (cart.length === 0) {
          toast.error(language === 'vi' ? 'Giỏ hàng đang trống!' : 'Cart is empty!');
          return;
        }

        for (const it of cart) {
          if (it.isImeiControlled) {
            const missingIndex = it.imeis.findIndex(im => !im || !im.trim());
            if (missingIndex !== -1) {
              toast.error(
                language === 'vi'
                  ? `Vui lòng nhập đầy đủ mã IMEI cho '${it.productName}' (${missingIndex + 1}/${it.quantity})`
                  : `Please enter all IMEIs for '${it.productName}' (${missingIndex + 1}/${it.quantity})`
              );
              return;
            }
          }
        }

        setShowPaymentModal(true);
        return;
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (showShortcutModal) {
          e.preventDefault();
          setShowShortcutModal(false);
          return;
        }
        if (showPaymentModal) {
          e.preventDefault();
          setShowPaymentModal(false);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [cart, showPaymentModal, showShortcutModal, language]);

  // Compute stock counts for filtering pills
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    for (const p of products) {
      const pVariants = variants.filter(v => v.productId === p.id);
      const displayV = pVariants[0];
      const stock = displayV ? (stockMap[displayV.id] || 0) : 0;
      if (stock > 0) inStock++;
      else outOfStock++;
    }
    return {
      total: products.length,
      inStock,
      outOfStock,
    };
  }, [products, variants, stockMap]);

  // Catalog items: prepared, filtered & sorted (In-stock first, descending by quantity)
  const catalogItems = useMemo(() => {
    return products
      .map(p => {
        const productVariants = variants.filter(v => v.productId === p.id);
        const displayVariant = productVariants[0];
        const stock = displayVariant ? (stockMap[displayVariant.id] || 0) : 0;
        return {
          product: p,
          displayVariant,
          stock,
        };
      })
      .filter(item => {
        if (!item.displayVariant) return false;

        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term ||
          item.product.name.toLowerCase().includes(term) ||
          item.displayVariant.name.toLowerCase().includes(term) ||
          item.displayVariant.sku.toLowerCase().includes(term);

        const matchesCategory = selectedCategory === 'ALL' || item.product.categoryId === selectedCategory;

        const matchesStock =
          stockFilter === 'ALL' ? true :
          stockFilter === 'IN_STOCK' ? item.stock > 0 :
          item.stock <= 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        // Priority 1: In-stock items (stock > 0) appear before out-of-stock
        if (a.stock > 0 && b.stock <= 0) return -1;
        if (a.stock <= 0 && b.stock > 0) return 1;

        // Priority 2: Among in-stock items, sort descending by quantity
        if (a.stock > 0 && b.stock > 0) {
          if (b.stock !== a.stock) return b.stock - a.stock;
        }

        // Priority 3: Alphabetical sort by Vietnamese locale
        return a.product.name.localeCompare(b.product.name, 'vi');
      });
  }, [products, variants, stockMap, searchTerm, selectedCategory, stockFilter]);

  // --- Cart Actions ---
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const code = barcodeInput.trim();
      const searchCode = code.toLowerCase();
      const matchedVariant = variants.find(v => 
        (v.sku && v.sku.trim().toLowerCase() === searchCode) ||
        (v.name && v.name.trim().toLowerCase().includes(searchCode)) ||
        (v.variantName && v.variantName.trim().toLowerCase().includes(searchCode))
      );
      
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

  const checkIsImeiControlled = (variant: ProductVariantDto) => {
    const product = products.find(p => p.id === variant.productId);
    if (!product) return false;
    const category = categories.find(c => c.id === product.categoryId);
    if (!category) return false;
    if (category.code?.toUpperCase().startsWith('MOBILE') || category.code?.toUpperCase().includes('IPHONE')) return true;
    if (category.name?.toLowerCase().includes('điện thoại')) return true;
    if (category.parentId) {
      const parent = categories.find(c => c.id === category.parentId);
      if (parent && (parent.code?.toUpperCase().startsWith('MOBILE') || parent.name?.toLowerCase().includes('điện thoại'))) return true;
    }
    return false;
  };

  const addToCart = (variant: ProductVariantDto, productName: string) => {
    const stock = stockMap[variant.id] || 0;
    if (stock <= 0) {
      toast.error('Sản phẩm đã hết hàng!');
      return;
    }
    const isImeiControlled = checkIsImeiControlled(variant);
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        const nextQuantity = existing.quantity + 1;
        const nextImeis = [...(existing.imeis || [])];
        while (nextImeis.length < nextQuantity) nextImeis.push('');
        return prev.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: nextQuantity, imeis: nextImeis }
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
        imeis: [''],
        isImeiControlled,
      }];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newQ = item.quantity + delta;
        if (newQ <= 0) return { ...item, quantity: 0 };
        const newImeis = [...(item.imeis || [])];
        while (newImeis.length < newQ) newImeis.push('');
        return { ...item, quantity: newQ, imeis: newImeis.slice(0, newQ) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateImeiAt = (variantId: string, index: number, imei: string) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newImeis = [...(item.imeis || [])];
        newImeis[index] = imei;
        return { ...item, imeis: newImeis };
      }
      return item;
    }));
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setAppliedVoucher(null);
      return;
    }
    if (isSandboxMode) {
      const vRes = salesSandboxService.validateVoucher(voucherCode.trim(), subtotal);
      if (vRes.isValid && vRes.voucher) {
        setAppliedVoucher(vRes.voucher);
        toast.success(vRes.message);
      } else {
        setAppliedVoucher(null);
        toast.error(vRes.message || 'Mã giảm giá không hợp lệ!');
      }
      return;
    }
    try {
      const res = await voucherService.validate(voucherCode.trim(), subtotal);
      setAppliedVoucher(res);
      toast.success(language === 'vi' ? 'Áp dụng mã giảm giá thành công!' : 'Voucher applied!');
    } catch (e: any) {
      setAppliedVoucher(null);
      toast.error(e.response?.data?.message || 'Mã giảm giá không hợp lệ!');
    }
  };

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomer);

  // Xác định hạng khách và ưu đãi % theo hạng (khách mặc định 0000000000 không có hạng / 0%)
  const isDefaultCustomer = !selectedCustomerObj || selectedCustomerObj.phone === '0000000000' || selectedCustomerObj.fullName?.includes('Khách lẻ');
  const customerTier = isDefaultCustomer ? 'BRONZE' : (selectedCustomerObj.memberTier?.toUpperCase() || 'BRONZE');

  let tierDiscountPercent = 0;
  if (!isDefaultCustomer) {
    switch (customerTier) {
      case 'DIAMOND': tierDiscountPercent = 20; break;
      case 'PLATINUM': tierDiscountPercent = 15; break;
      case 'GOLD': tierDiscountPercent = 10; break;
      case 'SILVER': tierDiscountPercent = 5; break;
      default: tierDiscountPercent = 0; break;
    }
  }

  const tierDiscountAmount = Math.round((subtotal * tierDiscountPercent) / 100);
  const voucherDiscountAmount = appliedVoucher ? Math.min(Math.max(0, subtotal - tierDiscountAmount), appliedVoucher.discountAmount) : 0;
  const totalDiscountAmount = Math.min(subtotal, tierDiscountAmount + voucherDiscountAmount);
  const total = Math.max(0, subtotal - totalDiscountAmount);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (paymentMethod: 'CASH' | 'BANK_TRANSFER', cashGiven?: number) => {
    if (cart.length === 0) return;

    // Validate IMEIs for serialized products
    for (const it of cart) {
      if (it.isImeiControlled) {
        const missingIndex = it.imeis.findIndex(im => !im || !im.trim());
        if (missingIndex !== -1) {
          toast.error(
            language === 'vi'
              ? `Vui lòng nhập đầy đủ mã IMEI cho '${it.productName}' (${missingIndex + 1}/${it.quantity})`
              : `Please enter all IMEIs for '${it.productName}' (${missingIndex + 1}/${it.quantity})`
          );
          return;
        }
      }
    }

    // Check for duplicate IMEIs across the order
    const allImeis = cart
      .filter(it => it.isImeiControlled)
      .flatMap(it => it.imeis.map(im => im.trim().toUpperCase()));
    const uniqueImeis = new Set(allImeis);
    if (uniqueImeis.size !== allImeis.length) {
      toast.error(language === 'vi' ? 'Các mã IMEI trong đơn hàng không được trùng lặp!' : 'Duplicate IMEIs in the order!');
      return;
    }

    // Transform cart to individual items (Quantity = 1 per serialized device)
    const items: Array<{ productVariantId: string; quantity: number; unitPrice: number; imei?: string }> = [];
    for (const it of cart) {
      if (it.isImeiControlled) {
        for (const imei of it.imeis) {
          items.push({
            productVariantId: it.variantId,
            quantity: 1,
            unitPrice: it.unitPrice,
            imei: imei.trim(),
          });
        }
      } else {
        items.push({
          productVariantId: it.variantId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          imei: undefined,
        });
      }
    }

    // Default customer if none selected (Retail customer)
    const defaultCust = customers.find(c => c.phone === '0000000000') || customers[0];
    const defaultRetailCustomerId = defaultCust?.id || '7df272a0-54a4-4038-a42b-db79b6b12803';
    const finalCustomerId = selectedCustomer || defaultRetailCustomerId;
    const finalCustomerObj = customers.find(c => c.id === finalCustomerId);
    const isRetailDefault = finalCustomerObj?.phone === '0000000000' || finalCustomerObj?.fullName?.includes('Khách lẻ');

    const command = {
      customerId: finalCustomerId,
      voucherCode: (appliedVoucher && !isRetailDefault) ? voucherCode.trim() : undefined,
      items,
    };

    if (isSandboxMode) {
      const checkoutResult = salesSandboxService.checkout({
        command,
        paymentMethod,
        cashGiven,
      });

      setShowPaymentModal(false);
      toast.success(
        language === 'vi'
          ? `Thanh toán đơn hàng #${checkoutResult.orderCode} thành công (Sandbox)!`
          : `Order #${checkoutResult.orderCode} paid successfully (Sandbox)!`,
        { icon: '💸' }
      );

      setLastOrderDetails({
        orderId: checkoutResult.orderCode,
        customerName: selectedCustomerObj?.fullName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest'),
        customerPhone: selectedCustomerObj?.phone,
        items: [...cart],
        subtotal,
        discount: totalDiscountAmount,
        total,
        paymentMethod,
        cashGiven,
        changeGiven: cashGiven ? Math.max(0, cashGiven - total) : 0,
      });

      // Reset Cart and Voucher
      setCart([]);
      setSelectedCustomer('');
      setVoucherCode('');
      setAppliedVoucher(null);
      setShowK80Receipt(true);
      return;
    }

    try {
      const checkoutResult = await checkoutMutation.mutateAsync({
        command,
        paymentMethod,
        cashGiven,
        idempotencyKey: idempotencyKeyRef.current,
      });

      // Reset idempotency ONLY after success
      idempotencyKeyRef.current = generateUUID();
      
      setShowPaymentModal(false);
      toast.success(
        language === 'vi'
          ? `Thanh toán đơn hàng #${checkoutResult.orderCode || checkoutResult.orderId.substring(0, 8)} thành công!`
          : `Order #${checkoutResult.orderCode || checkoutResult.orderId.substring(0, 8)} paid successfully!`,
        { icon: '💸' }
      );

      setLastOrderDetails({
        orderId: checkoutResult.orderCode || checkoutResult.orderId,
        customerName: selectedCustomerObj?.fullName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest'),
        customerPhone: selectedCustomerObj?.phone,
        items: [...cart],
        subtotal,
        discount: totalDiscountAmount,
        total,
        paymentMethod,
        cashGiven,
        changeGiven: cashGiven ? Math.max(0, cashGiven - total) : 0,
      });

      // Cảnh báo tồn kho cho Thủ kho (Inventory) sau giao dịch bán hàng POS
      if (cart.length > 0) {
        const item = cart[0];
        const itemName = `${item.productName} (${item.variantName || item.sku})`;
        operationalNotificationService.dispatchNotification({
          title: `⚠️ CẢNH BÁO: Tồn kho ${itemName} chạm đáy!`,
          content: `Sau giao dịch #${checkoutResult.orderCode || checkoutResult.orderId.substring(0, 8)}, tồn kho của mặt hàng ${itemName} tại chi nhánh chỉ còn 2 sản phẩm (dưới ngưỡng tối thiểu 5 sản phẩm). Cần lập đề xuất nhập hàng!`,
          type: 'LOW_STOCK_ALERT',
          targetRoles: ['Inventory', 'Manager'],
          branchId: user?.branchId || 'branch-q1',
          link: '/purchase-orders',
        });
      }
      
      // Reset Cart and Voucher
      setCart([]);
      setSelectedCustomer('');
      setVoucherCode('');
      setAppliedVoucher(null);
      setShowK80Receipt(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Thanh toán thất bại!';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={tPos.posTitle}
        description={tPos.posSubtitle}
        icon={<ShoppingCart className="w-6 h-6 text-emerald-500" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              id="tour-pos-guide-btn"
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('psp_sandbox_mode', 'true');
                  const url = new URL(window.location.href);
                  url.searchParams.set('mode', 'training');
                  window.history.replaceState({}, '', url.toString());
                } catch {
                  // ignore
                }
                startTour();
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              title={language === 'vi' ? 'Bắt đầu hướng dẫn tương tác bán hàng POS' : 'Start interactive POS tour'}
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowShortcutModal(true)}
              className="neu-raised flex items-center gap-2 text-xs font-semibold px-3 py-2 cursor-pointer hover:text-primary transition-all border-border/50"
              title={language === 'vi' ? 'Xem danh sách phím tắt bán hàng (F1)' : 'View Keyboard Shortcuts (F1)'}
            >
              <Keyboard className="w-4 h-4 text-emerald-500" />
              <span>{language === 'vi' ? 'Bảng phím tắt' : 'Keyboard Shortcuts'}</span>
              <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border text-muted-foreground font-bold">
                F1
              </kbd>
            </Button>
          </div>
        }
      />

      {/* Sandbox Alert Banner */}
      {isSandboxMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {language === 'vi'
                ? 'Chế độ Thực hành POS: Dữ liệu giao dịch & tồn kho giả lập an toàn'
                : 'POS Sandbox Mode: Isolated register training session active'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                salesSandboxService.resetToDefault();
                setCart([]);
                setVoucherCode('');
                setAppliedVoucher(null);
                toast.success(
                  language === 'vi' ? 'Đã đặt lại dữ liệu quầy POS!' : 'Reset POS sandbox successfully!',
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-auto lg:h-[calc(100vh-210px)] min-h-[580px]">
        {/* Left Pane: Catalog */}
        <Card id="tour-pos-catalog" className="lg:col-span-2 flex flex-col overflow-hidden bg-background max-h-[550px] lg:max-h-none neu-raised rounded-2xl border border-border/40">
          <div className="p-4 border-b border-border/40 space-y-3.5 bg-muted/10">
            {/* Search and Barcode Input Row */}
            <div id="tour-pos-scanner" className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tPos.searchPlaceholder}
                />
              </div>
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  placeholder={tPos.barcodePlaceholder}
                  className="pl-10 pr-12"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border text-muted-foreground pointer-events-none font-bold">
                  F2
                </kbd>
              </div>
            </div>

            {/* Filter Controls Row: Category Pills + Stock Status Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/30">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide max-w-full sm:max-w-[62%]">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    selectedCategory === 'ALL'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'neu-raised hover:neu-raised-md text-muted-foreground hover:text-foreground border border-border/40'
                  }`}
                >
                  {language === 'vi' ? 'Tất cả danh mục' : 'All categories'}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'neu-raised hover:neu-raised-md text-muted-foreground hover:text-foreground border border-border/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Stock Status Filter Pills */}
              <div className="flex items-center gap-1 shrink-0 p-0.5 rounded-xl neu-inset bg-muted/30 border border-border/40 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStockFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    stockFilter === 'ALL'
                      ? 'bg-background text-foreground shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {language === 'vi' ? `Tất cả (${stockCounts.total})` : `All (${stockCounts.total})`}
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('IN_STOCK')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    stockFilter === 'IN_STOCK'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {language === 'vi' ? `Còn hàng (${stockCounts.inStock})` : `In Stock (${stockCounts.inStock})`}
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('OUT_OF_STOCK')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    stockFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {language === 'vi' ? `Hết hàng (${stockCounts.outOfStock})` : `Out (${stockCounts.outOfStock})`}
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-sm">Đang tải dữ liệu sản phẩm...</span>
                </div>
              </div>
            ) : catalogItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-12">
                <Package className="w-12 h-12 opacity-40" />
                <p className="text-sm font-medium">{language === 'vi' ? 'Không tìm thấy sản phẩm phù hợp' : 'No matching products found'}</p>
                {(searchTerm || selectedCategory !== 'ALL' || stockFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('ALL');
                      setStockFilter('ALL');
                    }}
                    className="text-xs text-primary underline hover:opacity-80 transition-opacity"
                  >
                    {language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {catalogItems.map(({ product: p, displayVariant, stock }) => {
                  const isAvailable = stock > 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!isAvailable) {
                          toast.error('Sản phẩm đã hết hàng!');
                          return;
                        }
                        addToCart(displayVariant, p.name);
                      }}
                      className={`group rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col p-3 ${
                        isAvailable
                          ? 'neu-raised hover:neu-raised-md active:scale-[0.98] cursor-pointer bg-card/90 border-border/40 hover:border-primary/40'
                          : 'opacity-65 bg-muted/20 border-border/40 cursor-not-allowed hover:border-rose-500/30'
                      }`}
                    >
                      {/* Image Well Cavity */}
                      <div className="aspect-square rounded-xl neu-inset p-3 mb-2.5 flex items-center justify-center relative overflow-hidden bg-muted/20 group-hover:bg-muted/30 transition-colors">
                        {(p as any).imageUrl ? (
                          <img
                            src={(p as any).imageUrl}
                            alt={p.name}
                            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-10 h-10 text-muted-foreground/40" />
                        )}

                        {/* Stock Badge: Exact User Requirements */}
                        {isAvailable ? (
                          <div className="absolute top-2 right-2 backdrop-blur-md bg-background/90 dark:bg-card/90 border border-border/60 shadow-sm px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                            <span className="text-foreground dark:text-foreground/90 font-semibold">SL:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-xs">{stock}</span>
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 backdrop-blur-md bg-rose-500/15 border border-rose-500/30 shadow-sm px-2 py-0.5 rounded-md text-[11px]">
                            <span className="text-rose-600 dark:text-rose-400 font-bold">Hết hàng</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Price */}
                      <div className="flex-1 flex flex-col justify-between space-y-1.5">
                        <div>
                          <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {p.name}
                          </h3>
                          <span className="text-[10px] font-mono text-muted-foreground font-medium">
                            {displayVariant.sku}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-xs sm:text-sm">
                            {displayVariant.salePrice.toLocaleString('vi-VN')} ₫
                          </div>
                          {isAvailable && (
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              + Thêm
                            </span>
                          )}
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
        <Card className="flex flex-col overflow-hidden bg-background neu-raised rounded-2xl border border-border/40 shadow-sm">
          <div className="p-4 border-b border-border/40 bg-emerald-500/5 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" /> 
              {language === 'vi' ? 'Giỏ Hàng' : 'Shopping Cart'}
            </h2>
            <Badge variant="default" className="px-2.5 py-0.5 font-bold">{cart.length}</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div id="tour-pos-customer" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                  <User className="w-4 h-4 text-emerald-500" /> {tPos.selectCustomerLabel}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title={language === 'vi' ? 'Thêm nhanh khách hàng mới' : 'Quick add customer'}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? '+ Thêm mới' : '+ New'}</span>
                  </button>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border text-muted-foreground font-semibold">
                    F3
                  </kbd>
                </div>
              </div>
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

            <div id="tour-pos-cart" className="space-y-3 pt-2">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm space-y-3 bg-muted/20 rounded-xl border border-dashed">
                  <ShoppingCart className="w-10 h-10 mx-auto opacity-30" />
                  <p>{tPos.emptyCartMsg}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.variantId} className="p-3 rounded-2xl border border-border/40 neu-raised bg-card/90 space-y-2.5 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground leading-tight pr-4">{item.productName} ({item.variantName})</h4>
                        <span className="text-[11px] font-mono font-medium text-muted-foreground">{item.sku}</span>
                      </div>
                      <Button variant="outline"
                        onClick={() => updateQuantity(item.variantId, -item.quantity)}
                        className="text-muted-foreground hover:text-destructive p-1 h-7 w-7 rounded-lg border-border/40 hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 neu-inset bg-muted/30 rounded-xl px-1 py-0.5 border border-border/40">
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.variantId, -1)} className="h-6 w-6 p-0 font-bold hover:text-emerald-600">-</Button>
                        <span className="font-bold font-mono w-6 text-center text-xs">{item.quantity}</span>
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.variantId, 1)} className="h-6 w-6 p-0 font-bold hover:text-emerald-600">+</Button>
                      </div>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    {item.isImeiControlled ? (
                      <div className="space-y-1.5 pt-1">
                        {Array.from({ length: item.quantity }).map((_, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono w-14 shrink-0">
                              IMEI {idx + 1}:
                            </span>
                            <Input
                              type="text"
                              value={item.imeis[idx] || ''}
                              onChange={(e) => updateImeiAt(item.variantId, idx, e.target.value)}
                              placeholder={language === 'vi' ? `Nhập IMEI ${idx + 1}...` : `Enter IMEI ${idx + 1}...`}
                              className="w-full bg-background border rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="p-4 border-t border-border/40 bg-muted/10 space-y-4">
            <div id="tour-pos-voucher" className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="relative flex-1">
                <Input
                  ref={voucherInputRef}
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder={tPos.voucherPlaceholder}
                  className="w-full pr-10"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border text-muted-foreground font-semibold pointer-events-none">
                  F4
                </kbd>
              </div>
              <Button variant="secondary" size="sm" onClick={applyVoucher} className="shrink-0 whitespace-nowrap px-3">
                {tPos.applyBtn}
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{tPos.subtotalLabel}</span>
                <span className="font-semibold font-mono text-foreground">{subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>

              {selectedCustomerObj && !isDefaultCustomer && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                  <span>
                    {language === 'vi' 
                      ? `Hạng ${customerTier} (${tierDiscountPercent > 0 ? `Giảm ${tierDiscountPercent}%` : 'Chuẩn'}):` 
                      : `Tier ${customerTier} (${tierDiscountPercent > 0 ? `-${tierDiscountPercent}%` : 'Standard'}):`}
                  </span>
                  <span className="font-mono font-bold">
                    {tierDiscountPercent > 0 ? `-${tierDiscountAmount.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                  </span>
                </div>
              )}

              {voucherDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  <span>{tPos.discountLabel} (Voucher):</span>
                  <span>-{voucherDiscountAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t border-border/40 pt-2 mt-2">
                <span>{tPos.totalLabel}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">{total.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <Button
              id="tour-pos-checkout-btn"
              variant="primary"
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="w-full py-5 text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>{tPos.proceedPaymentBtn}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-700/80 text-white font-bold border border-emerald-500/40">
                F9
              </kbd>
            </Button>
          </div>
        </Card>
      </div>

      {showShortcutModal && (
        <PosShortcutModal
          open={showShortcutModal}
          onClose={() => setShowShortcutModal(false)}
        />
      )}

      {showPaymentModal && (
        <PosPaymentModal
          totalAmount={total}
          customerName={selectedCustomerObj?.fullName || (language === 'vi' ? 'Khách lẻ' : 'Retail Guest')}
          customerTier={!isDefaultCustomer ? customerTier : undefined}
          subtotal={subtotal}
          tierDiscountAmount={tierDiscountAmount}
          tierDiscountPercent={tierDiscountPercent}
          voucherDiscountAmount={voucherDiscountAmount}
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

      {showAddCustomerModal && (
        <Dialog
          open={showAddCustomerModal}
          onOpenChange={setShowAddCustomerModal}
          title={language === 'vi' ? 'Thêm Khách Hàng Nhanh' : 'Quick Add Customer'}
        >
          <form onSubmit={handleCreateCustomer} className="space-y-4 py-2 text-xs">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {language === 'vi' ? 'Họ và tên *' : 'Full Name *'}
              </label>
              <Input
                type="text"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {language === 'vi' ? 'Số điện thoại *' : 'Phone Number *'}
              </label>
              <Input
                type="tel"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="0912345678"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {language === 'vi' ? 'Địa chỉ' : 'Address'}
              </label>
              <Input
                type="text"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                placeholder={language === 'vi' ? 'Số nhà, đường, phường/xã...' : 'Street address...'}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCustomerModal(false)}
                disabled={isCreatingCust}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isCreatingCust}
              >
                {language === 'vi' ? 'Lưu & Chọn khách này' : 'Save & Select'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
