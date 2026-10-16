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
  branchAddress?: string;
  branchPhone?: string;
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
  rewardPoints?: number;
  totalSpent?: number | null;
  memberTier?: string;
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
  taxCode?: string | null;
  debtAmount?: number | null;
  creditLimit?: number;
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
  costPrice?: number | null;
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
  hasInvoice?: boolean;
  invoiceId?: string;
  invoiceCode?: string;
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
  code: string;
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
  status?: string;
  addedBy?: string;
  addedAt?: string;
  rowVersion?: string;
}

export interface RepairStatusHistoryDto {
  id: string;
  repairTicketId: string;
  status: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export type RepairTicketStatus = 'PendingAssignment' | 'Received' | 'Diagnosing' | 'WaitingApproval' | 'WaitingForParts' | 'Repairing' | 'WaitingQC' | 'Completed' | 'WaitingPickup' | 'Delivered' | 'Cancelled';

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
  exteriorCondition?: string;
  customModelName?: string;
  isTest?: boolean;
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

  // Diagnosis fields (Section 5)
  diagnosisRootCause?: string;
  diagnosisProposedSolution?: string;
  estimatedDays?: number;
  technicalNotes?: string;
  diagnosedAt?: string;
  diagnosedById?: string;
  diagnosedByName?: string;

  // Customer Approval fields (Section 6)
  customerApprovalStatus?: string;
  customerApprovedAt?: string;
  customerApprovedById?: string;
  customerApprovedByName?: string;
  customerApprovalMethod?: string;
  customerApprovedAmount?: number;
  customerApprovalNote?: string;
}

export interface SubmitDiagnosisCommand {
  repairTicketId: string;
  rootCause: string;
  proposedSolution: string;
  estimatedCost?: number;
  estimatedDays?: number;
  technicalNotes?: string;
  requiresCustomerApproval: boolean;
  waitingForParts?: boolean;
}

export interface ApproveRepairCommand {
  repairTicketId: string;
  approvedAmount: number;
  approvalMethod: string;
  note?: string;
}

export interface RejectRepairCommand {
  repairTicketId: string;
  reason?: string;
}

export interface UseRepairPartCommand {
  repairTicketId: string;
  repairPartId: string;
  rowVersion?: string;
}

export interface ReturnRepairPartCommand {
  repairTicketId: string;
  repairPartId: string;
  rowVersion?: any;
}

export interface CompleteRepairCommand {
  repairTicketId: string;
  completionNotes?: string;
}

export interface DeliverRepairCommand {
  repairTicketId: string;
  receiverName: string;
  receiverPhone?: string;
  notes?: string;
  customerSignatureUrl?: string;
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
  technicianId?: string;
  exteriorCondition?: string;
  customModelName?: string;
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

export interface RepairQueueStatsDto {
  unassignedCount: number;
  myTasksCount: number;
  inProgressCount: number;
  completedCount: number;
  deliveredCount?: number;
  totalCount: number;
  waitingForPartsCount?: number;
  waitingApprovalCount?: number;
  diagnosingCount?: number;
  repairingCount?: number;
  waitingQcCount?: number;
}

export interface AddRepairPartCommand {
  repairTicketId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export type WarrantyTicketStatus = 'Received' | 'Processing' | 'Completed' | 'Rejected' | 'Cancelled';

export type RejectReason = 'WaterDamage' | 'Dropped' | 'ThirdPartyIntervention' | 'Expired' | 'Other';
export type VendorSubStatus = 'AtVendor' | 'Returned';

export interface WarrantyHistoryDto {
  id: string;
  warrantyTicketId: string;
  action: string;
  status: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  notes?: string;
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
  ticketCode?: string;
  status: WarrantyTicketStatus;
  startDate?: string;
  endDate?: string;
  note?: string;
  issueDescription?: string;
  rejectReason?: RejectReason | string;
  rejectNotes?: string;
  evidencePhotoUrls?: string;
  transferToPaidRepair?: boolean;
  repairTicketId?: string;
  repairTicketCode?: string;
  vendorName?: string;
  vendorTicketNumber?: string;
  trackingNumber?: string;
  vendorSubStatus?: VendorSubStatus | string;
  createdAt: string;
  createdBy?: string;
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

export interface RejectWarrantyCommand {
  warrantyTicketId: string;
  reason: RejectReason;
  rejectNotes: string;
  evidencePhotoUrls?: string;
  transferToPaidRepair: boolean;
  rowVersion: string;
}

export interface TransferToInHouseRepairCommand {
  warrantyTicketId: string;
  componentDiagnosis: string;
  technicianId?: string;
  rowVersion: string;
}

export interface ReplaceDeviceCommand {
  warrantyTicketId: string;
  newImei: string;
  reason?: string;
  rowVersion: string;
}

export interface SendToVendorCommand {
  warrantyTicketId: string;
  vendorName: string;
  vendorTicketNumber: string;
  trackingNumber: string;
  notes?: string;
  rowVersion: string;
}

export interface DeliverToCustomerCommand {
  warrantyTicketId: string;
  receiverName?: string;
  notes?: string;
  rowVersion: string;
}


export interface WarrantyCheckResultDto {
  isUnderWarranty: boolean;
  warrantyStatus?: 'Active' | 'Expired' | 'NotFound' | string;
  remainingDays?: number;
  purchaseDate?: string;
  warrantyExpirationDate?: string;
  productVariantId?: string;
  productName: string;
  productSku: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
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

export interface CompleteStockTakeCommand {
  id: string;
  variantImeis?: {
    productVariantId: string;
    imeis: string[];
  }[];
}

export interface StockTakeItemDto {
  id: string;
  productVariantId: string;
  variantName: string;
  sku: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  note?: string;
  isImeiControlled?: boolean;
}

export interface StockTakeDto {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  status: 'Draft' | 'InProgress' | 'Completed' | 'Cancelled';
  createdAt: string;
  items: StockTakeItemDto[];
}

// ============================================
// WAREHOUSE TRANSFER MODULE
// ============================================
export interface WarehouseTransferItemDto {
  id: string;
  productVariantId: string;
  variantName: string;
  sku: string;
  quantity: number;
}

export interface WarehouseTransferDto {
  id: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  code: string;
  status: string; // 'Pending' | 'InTransit' | 'Received' | 'Cancelled'
  createdAt: string;
  items: WarehouseTransferItemDto[];
}

export interface CreateWarehouseTransferItemCommand {
  productVariantId: string;
  quantity: number;
}

export interface CreateWarehouseTransferCommand {
  fromWarehouseId: string;
  toWarehouseId: string;
  code: string;
  items: CreateWarehouseTransferItemCommand[];
}

export interface ProductVariantImeisDto {
  productVariantId: string;
  imeis: string[];
}

export interface ShipWarehouseTransferCommand {
  id: string;
  variantImeis?: ProductVariantImeisDto[];
}

export interface ReceiveWarehouseTransferCommand {
  id: string;
  variantImeis?: ProductVariantImeisDto[];
}

