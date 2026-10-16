import type { InventoryDto, StockTakeDto, StockTakeItemDto, ProductDto } from '../../../types/api.types';
import type { PurchaseOrderDto, PurchaseOrderItemDto } from '../../purchase-orders/types';
import { operationalNotificationService } from '../../../services/operationalNotificationService';

const SANDBOX_INVENTORY_STORAGE_KEY = 'psp_sandbox_inventory';
const SANDBOX_POS_STORAGE_KEY = 'psp_sandbox_purchase_orders';
const SANDBOX_STOCK_TAKES_STORAGE_KEY = 'psp_sandbox_stock_takes';
const SANDBOX_PRODUCTS_STORAGE_KEY = 'psp_sandbox_products';

const createInitialSandboxInventory = (): InventoryDto[] => [
  {
    id: 'demo-inv-01',
    productVariantId: 'pv-demo-bat-15pm',
    sku: 'BAT-IP15PM-PISEN',
    variantName: 'Pin Pisen iPhone 15 Pro Max 4422mAh (Chính Hãng)',
    quantity: 1,
    minimumStock: 5,
    isLowStock: true,
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-inv-02',
    productVariantId: 'pv-demo-scr-13p',
    sku: 'SCR-IP13P-OLED',
    variantName: 'Màn hình Super Retina XDR OLED iPhone 13 Pro',
    quantity: 8,
    minimumStock: 5,
    isLowStock: false,
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-inv-03',
    productVariantId: 'pv-demo-chg-14pm',
    sku: 'CHG-IP14PM-OEM',
    variantName: 'Cụm Bo Sạc & Micro Type-C iPhone 14 Pro Max',
    quantity: 2,
    minimumStock: 4,
    isLowStock: true,
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-inv-04',
    productVariantId: 'pv-demo-bck-15pm',
    sku: 'BCK-IP15PM-TITAN',
    variantName: 'Kính Lưng Titan Tự Nhiên iPhone 15 Pro Max',
    quantity: 12,
    minimumStock: 5,
    isLowStock: false,
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-inv-05',
    productVariantId: 'pv-demo-cam-s24u',
    sku: 'CAM-S24U-200MP',
    variantName: 'Cụm Camera Sau 200MP OIS Samsung Galaxy S24 Ultra',
    quantity: 4,
    minimumStock: 3,
    isLowStock: false,
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    updatedAt: new Date().toISOString(),
  },
];

const createInitialSandboxPOs = (): PurchaseOrderDto[] => [
  {
    id: 'demo-po-01',
    code: 'PO-DEMO-2024-01',
    supplierId: 'sup-demo-01',
    supplierName: 'Phụ Kiện Sài Gòn Phân Phối',
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    status: 'Confirmed', // Chờ nhận hàng
    totalAmount: 4800000,
    createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    rowVersion: 'AAAAAAABAAA=',
    items: [
      {
        id: 'poi-demo-01',
        productVariantId: 'pv-demo-bat-15pm',
        sku: 'BAT-IP15PM-PISEN',
        variantName: 'Pin Pisen iPhone 15 Pro Max 4422mAh (Chính Hãng)',
        quantity: 10,
        unitPrice: 480000,
        amount: 4800000,
      },
    ],
  },
  {
    id: 'demo-po-02',
    code: 'PO-DEMO-2024-02',
    supplierId: 'sup-demo-02',
    supplierName: 'Linh Kiện Hoàng Hà Tổng Kho',
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    status: 'Draft', // Bản nháp / chờ duyệt
    totalAmount: 1750000,
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    rowVersion: 'AAAAAAABAAE=',
    items: [
      {
        id: 'poi-demo-02',
        productVariantId: 'pv-demo-chg-14pm',
        sku: 'CHG-IP14PM-OEM',
        variantName: 'Cụm Bo Sạc & Micro Type-C iPhone 14 Pro Max',
        quantity: 5,
        unitPrice: 350000,
        amount: 1750000,
      },
    ],
  },
];

const createInitialSandboxStockTakes = (): StockTakeDto[] => [
  {
    id: 'demo-stk-01',
    code: 'STK-DEMO-2024-01',
    warehouseId: 'b1',
    warehouseName: 'Kho Trụ Sở Chính',
    status: 'Completed',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    items: [
      {
        id: 'sti-01',
        productVariantId: 'pv-demo-bat-15pm',
        sku: 'BAT-IP15PM-PISEN',
        variantName: 'Pin Pisen iPhone 15 Pro Max 4422mAh (Chính Hãng)',
        systemQuantity: 2,
        actualQuantity: 1,
        difference: -1,
        note: '1 viên pin phồng lỗi đã loại bỏ',
      },
      {
        id: 'sti-02',
        productVariantId: 'pv-demo-scr-13p',
        sku: 'SCR-IP13P-OLED',
        variantName: 'Màn hình Super Retina XDR OLED iPhone 13 Pro',
        systemQuantity: 8,
        actualQuantity: 8,
        difference: 0,
        note: 'Khớp 100% với tủ kệ',
      },
    ],
  },
];

const createInitialSandboxProducts = (): ProductDto[] => [
  {
    id: 'prd-demo-01',
    code: 'PRD-IP15PM-PARTS',
    name: 'Cụm Linh Kiện iPhone 15 Pro Max',
    categoryId: 'cat-demo-apple',
    categoryName: 'Linh Kiện iPhone (Apple)',
    brandId: 'brand-demo-apple',
    brandName: 'Apple Inc.',
    description: 'Danh mục phụ tùng thay thế cao cấp dòng iPhone 15 Series',
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: 'pv-demo-bat-15pm',
        productId: 'prd-demo-01',
        productName: 'Cụm Linh Kiện iPhone 15 Pro Max',
        sku: 'BAT-IP15PM-PISEN',
        name: 'Pin Pisen Dung Lượng Cao 4422mAh',
        variantName: 'Pin Pisen iPhone 15 Pro Max 4422mAh (Chính Hãng)',
        color: 'Tiêu Chuẩn',
        capacity: '4422mAh',
        costPrice: 480000,
        salePrice: 850000,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pv-demo-bck-15pm',
        productId: 'prd-demo-01',
        productName: 'Cụm Linh Kiện iPhone 15 Pro Max',
        sku: 'BCK-IP15PM-TITAN',
        name: 'Kính Lưng Titan Tự Nhiên',
        variantName: 'Kính Lưng Titan Tự Nhiên iPhone 15 Pro Max',
        color: 'Natural Titanium',
        capacity: '',
        costPrice: 650000,
        salePrice: 1200000,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'prd-demo-02',
    code: 'PRD-IP13P-PARTS',
    name: 'Cụm Màn Hình & Kính iPhone 13 Pro',
    categoryId: 'cat-demo-screens',
    categoryName: 'Màn Hình & Cảm Ứng',
    brandId: 'brand-demo-apple',
    brandName: 'Apple Inc.',
    description: 'Màn hình Super Retina XDR OLED 120Hz ProMotion',
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: 'pv-demo-scr-13p',
        productId: 'prd-demo-02',
        productName: 'Cụm Màn Hình & Kính iPhone 13 Pro',
        sku: 'SCR-IP13P-OLED',
        name: 'Màn Hình Super Retina XDR OLED',
        variantName: 'Màn hình Super Retina XDR OLED iPhone 13 Pro',
        color: 'Black',
        capacity: '',
        costPrice: 2100000,
        salePrice: 3200000,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'prd-demo-03',
    code: 'PRD-IP14PM-PARTS',
    name: 'Cụm Bo Sạc & Micro iPhone 14 Pro Max',
    categoryId: 'cat-demo-boards',
    categoryName: 'Bo Mạch & Cáp Nối',
    brandId: 'brand-demo-apple',
    brandName: 'Apple Inc.',
    description: 'Bo sạc Type-C/Lightning tích hợp Micro chống ồn',
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: 'pv-demo-chg-14pm',
        productId: 'prd-demo-03',
        productName: 'Cụm Bo Sạc & Micro iPhone 14 Pro Max',
        sku: 'CHG-IP14PM-OEM',
        name: 'Cụm Bo Sạc & Micro OEM',
        variantName: 'Cụm Bo Sạc & Micro Type-C iPhone 14 Pro Max',
        color: 'Original',
        capacity: '',
        costPrice: 280000,
        salePrice: 550000,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'prd-demo-04',
    code: 'PRD-S24U-PARTS',
    name: 'Cụm Camera Sau Samsung S24 Ultra',
    categoryId: 'cat-demo-camera',
    categoryName: 'Camera & Ống Kính',
    brandId: 'brand-demo-samsung',
    brandName: 'Samsung',
    description: 'Cảm biến 200MP OIS Space Zoom',
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: 'pv-demo-cam-s24u',
        productId: 'prd-demo-04',
        productName: 'Cụm Camera Sau Samsung S24 Ultra',
        sku: 'CAM-S24U-200MP',
        name: 'Cụm Camera Sau 200MP OIS',
        variantName: 'Cụm Camera Sau 200MP OIS Samsung Galaxy S24 Ultra',
        color: 'Titan Black',
        capacity: '',
        costPrice: 1800000,
        salePrice: 2700000,
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export class InventorySandboxService {
  private inventory: InventoryDto[] = [];
  private purchaseOrders: PurchaseOrderDto[] = [];
  private stockTakes: StockTakeDto[] = [];
  private products: ProductDto[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const invData = localStorage.getItem(SANDBOX_INVENTORY_STORAGE_KEY);
      if (invData) {
        const parsed = JSON.parse(invData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inventory = parsed;
        } else {
          this.inventory = createInitialSandboxInventory();
        }
      } else {
        this.inventory = createInitialSandboxInventory();
      }

      const poData = localStorage.getItem(SANDBOX_POS_STORAGE_KEY);
      if (poData) {
        const parsed = JSON.parse(poData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.purchaseOrders = parsed;
        } else {
          this.purchaseOrders = createInitialSandboxPOs();
        }
      } else {
        this.purchaseOrders = createInitialSandboxPOs();
      }

      const stkData = localStorage.getItem(SANDBOX_STOCK_TAKES_STORAGE_KEY);
      if (stkData) {
        const parsed = JSON.parse(stkData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.stockTakes = parsed;
        } else {
          this.stockTakes = createInitialSandboxStockTakes();
        }
      } else {
        this.stockTakes = createInitialSandboxStockTakes();
      }

      const prodData = localStorage.getItem(SANDBOX_PRODUCTS_STORAGE_KEY);
      if (prodData) {
        const parsed = JSON.parse(prodData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.products = parsed;
        } else {
          this.products = createInitialSandboxProducts();
        }
      } else {
        this.products = createInitialSandboxProducts();
      }
    } catch (e) {
      console.warn('[Sandbox] Failed to load inventory sandbox from storage', e);
      this.reset();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(SANDBOX_INVENTORY_STORAGE_KEY, JSON.stringify(this.inventory));
      localStorage.setItem(SANDBOX_POS_STORAGE_KEY, JSON.stringify(this.purchaseOrders));
      localStorage.setItem(SANDBOX_STOCK_TAKES_STORAGE_KEY, JSON.stringify(this.stockTakes));
      localStorage.setItem(SANDBOX_PRODUCTS_STORAGE_KEY, JSON.stringify(this.products));
    } catch (e) {
      console.warn('[Sandbox] Failed to save inventory sandbox to storage', e);
    }
  }

  public reset(): void {
    this.inventory = createInitialSandboxInventory();
    this.purchaseOrders = createInitialSandboxPOs();
    this.stockTakes = createInitialSandboxStockTakes();
    this.products = createInitialSandboxProducts();
    this.saveToStorage();
  }

  public getProducts(): ProductDto[] {
    return [...this.products];
  }

  public getInventory(): InventoryDto[] {
    return [...this.inventory];
  }

  public getPurchaseOrders(): PurchaseOrderDto[] {
    return [...this.purchaseOrders];
  }

  public getStockTakes(warehouseId?: string): StockTakeDto[] {
    if (!warehouseId || warehouseId === 'all') return [...this.stockTakes];
    return this.stockTakes.filter(s => s.warehouseId.toLowerCase() === warehouseId.toLowerCase());
  }

  public getStockTakeById(id: string): StockTakeDto | undefined {
    return this.stockTakes.find(s => s.id === id || s.code === id);
  }

  /**
   * Mô phỏng cân bằng kho đợt kiểm kê
   */
  public reconcileStockTake(
    warehouseId: string,
    warehouseName: string,
    counts: Record<string, number>,
    notes?: Record<string, string>
  ): { success: boolean; stockTake: StockTakeDto; message: string } {
    const code = `STK-DEMO-${Date.now().toString().slice(-6)}`;
    const items: StockTakeItemDto[] = [];
    let totalDiff = 0;

    for (const inv of this.inventory) {
      const actual = counts[inv.sku] ?? inv.quantity;
      const diff = actual - inv.quantity;
      if (diff !== 0) totalDiff += diff;
      items.push({
        id: `sti-${Date.now()}-${inv.sku}`,
        productVariantId: inv.productVariantId,
        sku: inv.sku,
        variantName: inv.variantName,
        systemQuantity: inv.quantity,
        actualQuantity: actual,
        difference: diff,
        note: notes?.[inv.sku] || (diff === 0 ? 'Khớp 100%' : 'Chênh lệch đếm thực tế'),
      });
      // Cập nhật tồn kho ảo
      inv.quantity = actual;
      inv.isLowStock = actual <= (inv.minimumStock || 5);
      inv.updatedAt = new Date().toISOString();
    }

    const newStockTake: StockTakeDto = {
      id: `stk-${Date.now()}`,
      code,
      warehouseId: warehouseId || 'b1',
      warehouseName: warehouseName || 'Kho Trụ Sở Chính',
      status: 'Completed',
      createdAt: new Date().toISOString(),
      items,
    };

    this.stockTakes.unshift(newStockTake);
    this.saveToStorage();

    operationalNotificationService.dispatchNotification({
      title: `⚖️ [THỰC HÀNH SANDBOX] Đã hoàn tất cân bằng kho đợt ${code}!`,
      content: `Thủ kho đã chốt biên bản kiểm kê và điều chỉnh tồn kho. Tổng chênh lệch: ${totalDiff >= 0 ? '+' : ''}${totalDiff} chiếc. Sổ sách đã khớp với thực tế.`,
      type: 'STOCK_DISCREPANCY_APPROVED',
      targetRoles: ['Inventory', 'Manager'],
      link: '/stock-take?mode=training',
      isSandbox: true,
    });

    return {
      success: true,
      stockTake: newStockTake,
      message: `Đã cân bằng kho thành công đợt ${code}! Tồn kho trên hệ thống đã khớp 100% với số đếm thực tế.`,
    };
  }

  /**
   * Mô phỏng tiếp nhận đơn hàng PO vào kho
   * Tăng số lượng tồn thực tế của các mặt hàng trong đơn
   * Nổ chuông Sandbox và ghi nhật ký
   */
  public receivePurchaseOrder(poIdOrCode: string): { success: boolean; po?: PurchaseOrderDto; message: string } {
    const po = this.purchaseOrders.find(p => p.id === poIdOrCode || p.code === poIdOrCode);
    if (!po) {
      return { success: false, message: 'Không tìm thấy đơn mua hàng mẫu cần tiếp nhận' };
    }

    if (po.status === 'Received') {
      return { success: false, message: 'Đơn mua hàng này đã được tiếp nhận nhập kho trước đó!' };
    }

    // Đánh dấu PO hoàn thành (Received)
    po.status = 'Received';
    po.rowVersion = `UPD-${Date.now()}`;

    // Cập nhật tăng số lượng tồn cho từng mặt hàng
    const updatedNames: string[] = [];
    if (po.items && po.items.length > 0) {
      for (const item of po.items) {
        const invItem = this.inventory.find(i => i.sku === item.sku || i.productVariantId === item.productVariantId);
        if (invItem) {
          invItem.quantity = (invItem.quantity || 0) + item.quantity;
          invItem.isLowStock = invItem.quantity <= (invItem.minimumStock || 5);
          invItem.updatedAt = new Date().toISOString();
          updatedNames.push(`${item.variantName || item.sku} (+${item.quantity})`);
        }
      }
    } else {
      const batItem = this.inventory.find(i => i.sku === 'BAT-IP15PM-PISEN');
      if (batItem) {
        batItem.quantity = (batItem.quantity || 0) + 10;
        batItem.isLowStock = false;
        batItem.updatedAt = new Date().toISOString();
        updatedNames.push('Pin Pisen iPhone 15 Pro Max (+10)');
      }
    }

    this.saveToStorage();

    // Bắn thông báo Sandbox vào chuông 2 kênh
    operationalNotificationService.dispatchNotification({
      title: `📦 [THỰC HÀNH SANDBOX] Đã nhập kho thành công đơn ${po.code}!`,
      content: `Thủ kho đã hoàn tất kiểm đếm và tiếp nhận hàng từ nhà cung cấp "${po.supplierName}". Đã cập nhật vào tủ: ${updatedNames.join(', ')}.`,
      type: 'GENERAL',
      targetRoles: ['Inventory', 'Manager'],
      link: '/inventory?mode=training',
      isSandbox: true,
    });

    return {
      success: true,
      po,
      message: `Đã nhập kho thành công đơn ${po.code}! Số lượng tồn đã được tự động cộng vào tủ.`,
    };
  }

  /**
   * Mô phỏng đặt nhanh PO cho mặt hàng chạm sàn
   */
  public quickReorder(sku: string): { success: boolean; po?: PurchaseOrderDto; message: string } {
    const invItem = this.inventory.find(i => i.sku === sku);
    if (!invItem) {
      return { success: false, message: 'Không tìm thấy sản phẩm cần đặt hàng' };
    }

    const newCode = `PO-DEMO-${Date.now().toString().slice(-4)}`;
    const newPO: PurchaseOrderDto = {
      id: `demo-po-${Date.now()}`,
      code: newCode,
      supplierId: 'sup-demo-01',
      supplierName: 'Phụ Kiện Sài Gòn Phân Phối',
      warehouseId: invItem.warehouseId || 'b1',
      warehouseName: invItem.warehouseName || 'Kho Trụ Sở Chính',
      status: 'Confirmed',
      totalAmount: 2500000,
      createdAt: new Date().toISOString(),
      rowVersion: `VER-${Date.now()}`,
      items: [
        {
          id: `poi-${Date.now()}`,
          productVariantId: invItem.productVariantId,
          sku: invItem.sku,
          variantName: invItem.variantName,
          quantity: 10,
          unitPrice: 250000,
          amount: 2500000,
        },
      ],
    };

    this.purchaseOrders.unshift(newPO);
    this.saveToStorage();

    operationalNotificationService.dispatchNotification({
      title: `📝 [THỰC HÀNH SANDBOX] Đã lập đơn đặt hàng mới: ${newCode}`,
      content: `Đã tạo đơn đặt 10x ${invItem.variantName} từ nhà cung cấp "Phụ Kiện Sài Gòn Phân Phối". Đơn đang chờ nhà cung cấp giao tới kho.`,
      type: 'GENERAL',
      targetRoles: ['Inventory', 'Manager'],
      link: '/purchase-orders?mode=training',
      isSandbox: true,
    });

    return {
      success: true,
      po: newPO,
      message: `Đã tạo thành công đơn đặt hàng ${newCode} (10 chiếc)!`,
    };
  }

  /**
   * Mô phỏng kiểm kho (Stock Audit)
   */
  public auditItem(sku: string, actualQuantity: number, notes?: string): { success: boolean; message: string } {
    const invItem = this.inventory.find(i => i.sku === sku);
    if (!invItem) {
      return { success: false, message: 'Không tìm thấy linh kiện cần kiểm kê' };
    }

    const previousQty = invItem.quantity;
    invItem.quantity = actualQuantity;
    invItem.isLowStock = actualQuantity <= (invItem.minimumStock || 5);
    invItem.updatedAt = new Date().toISOString();

    this.saveToStorage();

    operationalNotificationService.dispatchNotification({
      title: `📋 [THỰC HÀNH SANDBOX] Đối soát kiểm kho: ${invItem.variantName}`,
      content: `Thủ kho đã cập nhật số lượng thực tế: ${actualQuantity} chiếc (Trước đó: ${previousQty} chiếc). Ghi chú: ${notes || 'Đã đối chiếu thực tế khớp tủ linh kiện'}.`,
      type: 'STOCK_DISCREPANCY_APPROVED',
      targetRoles: ['Inventory', 'Manager'],
      link: '/inventory?mode=training',
      isSandbox: true,
    });

    return {
      success: true,
      message: `Đã ghi nhận kết quả kiểm kê cho ${invItem.variantName}: ${actualQuantity} chiếc.`,
    };
  }
}

export const inventorySandboxService = new InventorySandboxService();
