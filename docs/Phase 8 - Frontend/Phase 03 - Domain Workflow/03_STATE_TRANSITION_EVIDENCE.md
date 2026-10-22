# 03.4.1 STATE TRANSITION EVIDENCE

| Domain Object | From | To | Trigger | Guard | Side Effect | Source | Confidence |
|---|---|---|---|---|---|---|---|
| **SalesOrder** | (New) | Draft | CreateSalesOrder | Valid Branch/Customer | None | SalesOrderCommandHandlers.cs:L35 | OBSERVED |
| **SalesOrder** | Draft | Completed | UpdateStatus | Target = Completed; Current ≠ Cancelled | Inventory deduction, IMEI Status ➔ Sold, Voucher Usage++, CRM Points++ | SalesOrderCommandHandlers.cs:L339 | OBSERVED |
| **SalesOrder** | Confirmed | Completed | UpdateStatus | Target = Completed; Current ≠ Cancelled | Inventory deduction, IMEI Status ➔ Sold, Voucher Usage++, CRM Points++ | SalesOrderCommandHandlers.cs:L339 | OBSERVED |
| **SalesOrder** | Processing | Completed | UpdateStatus | Target = Completed; Current ≠ Cancelled | Inventory deduction, IMEI Status ➔ Sold, Voucher Usage++, CRM Points++ | SalesOrderCommandHandlers.cs:L339 | OBSERVED |
| **SalesOrder** | Completed | Cancelled | UpdateStatus | Target = Cancelled; Current = Completed | Inventory restored, IMEI Status ➔ InStock, IMEI Warehouse assignment ➔ restored, Voucher Usage--, CRM Points--, SALE_RETURN Tx | SalesOrderCommandHandlers.cs:L430 | CONFIRMED |
| **SalesOrder** | Draft/Conf/Proc | Cancelled | UpdateStatus | Target = Cancelled; Current ≠ Completed | None (Flag update only) | SalesOrderCommandHandlers.cs:L480 | OBSERVED |
| **SalesOrder** | Draft | Confirmed | UpdateStatus | Target = Confirmed | Flag update only | SalesOrderCommandHandlers.cs:L480 | UNKNOWN |
| **RepairTicket**| (New) | Draft | CreateRepair | Input valid | Checklist CheckIn generated | RepairCommandHandlers.cs:L54 | OBSERVED |
| **RepairTicket**| Any | Cancelled | CancelRepair | All parts must be Returned or WriteOff | Reverses deposits if needed | RepairCommandHandlers.cs:L714 | OBSERVED |
| **RepairPart** | (New) | Reserved | AddRepairPart | Stock exists | None (Flag update) | RepairCommandHandlers.cs:L138 | OBSERVED |
| **RepairPart** | Reserved/Issued | Returned | ReturnRepairPart| - | Inventory ➔ add, REPAIR_RETURN Tx | RepairCommandHandlers.cs:L586 | OBSERVED |
| **RepairPart** | Res/Iss/Inst | WriteOff | WriteOffRepairPart| - | Inventory ➔ deducted (burn), REPAIR_WRITEOFF Tx | RepairCommandHandlers.cs:L669 | OBSERVED |
| **PurchaseOrder**| Draft/Confirmed | Received | CompletePO | Target = Received | IMEI ➔ InStock (new entries), Inventory ➔ add, IMPORT Tx, Supplier Debt++ | PurchaseOrderCommandHandlers.cs:L200 | OBSERVED |
| **PurchaseOrder**| Draft/Confirmed | Cancelled | CancelPO | Target = Cancelled | None (Flag update) | PurchaseOrderCommandHandlers.cs:L315 | OBSERVED |
| **Transfer** | Pending | InTransit | ShipTransfer | Status == Pending | Source Inv ➔ deduct, IMEI Warehouse assignment ➔ null, TRANSFER_OUT Tx | WarehouseTransferCommandHandlers.cs:L150 | CONFIRMED |
| **Transfer** | InTransit | Received | ReceiveTransfer| Status == InTransit | Dest Inv ➔ add, IMEI Warehouse assignment ➔ ToWarehouseId, TRANSFER_IN Tx | WarehouseTransferCommandHandlers.cs:L250 | CONFIRMED |
| **Transfer** | InTransit | Cancelled | CancelTransfer | Status == InTransit | Source Inv ➔ add (rollback), IMEI Warehouse assignment ➔ FromWarehouseId | WarehouseTransferCommandHandlers.cs:L330 | CONFIRMED |
| **StockTake** | Draft | InProgress | StartStockTake | Status == Draft | None | StockTakeCommandHandlers.cs:L80 | CONFIRMED |
| **StockTake** | InProgress | Completed | CompleteStockTake| Status == InProgress| Inventory ➔ add/deduct Delta, Missing IMEI Status ➔ Lost, Found IMEI Status ➔ InStock, STOCKTAKE_ADJUSTMENT Tx | StockTakeCommandHandlers.cs:L120 | CONFIRMED |
| **WarrantyTicket**| (New) | Received | CreateWarranty | IMEI InStock & SalesOrder Completed & < 12 Months | IMEI Status ➔ WarrantyHold | WarrantyCommandHandlers.cs:L50 | CONFIRMED |
| **WarrantyTicket**| Received | Processing | UpdateStatus | Target = Processing | None | WarrantyCommandHandlers.cs:L150 | CONFIRMED |
| **WarrantyTicket**| Received/Proc | Completed | UpdateStatus | Target = Completed | (Depends on Swap/Return, see Side Effects) | WarrantyCommandHandlers.cs:L150 | CONFIRMED |
| **WarrantyTicket**| Received/Proc | Rejected | UpdateStatus | Target = Rejected | Original IMEI Status ➔ Sold | WarrantyCommandHandlers.cs:L150 | CONFIRMED |
| **WarrantyTicket**| Received/Proc | Cancelled | UpdateStatus | Target = Cancelled | Original IMEI Status ➔ Sold | WarrantyCommandHandlers.cs:L150 | CONFIRMED |

> **Business Side Effect (Warranty Swap - Observed):** When updating to Completed with a New IMEI, it is not a pure state transition but a cross-entity side effect: WarrantyTicket state changes to Completed, Old IMEI Status ➔ Disposed, New IMEI Status ➔ Sold and New IMEI Warehouse assignment ➔ 
ull. If returning the original device, Original IMEI Status ➔ Sold.
