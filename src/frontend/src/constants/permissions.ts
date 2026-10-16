/**
 * CANONICAL PERMISSIONS (RBAC-02)
 *
 * Frontend canonical permission constants mirroring backend PSP.Domain.Common.Constants.Permissions.
 * Format: <Resource>.<ACTION>
 */

export const PERMISSIONS = {
  // Dashboard
  Dashboard_View: 'Dashboard.VIEW',
  Dashboard_Export: 'Dashboard.EXPORT',

  // Revenue
  Revenue_View: 'Revenue.VIEW',
  Revenue_Export: 'Revenue.EXPORT',

  // POS
  POS_View: 'POS.VIEW',
  POS_Create: 'POS.CREATE',

  // SalesOrder
  SalesOrder_View: 'SalesOrder.VIEW',
  SalesOrder_Create: 'SalesOrder.CREATE',
  SalesOrder_Update: 'SalesOrder.UPDATE',
  SalesOrder_Cancel: 'SalesOrder.CANCEL',

  // Invoice
  Invoice_View: 'Invoice.VIEW',
  Invoice_Create: 'Invoice.CREATE',
  Invoice_Cancel: 'Invoice.CANCEL',
  Invoice_Export: 'Invoice.EXPORT',

  // Voucher
  Voucher_View: 'Voucher.VIEW',
  Voucher_Apply: 'Voucher.APPLY',
  Voucher_Create: 'Voucher.CREATE',
  Voucher_Update: 'Voucher.UPDATE',
  Voucher_Delete: 'Voucher.DELETE',

  // Repair
  Repair_View: 'Repair.VIEW',
  Repair_Create: 'Repair.CREATE',
  Repair_Diagnose: 'Repair.DIAGNOSE',
  Repair_Update: 'Repair.UPDATE',
  Repair_Complete: 'Repair.COMPLETE',
  Repair_Cancel: 'Repair.CANCEL',
  Repair_Deposit: 'Repair.DEPOSIT',
  Repair_Refund: 'Repair.REFUND',
  Repair_UpdatePart: 'Repair.PART_STATUS',
  Repair_ReturnPart: 'Repair.PART_RETURN',
  Repair_WriteOffPart: 'Repair.WRITEOFF',

  // Warranty
  Warranty_View: 'Warranty.VIEW',
  Warranty_Create: 'Warranty.CREATE',
  Warranty_Update: 'Warranty.UPDATE',
  Warranty_Complete: 'Warranty.COMPLETE',
  Warranty_Cancel: 'Warranty.CANCEL',

  // Customer
  Customer_View: 'Customer.VIEW',
  Customer_Create: 'Customer.CREATE',
  Customer_Update: 'Customer.UPDATE',
  Customer_Delete: 'Customer.DELETE',

  // Product
  Product_View: 'Product.VIEW',
  Product_Create: 'Product.CREATE',
  Product_Update: 'Product.UPDATE',
  Product_Delete: 'Product.DELETE',
  Product_Import: 'Product.IMPORT',
  Product_Export: 'Product.EXPORT',

  // Inventory
  Inventory_View: 'Inventory.VIEW',
  Inventory_Adjust: 'Inventory.ADJUST',
  Inventory_ManageMinimumStock: 'Inventory.MANAGE_MINIMUM_STOCK',

  // IMEI
  IMEI_View: 'IMEI.VIEW',
  IMEI_Manage: 'IMEI.MANAGE',

  // StockTake
  StockTake_View: 'StockTake.VIEW',
  StockTake_Create: 'StockTake.CREATE',
  StockTake_Start: 'StockTake.START',
  StockTake_Update: 'StockTake.UPDATE',
  StockTake_Submit: 'StockTake.SUBMIT',
  StockTake_Complete: 'StockTake.COMPLETE',
  StockTake_Cancel: 'StockTake.CANCEL',

  // Supplier
  Supplier_View: 'Supplier.VIEW',
  Supplier_Create: 'Supplier.CREATE',
  Supplier_Update: 'Supplier.UPDATE',
  Supplier_Delete: 'Supplier.DELETE',
  Supplier_PayDebt: 'Supplier.PAY_DEBT',

  // PurchaseOrder
  PurchaseOrder_View: 'PurchaseOrder.VIEW',
  PurchaseOrder_Create: 'PurchaseOrder.CREATE',
  PurchaseOrder_Update: 'PurchaseOrder.UPDATE',
  PurchaseOrder_Receive: 'PurchaseOrder.RECEIVE',
  PurchaseOrder_Pay: 'PurchaseOrder.PAY',
  PurchaseOrder_Cancel: 'PurchaseOrder.CANCEL',

  // Warehouse
  Warehouse_View: 'Warehouse.VIEW',
  Warehouse_Create: 'Warehouse.CREATE',
  Warehouse_Update: 'Warehouse.UPDATE',
  Warehouse_Delete: 'Warehouse.DELETE',

  // WarehouseTransfer
  WarehouseTransfer_View: 'WarehouseTransfer.VIEW',
  WarehouseTransfer_Create: 'WarehouseTransfer.CREATE',
  WarehouseTransfer_Update: 'WarehouseTransfer.UPDATE',
  WarehouseTransfer_Ship: 'WarehouseTransfer.SHIP',
  WarehouseTransfer_Receive: 'WarehouseTransfer.RECEIVE',
  WarehouseTransfer_Cancel: 'WarehouseTransfer.CANCEL',

  // Branch
  Branch_View: 'Branch.VIEW',
  Branch_Create: 'Branch.CREATE',
  Branch_Update: 'Branch.UPDATE',
  Branch_Delete: 'Branch.DELETE',

  // User
  User_View: 'User.VIEW',
  User_Create: 'User.CREATE',
  User_Update: 'User.UPDATE',
  User_Delete: 'User.DELETE',
  User_ManageRoles: 'User.MANAGE_ROLES',

  // Role
  Role_View: 'Role.VIEW',
  Role_Manage: 'Role.MANAGE',

  // SystemSettings
  SystemSettings_View: 'SystemSettings.VIEW',
  SystemSettings_Update: 'SystemSettings.UPDATE',

  // AuditLog
  AuditLog_View: 'AuditLog.VIEW',
  AuditLog_Export: 'AuditLog.EXPORT',

  // Notification
  Notification_View: 'Notification.VIEW',
  Notification_Send: 'Notification.SEND',

  // AI
  AI_Chat: 'AI.CHAT',
  AI_Analytics: 'AI.ANALYTICS',

  // --- Backward Compatibility Aliases ---
  USER_VIEW: 'User.VIEW',
  USER_CREATE: 'User.CREATE',
  USER_UPDATE: 'User.UPDATE',
  USER_DELETE: 'User.DELETE',
  USER_ASSIGN_ROLE: 'User.MANAGE_ROLES',
  BRANCH_VIEW: 'Branch.VIEW',
  BRANCH_CREATE: 'Branch.CREATE',
  BRANCH_UPDATE: 'Branch.UPDATE',
  BRANCH_DELETE: 'Branch.DELETE',
  CUSTOMER_VIEW: 'Customer.VIEW',
  CUSTOMER_CREATE: 'Customer.CREATE',
  CUSTOMER_UPDATE: 'Customer.UPDATE',
  CUSTOMER_DELETE: 'Customer.DELETE',
  PRODUCT_VIEW: 'Product.VIEW',
  PRODUCT_CREATE: 'Product.CREATE',
  PRODUCT_UPDATE: 'Product.UPDATE',
  PRODUCT_DELETE: 'Product.DELETE',
  PRODUCT_IMPORT: 'Product.IMPORT',
  PRODUCT_EXPORT: 'Product.EXPORT',
  INVENTORY_VIEW: 'Inventory.VIEW',
  INVENTORY_ADJUST: 'Inventory.ADJUST',
  PURCHASE_VIEW: 'PurchaseOrder.VIEW',
  PURCHASE_CREATE: 'PurchaseOrder.CREATE',
  PURCHASE_UPDATE: 'PurchaseOrder.UPDATE',
  SALES_VIEW: 'SalesOrder.VIEW',
  SALES_CREATE: 'SalesOrder.CREATE',
  INVOICE_VIEW: 'Invoice.VIEW',
  WARRANTY_VIEW: 'Warranty.VIEW',
  WARRANTY_CREATE: 'Warranty.CREATE',
  REPAIR_VIEW: 'Repair.VIEW',
  DASHBOARD_VIEW: 'Dashboard.VIEW',
  AUDIT_VIEW: 'AuditLog.VIEW',
  AI_CHAT: 'AI.CHAT',
  AI_ANALYTICS: 'AI.ANALYTICS',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
