// ============================================
// COMMON & AUTH DTOs
// ============================================
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  isSuccess: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface LoginCommand {
  username: string;
  password: string;
}

export interface UserDto {
  id: string;
  branchId: string;
  branchName?: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Locked';
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
  roles: string[];
  permissions: string[];
}

export interface AuditLogDto {
  id: string;
  userId?: string;
  userFullName?: string;
  performedBy?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValue?: string;
  oldValues?: string;
  newValue?: string;
  newValues?: string;
  createdAt: string;
  createdDate?: string;
}

// ============================================
// BRANCH MODULE
// ============================================
export interface BranchDto {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchCommand {
  code: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  status?: 'Active' | 'Inactive';
}

// ============================================
// CUSTOMER MODULE
// ============================================
export interface CustomerDto {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface CreateCustomerCommand {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
}

// ============================================
// PRODUCT MODULE
// ============================================
export interface CategoryDto {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  parentName?: string;
  createdAt: string;
}

export interface BrandDto {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  name: string;
  variantName: string;
  color?: string;
  capacity?: string;
  costPrice: number;
  salePrice: number;

  createdAt: string;
}

export interface ProductDto {
  id: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  code: string;
  name: string;
  description?: string;
  variants: ProductVariantDto[];
  createdAt: string;
}

export interface CreateProductCommand {
  categoryId: string;
  brandId: string;
  code: string;
  name: string;
  description?: string;
}

export interface CreateProductVariantCommand {
  productId: string;
  sku: string;
  name: string;
  color?: string;
  capacity?: string;
  costPrice: number;
  salePrice: number;
}

// ============================================
// INVENTORY MODULE
// ============================================
export interface WarehouseDto {
  id: string;
  branchId: string;
  branchName: string;
  code: string;
  name: string;
  address?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface InventoryDto {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productVariantId: string;
  variantName: string;
  sku: string;
  quantity: number;
  minimumStock: number;
  isLowStock: boolean;
  updatedAt: string;
}

export interface ImeiDto {
  id: string;
  imei: string;
  productVariantId: string;
  variantName: string;
  sku: string;
  warehouseId?: string;
  warehouseName: string;
  status: 'InStock' | 'Sold' | 'Repairing' | 'WarrantyHold' | 'Disposed';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SALES MODULE
// ============================================
export interface SalesOrderItemDto {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  imei?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SalesOrderDto {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  userId: string;
  userFullName: string;
  branchId: string;
  branchName: string;
  voucherId?: string;
  voucherCode?: string;
  code: string;
  orderCode: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItemDto[];
}

export interface CreateSalesOrderItemCommand {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  imei?: string;
}

export interface CreateSalesOrderCommand {
  customerId: string;
  voucherCode?: string;
  items: CreateSalesOrderItemCommand[];
}

export interface InvoiceItemDto {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentDto {
  id: string;
  invoiceId: string;
  paymentMethodId: string;
  paymentMethodName: string;
  code: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  paymentDate: string;
}

export interface InvoiceDto {
  id: string;
  salesOrderId: string;
  salesOrderCode: string;
  code: string;
  status: 'Draft' | 'Issued' | 'Paid' | 'Cancelled';
  amount: number;
  createdAt: string;
  items: InvoiceItemDto[];
  payments: PaymentDto[];
}

export interface CreateInvoiceCommand {
  salesOrderId: string;
}

export interface CreatePaymentCommand {
  invoiceId: string;
  paymentMethodId: string;
  amount: number;
}

export interface PaymentMethodDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface VoucherDto {
  id: string;
  promotionId: string;
  promotionCode: string;
  promotionName: string;
  code: string;
  status: 'Active' | 'Used' | 'Expired' | 'Cancelled';
  discountAmount: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  createdAt: string;
}

// ============================================
// REPAIR & WARRANTY MODULES
// ============================================
export interface RepairPartDto {
  id: string;
  repairTicketId: string;
  productVariantId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RepairStatusHistoryDto {
  id: string;
  repairTicketId: string;
  status: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export type RepairTicketStatus = 'Received' | 'Diagnosing' | 'WaitingApproval' | 'WaitingForParts' | 'Repairing' | 'WaitingQC' | 'Completed' | 'WaitingPickup' | 'Delivered' | 'Cancelled';

export interface RepairTicketDto {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productVariantId: string;
  productName: string;
  deviceModel?: string;
  productSku: string;
  imei?: string;
  receivedById: string;
  receivedByName: string;
  technicianId?: string;
  technicianName?: string;
  code: string;
  ticketCode: string;
  status: RepairTicketStatus;
  problemDescription: string;
  estimatedCost?: number;
  actualCost?: number;
  laborCost: number;
  partsTotal: number;
  totalAmount: number;
  totalCost?: number;
  receivedDate: string;
  completedDate?: string;
  createdAt: string;
  parts: RepairPartDto[];
  statusHistories: RepairStatusHistoryDto[];
  checklists?: RepairChecklistDto[];
  deposits?: RepairDepositDto[];
}

export interface RepairChecklistItemDto {
  id: string;
  checkPointName: string;
  isPassed: boolean;
  issueDescription?: string;
}

export interface RepairChecklistDto {
  id: string;
  repairTicketId: string;
  type: 'CheckIn' | 'CheckOut';
  inspectorId: string;
  inspectorName: string;
  inspectedAt: string;
  customerSignatureUrl?: string;
  notes?: string;
  createdAt: string;
  items: RepairChecklistItemDto[];
}

export interface ChecklistItemDto {
  checkPointName: string;
  isPassed: boolean;
  issueDescription?: string;
}

export interface CreateRepairChecklistCommand {
  repairTicketId: string;
  type: 'CheckIn' | 'CheckOut';
  notes?: string;
  customerSignatureUrl?: string;
  items: ChecklistItemDto[];
}

export interface CreateRepairTicketCommand {
  branchId: string;
  customerId: string;
  productVariantId: string;
  problemDescription: string;
  estimatedCost?: number;
  imei?: string;
}

export interface CreateRepairDepositCommand {
  repairTicketId: string;
  amount: number;
  paymentMethodId: string;
  transactionCode?: string;
  idempotencyKey: string;
}

export interface RepairDepositDto {
  id: string;
  repairTicketId: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  transactionCode?: string;
  idempotencyKey: string;
  status: 'Pending' | 'Paid' | 'Refunded' | 'Applied';
  paidAt: string;
}

export interface AddRepairPartCommand {
  repairTicketId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export type WarrantyTicketStatus = 'Received' | 'Processing' | 'Completed' | 'Rejected' | 'Cancelled';

export interface WarrantyHistoryDto {
  id: string;
  warrantyTicketId: string;
  action: string;
  status: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

  export interface WarrantyTicketDto {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    salesOrderId?: string;
    salesOrderCode?: string;
    productVariantId: string;
    productName: string;
    productSku: string;
    imei?: string;
    code: string;
    ticketCode: string;
    status: WarrantyTicketStatus;
    startDate?: string;
    endDate?: string;
    note?: string;
    issueDescription?: string;
    createdAt: string;
    histories: WarrantyHistoryDto[];
    rowVersion: string;
  }

export interface CreateWarrantyTicketCommand {
  branchId: string;
  customerId: string;
  productVariantId: string;
  imei: string;
  note?: string;
}

export interface WarrantyCheckResultDto {
  isUnderWarranty: boolean;
  purchaseDate?: string;
  warrantyExpirationDate?: string;
  productVariantId?: string;
  productName: string;
  productSku: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  salesOrderId?: string;
  salesOrderCode?: string;
  currentImeiStatus: string;
  imei?: string;
}

export interface CreateStockTakeItemCommand {
  productVariantId: string;
  actualQuantity: number;
  note?: string;
}

export interface CreateStockTakeCommand {
  warehouseId: string;
  code?: string;
  items: CreateStockTakeItemCommand[];
}
