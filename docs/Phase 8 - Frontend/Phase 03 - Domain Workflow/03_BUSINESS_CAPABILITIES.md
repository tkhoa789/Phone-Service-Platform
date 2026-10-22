# 03.2 BUSINESS CAPABILITIES

*Derived from 166 RESTful Endpoints across 25 Controllers and Deep Handler Logic Audit.*

## 1. Sales & Checkout
- **Create Sales Order:** (Input: Cart, Output: Draft Order). 
- **Process Order:** Deducts stock, applies vouchers, earns CRM points. (State: Completed).
- **Cancel Order:** Restores stock, voids points. (State: Cancelled).
- **Confidence:** OBSERVED via SalesOrderCommandHandlers.

## 2. Repair & Service
- **Receive Device:** (Input: Device Info, Output: Draft Ticket + CheckIn Checklist).
- **Assign Parts:** Reserves Inventory to RepairTicket.
- **Collect Deposit:** Tracks prepayments (RepairDepositStatus).
- **Repair Completion:** The system supports status updates including WaitingForPayment and Completed.
  - **Confidence:** OBSERVED
  - **Note:** Explicit business transition guards between repair states were not established in the audited handler.

## 3. Procurement (Purchase Order)
- **Finding:** Procurement API capability exists. **Confidence:** CONFIRMED
- **Finding:** Purchase Order lifecycle exists (Create, Update, Complete, Cancel). **Confidence:** OBSERVED
- **Finding:** PO completion updates inventory. **Confidence:** OBSERVED
- **Finding:** Complete Procurement business process. **Confidence:** UNKNOWN (Draft ➔ Confirmed gap).

## 4. Warehousing & Transfers
- **StockTake:** Generates STOCKTAKE_ADJUSTMENT transactions for deltas, updates IMEI statuses (Missing ➔ Lost, Found ➔ InStock). No explicit application-level blocking rule for SalesOrder during StockTake InProgress was identified in the audited handlers. Database concurrency behavior is therefore determined by the observed transaction/concurrency mechanisms and requires runtime verification for exact conflict semantics.
- **Warehouse Transfer:** Deducts source stock (TRANSFER_OUT) on Ship, adds dest stock (TRANSFER_IN) on Receive. Handles transit cancellations gracefully.
- **Confidence:** CONFIRMED via explicit guards in StockTakeCommandHandlers and WarehouseTransferCommandHandlers.

## 5. Warranty & After-Sales
- **Register Warranty:** Validates IMEI exists on a Completed SalesOrder within 12 months. Marks IMEI as WarrantyHold.
- **Process Warranty:** Warranty completion can result in IMEI state changes associated with device return or replacement behavior observed in the handler. Swap behavior is explicitly evidenced. A separate user-facing "Return without Swap" operation is NOT established.
- **Confidence:** CONFIRMED via WarrantyCommandHandlers.
