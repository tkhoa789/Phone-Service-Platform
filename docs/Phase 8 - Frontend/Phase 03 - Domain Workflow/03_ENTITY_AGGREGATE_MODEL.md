# 03.9 ENTITY & AGGREGATE MODEL

> **Disclaimer:** Aggregate boundaries in this document are candidate architectural interpretations inferred from observed command/handler transaction boundaries. They are not confirmed business-domain aggregate definitions.

## 1. Candidate Aggregate Root: SalesOrder
- **Root:** SalesOrderEntity
- **Candidate associated entities:** SalesOrderItemEntity
- **Observed mutation path:** SalesOrderItemEntity is mutated through SalesOrder-related commands in the audited scope.
- **Transaction Boundary:** Overreaches strict boundaries (mutates Inventory, Imei, Voucher, Customer directly within one monolithic EF transaction).
- **Confidence:** INFERRED as Aggregate Root due to transaction overreach.

## 2. Candidate Aggregate Root: RepairTicket
- **Root:** RepairTicketEntity
- **Candidate associated entities:** RepairPartEntity, RepairChecklistEntity, RepairDepositEntity
- **Observed:** RepairPartEntity, RepairChecklistEntity and RepairDepositEntity are accessed/mutated using RepairTicket context in the audited handlers.
- **Confidence:** INFERRED as Aggregate Root.

## 3. Candidate Aggregate Root: PurchaseOrder (Procurement)
- **Root:** PurchaseOrderEntity
- **Candidate associated entities:** PurchaseOrderItemEntity
- **Observed mutation path:** PurchaseOrderItemEntity is accessed through PurchaseOrder context.
- **Confidence:** INFERRED as Aggregate Root.

## 4. Entity: Inventory & Warehouse
- **Observation:** No strict DDD aggregate ownership of InventoryEntity/ImeiEntity by WarehouseEntity was established from the audited command handlers and repository boundaries. These entities are directly mutated by multiple workflows (Sales, Repair, Procurement, StockTake, Transfer).
- **Ledger Entity:** InventoryTransactionEntity is observed to be created as a transaction/ledger record by the audited workflows. Append-only semantics: UNKNOWN (Not established).
- **Conclusion:** Warehouse acts as a reference context. Whether Warehouse is an Aggregate Root is NOT ESTABLISHED.
- **Confidence:** OBSERVED mutation pattern.
