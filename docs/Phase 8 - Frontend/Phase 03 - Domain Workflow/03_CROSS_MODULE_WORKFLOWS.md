# 03.7 CROSS-MODULE BUSINESS WORKFLOWS

> **Note on Architecture:** The workflows detailed below demonstrate *Observed Architectural Coupling*. Application Handlers directly mutate multiple domain entities synchronously within a single transaction. This represents an *Observed Workflow*, and should not be conflated with a formal DDD aggregate boundary relationship.

## Workflow 1: Sales Order Completion & Reversal
**Trigger:** `UpdateSalesOrderStatusCommand` (To `Completed` or `Cancelled`)
**Modules Involved:** Sales ➔ Inventory ➔ Marketing (Vouchers) ➔ CRM (Loyalty)

### Step 1: Inventory Deduction (Completion) / Reversal (Cancellation)
- **Action:** If Completed, the handler deducts physical stock. If Cancelled from Completed, it adds stock back.
- **Side Effect:** Inserts an `InventoryTransactionEntity` with type `SALE` or `SALE_RETURN`.
- **Evidence:** `SalesOrderCommandHandlers.cs:L388`

### Step 2: Voucher Consumption
- **Action:** Increments `UsageCount` on the attached `VoucherId`. If `UsageCount >= UsageLimit`, flips Voucher state to `Used`.
- **Side Effect:** Modifies `VoucherEntity`.
- **Evidence:** `SalesOrderCommandHandlers.cs:L407`

### Step 3: CRM Loyalty Points
- **Action:** Adds `order.Total / 10000m` to `CustomerEntity.RewardPoints`.
- **Side Effect:** Modifies `CustomerEntity`.
- **Evidence:** `SalesOrderCommandHandlers.cs:L420`

## Workflow 2: Repair Part Lifecycle
**Trigger:** `AddRepairPartCommand`, `ReturnRepairPartCommand`, `WriteOffRepairPartCommand`
**Modules Involved:** Repair ➔ Inventory

### Step 1: Part Allocation & Disposition
- **Action:** When parts are issued to a repair ticket, inventory is reserved/deducted. When a technician returns them, or a ticket is cancelled, the parts must be returned or written off.
- **Side Effect:** Generates `InventoryTransactionEntity` of type `REPAIR_RETURN` or `REPAIR_WRITEOFF`.
- **Evidence:** `RepairCommandHandlers.cs:L586`, `L669`

## Workflow 3: Warranty Swap
**Trigger:** `UpdateWarrantyStatusCommand`
**Modules Involved:** Warranty ➔ Inventory

### Step 1: Device Exchange
- **Action:** When a warranty ticket is completed with a replacement device (New IMEI), the handler disposes of the original and ships the new one.
- **Side Effect:** Old IMEI Status ➔ `Disposed`. New IMEI Status ➔ `Sold` and New IMEI Warehouse assignment ➔ `null`.
- **Evidence:** `WarrantyCommandHandlers.cs:L150`
