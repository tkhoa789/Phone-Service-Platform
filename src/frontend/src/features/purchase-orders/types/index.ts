export type PurchaseOrderStatus = 'Draft' | 'Confirmed' | 'Received' | 'Cancelled';

export interface PurchaseOrderItemDto {
  id: string;
  productVariantId: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PurchaseOrderDto {
  id: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  createdAt: string;
  items: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderItemCommand {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderCommand {
  supplierId: string;
  warehouseId: string;
  code: string;
  items: CreatePurchaseOrderItemCommand[];
}

export interface UpdatePurchaseOrderCommand {
  id: string;
  supplierId: string;
  warehouseId: string;
  items: CreatePurchaseOrderItemCommand[];
}

export interface ProductVariantImeisDto {
  productVariantId: string;
  imeis: string[];
}

export interface CompletePurchaseOrderCommand {
  id: string;
  variantImeis: ProductVariantImeisDto[];
}
