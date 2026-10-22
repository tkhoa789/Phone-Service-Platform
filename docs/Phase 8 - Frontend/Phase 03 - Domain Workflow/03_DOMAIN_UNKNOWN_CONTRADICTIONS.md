# 03.10 DOMAIN UNKNOWNS & CONTRADICTIONS

## Master Evidence Table

| ID | Finding | Type | Confidence | Source File | Line | Notes |
|---|---|---|---|---|---|---|
| E-01 | Roles rely on IsGlobalAdmin or BranchId to scope capabilities (in 6 audited modules). | ACTOR | OBSERVED | CurrentUserService.cs | 28 | No Domain User entity executes logic directly. |
| E-02 | SalesOrder Completed ➔ Cancelled triggers full reversal. | WORKFLOW | CONFIRMED | SalesOrderCommandHandlers.cs | 430 | Reverses Inventory, Imei, Voucher, Loyalty. |
| E-03 | RepairTicket cancellation enforces Part dispositions. | STATE INVARIANT | OBSERVED | RepairCommandHandlers.cs | 714 | Parts must be returned/written-off first. |
| E-04 | Warranty validation enforces 12-month rule. | DOMAIN INVARIANT | CONFIRMED | WarrantyCommandHandlers.cs | 50 | Requires Completed SalesOrder. |
| E-05 | No formal Domain Events are utilized in audited scope. | EVENT | OBSERVED | BaseEntity.cs | 1 | CQRS Handlers use inline orchestration. |
| E-06 | PurchaseOrder Complete triggers Inventory IMPORT. | WORKFLOW | OBSERVED | PurchaseOrderCommandHandlers.cs | 200 | Updates Inventory, Imei, Supplier Debt. |
| E-07 | WarehouseTransfer Ship/Receive moves Inventory and Imei. | WORKFLOW | CONFIRMED | WarehouseTransferCommandHandlers.cs | 150 | Updates Source/Dest Inventory. |
| E-08 | StockTake Complete adjusts Delta. | WORKFLOW | CONFIRMED | StockTakeCommandHandlers.cs | 120 | No explicit application-level blocking rule for SalesOrder during StockTake InProgress was identified. Concurrency behavior requires runtime verification. |
| E-09 | SalesOrder Generic status mutation permits target states Confirmed / Processing. | TRANSITION | UNKNOWN | SalesOrderCommandHandlers.cs | 480 | Technical transition path: OBSERVED. Canonical business workflow: UNKNOWN (No explicit from-to workflow guard identified). |
| E-10 | PurchaseOrder Draft ➔ Confirmed transition. | TRANSITION | UNKNOWN | PurchaseOrderCommandHandlers.cs | - | Missing explicit Confirm command. |

## Audit Summary
- **CONTRADICTIONS:** 0 identified within the audited scopes.
- **UNKNOWNS:** Transitions for Draft ➔ Confirmed ➔ Processing on SalesOrder and PurchaseOrder exist in Enums and are technically accepted by generic UpdateStatus commands, but lack dedicated workflow Command handlers establishing explicit guards.
