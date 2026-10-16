import type {
  SalesOrderDto,
  ProductDto,
  ProductVariantDto,
  CategoryDto,
  CustomerDto,
  VoucherDto,
  CreateSalesOrderCommand,
} from '../../../types/api.types';
import type { PosCheckoutResult } from '../../pos/hooks/usePosCheckout';
import { operationalNotificationService } from '../../../services/operationalNotificationService';

const SANDBOX_SALES_STORAGE_KEY = 'psp_sandbox_sales';

interface SandboxSalesData {
  orders: SalesOrderDto[];
  customers: CustomerDto[];
  stockMap: Record<string, number>;
  vouchers: VoucherDto[];
  products: ProductDto[];
  variants: ProductVariantDto[];
  categories: CategoryDto[];
}

const createInitialSandboxSalesData = (): SandboxSalesData => {
  const now = Date.now();
  const todayStr = new Date(now).toISOString();
  const twoHoursAgo = new Date(now - 2 * 3600 * 1000).toISOString();
  const fourHoursAgo = new Date(now - 4 * 3600 * 1000).toISOString();
  const yesterday = new Date(now - 24 * 3600 * 1000).toISOString();

  const categories: CategoryDto[] = [
    { id: 'cat-phone', code: 'CAT-PHONE', name: 'Điện Thoại Di Động', createdAt: yesterday },
    { id: 'cat-accessory', code: 'CAT-ACC', name: 'Phụ Kiện & Cáp Sạc', createdAt: yesterday },
    { id: 'cat-audio', code: 'CAT-AUDIO', name: 'Âm Thanh & Tai Nghe', createdAt: yesterday },
    { id: 'cat-screen', code: 'CAT-SCREEN', name: 'Kính Cường Lực & Bảo Vệ', createdAt: yesterday },
  ];

  const variants: ProductVariantDto[] = [
    {
      id: 'pv-ip15pm-256-nat',
      productId: 'prod-ip15pm',
      productName: 'iPhone 15 Pro Max 256GB',
      variantName: 'Titan Tự Nhiên',
      sku: 'IP15PM-256-NAT',
      name: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
      color: 'Titan Tự Nhiên',
      capacity: '256GB',
      costPrice: 26000000,
      salePrice: 28990000,
      createdAt: yesterday,
    },
    {
      id: 'pv-anker-65w',
      productId: 'prod-anker-65w',
      productName: 'Củ Sạc Anker GaN 65W 3 Cổng',
      variantName: 'Đen Mờ',
      sku: 'ANKER-65W-BLK',
      name: 'Củ Sạc Anker GaN 65W 3 Cổng - Đen',
      color: 'Đen',
      costPrice: 420000,
      salePrice: 650000,
      createdAt: yesterday,
    },
    {
      id: 'pv-case-mag-ip15',
      productId: 'prod-case-mag',
      productName: 'Ốp Lưng MagSafe Chống Sốc Trong Suốt',
      variantName: 'Trong Suốt',
      sku: 'CASE-IP15-MAG',
      name: 'Ốp Lưng MagSafe Chống Sốc Trong Suốt',
      color: 'Trong Suốt',
      costPrice: 80000,
      salePrice: 250000,
      createdAt: yesterday,
    },
    {
      id: 'pv-kingkong-ip15',
      productId: 'prod-kingkong',
      productName: 'Kính Cường Lực Kingkong Tự Dán Khung',
      variantName: 'Chuẩn HD',
      sku: 'GLAS-KINGKONG',
      name: 'Kính Cường Lực Kingkong Tự Dán Khung',
      costPrice: 45000,
      salePrice: 150000,
      createdAt: yesterday,
    },
    {
      id: 'pv-airpods-pro-2',
      productId: 'prod-airpods-pro-2',
      productName: 'Tai Nghe Apple AirPods Pro 2 USB-C',
      variantName: 'Trắng',
      sku: 'AIRPODS-PRO-2',
      name: 'Tai Nghe Apple AirPods Pro 2 USB-C',
      color: 'Trắng',
      costPrice: 4700000,
      salePrice: 5490000,
      createdAt: yesterday,
    },
    {
      id: 'pv-cable-c-to-c',
      productId: 'prod-cable-c',
      productName: 'Cáp Sạc Bọc Dù Type-C to Type-C 100W 1.2m',
      variantName: 'Xám Không Gian',
      sku: 'CABLE-C-100W',
      name: 'Cáp Sạc Bọc Dù Type-C to Type-C 100W',
      color: 'Xám',
      costPrice: 70000,
      salePrice: 190000,
      createdAt: yesterday,
    },
  ];

  const products: ProductDto[] = [
    {
      id: 'prod-ip15pm',
      categoryId: 'cat-phone',
      categoryName: 'Điện Thoại Di Động',
      brandId: 'brand-apple',
      brandName: 'Apple',
      code: 'IP15PM',
      name: 'iPhone 15 Pro Max 256GB',
      variants: [variants[0]],
      createdAt: yesterday,
    },
    {
      id: 'prod-anker-65w',
      categoryId: 'cat-accessory',
      categoryName: 'Phụ Kiện & Cáp Sạc',
      brandId: 'brand-anker',
      brandName: 'Anker',
      code: 'ANKER-65W',
      name: 'Củ Sạc Anker GaN 65W 3 Cổng',
      variants: [variants[1]],
      createdAt: yesterday,
    },
    {
      id: 'prod-case-mag',
      categoryId: 'cat-accessory',
      categoryName: 'Phụ Kiện & Cáp Sạc',
      brandId: 'brand-baseus',
      brandName: 'Baseus',
      code: 'CASE-MAG',
      name: 'Ốp Lưng MagSafe Chống Sốc Trong Suốt',
      variants: [variants[2]],
      createdAt: yesterday,
    },
    {
      id: 'prod-kingkong',
      categoryId: 'cat-screen',
      categoryName: 'Kính Cường Lực & Bảo Vệ',
      brandId: 'brand-wsken',
      brandName: 'Wsken',
      code: 'KINGKONG',
      name: 'Kính Cường Lực Kingkong Tự Dán Khung',
      variants: [variants[3]],
      createdAt: yesterday,
    },
    {
      id: 'prod-airpods-pro-2',
      categoryId: 'cat-audio',
      categoryName: 'Âm Thanh & Tai Nghe',
      brandId: 'brand-apple',
      brandName: 'Apple',
      code: 'AIRPODS-P2',
      name: 'Tai Nghe Apple AirPods Pro 2 USB-C',
      variants: [variants[4]],
      createdAt: yesterday,
    },
    {
      id: 'prod-cable-c',
      categoryId: 'cat-accessory',
      categoryName: 'Phụ Kiện & Cáp Sạc',
      brandId: 'brand-anker',
      brandName: 'Anker',
      code: 'CABLE-C',
      name: 'Cáp Sạc Bọc Dù Type-C to Type-C 100W 1.2m',
      variants: [variants[5]],
      createdAt: yesterday,
    },
  ];

  const stockMap: Record<string, number> = {
    'pv-ip15pm-256-nat': 5,
    'pv-anker-65w': 24,
    'pv-case-mag-ip15': 45,
    'pv-kingkong-ip15': 60,
    'pv-airpods-pro-2': 8,
    'pv-cable-c-to-c': 35,
  };

  const customers: CustomerDto[] = [
    {
      id: 'cust-demo-01',
      code: 'CUST-001',
      fullName: 'Anh Hoàng Nam (Học viên Demo)',
      phone: '0909123456',
      email: 'hoangnam.demo@gmail.com',
      address: 'Quận 1, TP. Hồ Chí Minh',
      rewardPoints: 120,
      totalSpent: 12500000,
      memberTier: 'Silver',
      createdAt: yesterday,
    },
    {
      id: 'cust-demo-02',
      code: 'CUST-002',
      fullName: 'Chị Ngọc Hân (VIP Gold)',
      phone: '0918765432',
      email: 'ngochan.vip@gmail.com',
      address: 'Quận 3, TP. Hồ Chí Minh',
      rewardPoints: 580,
      totalSpent: 45000000,
      memberTier: 'Gold',
      createdAt: yesterday,
    },
    {
      id: 'cust-demo-03',
      code: 'CUST-003',
      fullName: 'Nguyễn Văn Tuấn (Khách vãng lai)',
      phone: '0988112233',
      email: 'vantuan.retail@gmail.com',
      address: 'Bình Thạnh, TP. Hồ Chí Minh',
      rewardPoints: 10,
      totalSpent: 650000,
      memberTier: 'Standard',
      createdAt: todayStr,
    },
  ];

  const vouchers: VoucherDto[] = [
    {
      id: 'vouch-demo-10',
      promotionId: 'promo-demo-10',
      promotionCode: 'PROMO-SALES10',
      promotionName: 'Ưu Đãi Học Viên Bán Hàng 10%',
      code: 'SALES10',
      status: 'Active',
      discountAmount: 100000,
      minOrderValue: 200000,
      expiryDate: new Date(now + 30 * 24 * 3600 * 1000).toISOString(),
      usageLimit: 100,
      usageCount: 12,
      createdAt: yesterday,
    },
    {
      id: 'vouch-demo-50k',
      promotionId: 'promo-demo-50k',
      promotionCode: 'PROMO-TRIAN50K',
      promotionName: 'Tri Ân Khách Hàng Thân Thiết 50K',
      code: 'TRIAN50K',
      status: 'Active',
      discountAmount: 50000,
      minOrderValue: 200000,
      expiryDate: new Date(now + 15 * 24 * 3600 * 1000).toISOString(),
      usageLimit: 50,
      usageCount: 5,
      createdAt: yesterday,
    },
  ];

  const orders: SalesOrderDto[] = [
    {
      id: 'so-demo-01',
      code: 'SO-DEMO-01',
      orderCode: 'SO-DEMO-01',
      customerId: 'cust-demo-03',
      customerName: 'Nguyễn Văn Tuấn (Khách vãng lai)',
      customerPhone: '0988112233',
      userId: 'user-demo-sales',
      userFullName: 'Chuyên Viên Sales Demo',
      branchId: 'branch-demo-01',
      branchName: 'Chi nhánh Quận 1',
      status: 'Pending',
      subtotal: 650000,
      discount: 0,
      total: 650000,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
      hasInvoice: false,
      items: [
        {
          id: 'so-item-01',
          productVariantId: 'pv-anker-65w',
          productName: 'Củ Sạc Anker GaN 65W 3 Cổng',
          sku: 'ANKER-65W-BLK',
          quantity: 1,
          unitPrice: 650000,
          discount: 0,
          total: 650000,
        },
      ],
    },
    {
      id: 'so-demo-02',
      code: 'SO-DEMO-02',
      orderCode: 'SO-DEMO-02',
      customerId: 'cust-demo-01',
      customerName: 'Anh Hoàng Nam (Học viên Demo)',
      customerPhone: '0909123456',
      userId: 'user-demo-sales',
      userFullName: 'Chuyên Viên Sales Demo',
      branchId: 'branch-demo-01',
      branchName: 'Chi nhánh Quận 1',
      voucherCode: 'TRIAN50K',
      status: 'Pending',
      subtotal: 440000,
      discount: 50000,
      total: 390000,
      createdAt: fourHoursAgo,
      updatedAt: fourHoursAgo,
      hasInvoice: false,
      items: [
        {
          id: 'so-item-02a',
          productVariantId: 'pv-case-mag-ip15',
          productName: 'Ốp Lưng MagSafe Chống Sốc Trong Suốt',
          sku: 'CASE-IP15-MAG',
          quantity: 1,
          unitPrice: 250000,
          discount: 0,
          total: 250000,
        },
        {
          id: 'so-item-02b',
          productVariantId: 'pv-cable-c-to-c',
          productName: 'Cáp Sạc Bọc Dù Type-C to Type-C 100W',
          sku: 'CABLE-C-100W',
          quantity: 1,
          unitPrice: 190000,
          discount: 0,
          total: 190000,
        },
      ],
    },
    {
      id: 'so-demo-03',
      code: 'SO-DEMO-03',
      orderCode: 'SO-DEMO-03',
      customerId: 'cust-demo-02',
      customerName: 'Chị Ngọc Hân (VIP Gold)',
      customerPhone: '0918765432',
      userId: 'user-demo-sales',
      userFullName: 'Chuyên Viên Sales Demo',
      branchId: 'branch-demo-01',
      branchName: 'Chi nhánh Quận 1',
      status: 'Completed',
      subtotal: 28990000,
      discount: 0,
      total: 28990000,
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
      hasInvoice: true,
      invoiceId: 'inv-demo-03',
      invoiceCode: 'INV-DEMO-03',
      items: [
        {
          id: 'so-item-03',
          productVariantId: 'pv-ip15pm-256-nat',
          productName: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên',
          sku: 'IP15PM-256-NAT',
          quantity: 1,
          unitPrice: 28990000,
          discount: 0,
          total: 28990000,
        },
      ],
    },
    {
      id: 'so-demo-04',
      code: 'SO-DEMO-04',
      orderCode: 'SO-DEMO-04',
      customerId: 'cust-demo-01',
      customerName: 'Anh Hoàng Nam (Học viên Demo)',
      customerPhone: '0909123456',
      userId: 'user-demo-sales',
      userFullName: 'Chuyên Viên Sales Demo',
      branchId: 'branch-demo-01',
      branchName: 'Chi nhánh Quận 1',
      status: 'Completed',
      subtotal: 400000,
      discount: 0,
      total: 400000,
      createdAt: todayStr,
      updatedAt: todayStr,
      hasInvoice: true,
      invoiceId: 'inv-demo-04',
      invoiceCode: 'INV-DEMO-04',
      items: [
        {
          id: 'so-item-04a',
          productVariantId: 'pv-case-mag-ip15',
          productName: 'Ốp Lưng MagSafe Chống Sốc Trong Suốt',
          sku: 'CASE-IP15-MAG',
          quantity: 1,
          unitPrice: 250000,
          discount: 0,
          total: 250000,
        },
        {
          id: 'so-item-04b',
          productVariantId: 'pv-kingkong-ip15',
          productName: 'Kính Cường Lực Kingkong Tự Dán Khung',
          sku: 'GLAS-KINGKONG',
          quantity: 1,
          unitPrice: 150000,
          discount: 0,
          total: 150000,
        },
      ],
    },
  ];

  return {
    orders,
    customers,
    stockMap,
    vouchers,
    products,
    variants,
    categories,
  };
};

const notifySubscribers = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('psp_sandbox_sales_updated'));
  }
};

const loadData = (): SandboxSalesData => {
  if (typeof window === 'undefined') return createInitialSandboxSalesData();
  try {
    const raw = sessionStorage.getItem(SANDBOX_SALES_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialSandboxSalesData();
      sessionStorage.setItem(SANDBOX_SALES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return createInitialSandboxSalesData();
  }
};

const saveData = (data: SandboxSalesData): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SANDBOX_SALES_STORAGE_KEY, JSON.stringify(data));
    notifySubscribers();
  } catch (err) {
    console.error('Failed to save sandbox sales data to sessionStorage:', err);
  }
};

export const salesSandboxService = {
  getOrders: (query?: { branchId?: string; status?: string; search?: string }): SalesOrderDto[] => {
    const data = loadData();
    let res = [...data.orders];

    if (query?.status) {
      res = res.filter((o) => o.status.toLowerCase() === query.status?.toLowerCase());
    }

    if (query?.search) {
      const s = query.search.toLowerCase();
      res = res.filter(
        (o) =>
          o.code.toLowerCase().includes(s) ||
          o.orderCode?.toLowerCase().includes(s) ||
          o.customerName?.toLowerCase().includes(s) ||
          o.customerPhone?.toLowerCase().includes(s)
      );
    }

    return res;
  },

  getOrderById: (orderId: string): SalesOrderDto | undefined => {
    const data = loadData();
    return data.orders.find((o) => o.id === orderId);
  },

  completeOrder: (orderId: string, actorName = 'Chuyên Viên Thu Ngân'): SalesOrderDto => {
    const data = loadData();
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng #${orderId} trong Sandbox.`);
    }

    order.status = 'Completed';
    order.updatedAt = new Date().toISOString();
    order.hasInvoice = true;
    order.invoiceId = `inv-${order.id}`;
    order.invoiceCode = `INV-${order.code}`;

    saveData(data);

    operationalNotificationService.dispatchNotification({
      title: 'Duyệt Thu Tiền Thành Công [SANDBOX]',
      content: `Đơn hàng ${order.code} (${order.customerName}) đã được thu tiền và chuyển trạng thái Hoàn tất.`,
      type: 'GENERAL',
      targetRoles: ['Sales', 'Manager'],
      link: '/sales',
      isSandbox: true,
    });

    return order;
  },

  cancelOrder: (orderId: string, actorName = 'Chuyên Viên Thu Ngân'): SalesOrderDto => {
    const data = loadData();
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng #${orderId} trong Sandbox.`);
    }

    order.status = 'Cancelled';
    order.updatedAt = new Date().toISOString();

    saveData(data);

    operationalNotificationService.dispatchNotification({
      title: 'Hủy Đơn Hàng Thành Công [SANDBOX]',
      content: `Đơn hàng ${order.code} đã hủy. Tồn kho giữ chỗ đã được giải phóng.`,
      type: 'GENERAL',
      targetRoles: ['Sales', 'Manager'],
      link: '/sales',
      isSandbox: true,
    });

    return order;
  },

  getProducts: (): ProductDto[] => {
    const data = loadData();
    return data.products;
  },

  getVariants: (): ProductVariantDto[] => {
    const data = loadData();
    return data.variants;
  },

  getCategories: (): CategoryDto[] => {
    const data = loadData();
    return data.categories;
  },

  getStockMap: (): Record<string, number> => {
    const data = loadData();
    return data.stockMap;
  },

  getCustomers: (): CustomerDto[] => {
    const data = loadData();
    return data.customers;
  },

  createCustomer: (customerData: {
    fullName: string;
    phone: string;
    address?: string;
    email?: string;
  }): CustomerDto => {
    const data = loadData();
    const newCust: CustomerDto = {
      id: `cust-demo-${Date.now().toString().slice(-4)}`,
      code: `CUST-${(data.customers.length + 1).toString().padStart(3, '0')}`,
      fullName: customerData.fullName,
      phone: customerData.phone,
      address: customerData.address,
      email: customerData.email,
      rewardPoints: 0,
      totalSpent: 0,
      memberTier: 'Standard',
      createdAt: new Date().toISOString(),
    };

    data.customers.unshift(newCust);
    saveData(data);

    return newCust;
  },

  validateVoucher: (
    code: string,
    subtotal = 0
  ): { isValid: boolean; discountAmount: number; message: string; voucher?: VoucherDto } => {
    const data = loadData();
    const voucher = data.vouchers.find((v) => v.code.toUpperCase() === code.trim().toUpperCase());

    if (!voucher) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Mã khuyến mãi "${code}" không tồn tại hoặc đã hết hạn.`,
      };
    }

    if (voucher.status !== 'Active') {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Mã khuyến mãi "${code}" không còn hiệu lực.`,
      };
    }

    if (subtotal > 0 && subtotal < voucher.minOrderValue) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để dùng mã này.`,
      };
    }

    let discount = voucher.discountAmount;
    if (voucher.code === 'SALES10') {
      discount = Math.min(Math.round(subtotal * 0.1), 100000);
    }

    return {
      isValid: true,
      discountAmount: discount,
      message: `Áp dụng thành công voucher ${voucher.code}! Giảm ${discount.toLocaleString('vi-VN')}đ.`,
      voucher,
    };
  },

  checkout: (params: {
    command: CreateSalesOrderCommand;
    paymentMethod: 'CASH' | 'BANK_TRANSFER';
    cashGiven?: number;
    idempotencyKey?: string;
  }): PosCheckoutResult => {
    const data = loadData();
    const { command, paymentMethod } = params;

    const customer = data.customers.find((c) => c.id === command.customerId) || {
      id: 'walk-in',
      fullName: 'Khách lẻ tại quầy',
      phone: '0900000000',
    };

    let subtotal = 0;
    const orderItems = command.items.map((item, idx) => {
      const variant = data.variants.find((v) => v.id === item.productVariantId);
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;

      // Deduct stock in sandbox
      if (data.stockMap[item.productVariantId] !== undefined) {
        data.stockMap[item.productVariantId] = Math.max(
          0,
          data.stockMap[item.productVariantId] - item.quantity
        );
      }

      return {
        id: `so-item-${Date.now()}-${idx}`,
        productVariantId: item.productVariantId,
        productName: variant?.name || variant?.productName || 'Sản phẩm tại quầy',
        sku: variant?.sku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        total: itemTotal,
      };
    });

    let discount = 0;
    if (command.voucherCode) {
      const vRes = salesSandboxService.validateVoucher(command.voucherCode, subtotal);
      if (vRes.isValid) {
        discount = vRes.discountAmount;
      }
    }

    const total = Math.max(0, subtotal - discount);
    const orderNum = (data.orders.length + 1).toString().padStart(3, '0');
    const orderId = `so-demo-${Date.now().toString().slice(-4)}`;
    const orderCode = `SO-DEMO-${orderNum}`;
    const invoiceId = `inv-${orderId}`;
    const invoiceCode = `INV-${orderCode}`;
    const paymentId = `pay-${orderId}`;

    const newOrder: SalesOrderDto = {
      id: orderId,
      code: orderCode,
      orderCode,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: (customer as any).phone || '',
      userId: 'user-demo-sales',
      userFullName: 'Chuyên Viên Sales Demo',
      branchId: 'branch-demo-01',
      branchName: 'Chi nhánh Quận 1',
      voucherCode: command.voucherCode,
      status: 'Completed',
      subtotal,
      discount,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasInvoice: true,
      invoiceId,
      invoiceCode,
      items: orderItems,
    };

    data.orders.unshift(newOrder);
    saveData(data);

    operationalNotificationService.dispatchNotification({
      title: 'Bán Hàng POS Thành Công [SANDBOX]',
      content: `Đơn hàng ${orderCode} trị giá ${total.toLocaleString('vi-VN')}đ đã thanh toán qua ${paymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR'}.`,
      type: 'GENERAL',
      targetRoles: ['Sales', 'Manager'],
      link: '/sales',
      isSandbox: true,
    });

    return {
      orderId,
      invoiceId,
      paymentId,
      orderCode,
      invoiceCode,
      total,
    };
  },

  resetToDefault: (): void => {
    const initial = createInitialSandboxSalesData();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SANDBOX_SALES_STORAGE_KEY, JSON.stringify(initial));
        notifySubscribers();
      } catch (e) {
        console.error('Failed to reset sandbox sales data:', e);
      }
    }
  },
};
