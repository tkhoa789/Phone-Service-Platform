# 04.1 SCREEN INVENTORY

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Frontend screen code already exists (None in current scope).
> - **OBSERVED:** Backend capability explicitly identified in controllers/handlers.
> - **INFERRED:** Screen logically deduced from Use Case and API endpoints.
> - **PROPOSED:** UI design recommendation.
> - **UNKNOWN:** Missing capability or evidence.
> - **GAP:** Backend capability exists but no Screen candidate has yet been mapped.

*Note: Since the frontend does not yet exist, most screens below are classified as **INFERRED** or **PROPOSED** based on backend OBSERVED capabilities.*

## SCR-SALES-01: POS Checkout
- **Screen ID:** SCR-SALES-01
- **Screen Name:** POS Checkout
- **Purpose:** Allow staff to build a cart, apply vouchers, and initiate a sales order.
- **Actor (INFERRED):** Cashier / Store Staff
- **Backend Allowed Role (CONFIRMED):** Sales, Manager, Admin, Owner
- **Screen Access (PROPOSED):** Sales, Manager, Admin, Owner
- **Related Use Case:** Create Sales Order (POS Checkout Initiation)
- **Backend Capability (OBSERVED):** Create Sales Order (Draft creation)
- **API(s):** POST /api/SalesOrder (CONFIRMED via SalesOrderController.cs)
- **Entry Point (PROPOSED):** Main Navigation Sidebar -> "Bán hàng (POS)"
- **Exit / Next Screen (PROPOSED):** SCR-SALES-02 (Order Payment/Details)
- **Evidence Level:** INFERRED
- **Unknowns:** None.

## SCR-SALES-02: Order Payment & Confirmation
- **Screen ID:** SCR-SALES-02
- **Screen Name:** Order Payment & Confirmation
- **Purpose:** Complete the payment and finalize the draft order to deduct inventory.
- **Actor (INFERRED):** Cashier / Store Staff
- **Backend Allowed Role (CONFIRMED):** Sales, Manager, Admin, Owner
- **Screen Access (PROPOSED):** Sales, Manager, Admin, Owner
- **Related Use Case:** Complete Sales Order (Payment & Handover)
- **Backend Capability (OBSERVED):** Process Order (Draft -> Completed)
- **API(s):** PUT /api/SalesOrder/{id}/status (CONFIRMED via SalesOrderController.cs)
- **Entry Point (PROPOSED):** Auto-redirect from SCR-SALES-01 or clicked from Order History.
- **Exit / Next Screen (PROPOSED):** Receipt Modal -> Back to SCR-SALES-01
- **Evidence Level:** INFERRED
- **Unknowns:** Does the business strictly require a "Confirmed" intermediate screen before "Completed"? (Backend capability allows direct jump).

## SCR-WTY-01: Warranty Intake
- **Screen ID:** SCR-WTY-01
- **Screen Name:** Warranty Intake
- **Purpose:** Intake defective device, validate 12-month rule, and generate ticket.
- **Actor (INFERRED):** Customer Service / Technician
- **Backend Allowed Role (CONFIRMED):** Sales, Manager, Admin, Owner, Technician
- **Screen Access (PROPOSED):** Sales, Manager, Admin, Owner, Technician
- **Related Use Case:** Register Warranty Ticket
- **Backend Capability (OBSERVED):** Warranty creation & IMEI validation (BR-901, BR-902)
- **API(s):** POST /api/WarrantyTicket (CONFIRMED via WarrantyTicketController.cs)
- **Entry Point (PROPOSED):** Main Navigation -> "Tiếp nhận bảo hành"
- **Exit / Next Screen (PROPOSED):** SCR-WTY-02 (Warranty Details)
- **Evidence Level:** INFERRED
- **Unknowns:** None.

## SCR-WTY-02: Warranty Processing
- **Screen ID:** SCR-WTY-02
- **Screen Name:** Warranty Processing
- **Purpose:** Handle the resolution of a warranty ticket (Swap for new IMEI).
- **Actor (INFERRED):** Technician
- **Backend Allowed Role (CONFIRMED):** Technician, Manager, Owner, Admin, Sales
- **Screen Access (PROPOSED):** Technician, Manager, Owner, Admin, Sales
- **Related Use Case:** Process Warranty (Swap Device)
- **Backend Capability (OBSERVED):** Update Warranty Status to Completed with explicit RowVersion check and NewImei logic.
- **API(s):** PUT /api/WarrantyTicket/{id}/status (CONFIRMED via WarrantyTicketController.cs)
- **Entry Point (PROPOSED):** Warranty List -> Click Ticket
- **Exit / Next Screen (PROPOSED):** Reload current screen in Read-Only state.
- **Evidence Level:** INFERRED
- **Unknowns:** A separate user-facing "Return without Swap" operation is NOT established.

## SCR-INV-01: Stock Take Execution
- **Screen ID:** SCR-INV-01
- **Screen Name:** Stock Take Execution
- **Purpose:** Allow warehouse staff to verify physical inventory against system records and adjust discrepancies.
- **Actor (INFERRED):** Warehouse Staff / Manager
- **Backend Allowed Role (CONFIRMED):** Manager, Admin, Owner
- **Screen Access (PROPOSED):** Manager, Admin, Owner
- **Related Use Case:** Execute StockTake
- **Backend Capability (OBSERVED):** StockTake process generating STOCKTAKE_ADJUSTMENT and mutating IMEI statuses.
- **API(s):** POST /api/StockTake (CONFIRMED via StockTakeController.cs)
- **Entry Point (PROPOSED):** Main Navigation -> "Kiểm kho"
- **Exit / Next Screen (PROPOSED):** Stock Take History
- **Evidence Level:** INFERRED
- **Unknowns:** Exact concurrency UI strategy if a Sale happens simultaneously, as backend lacks explicit blocking lock.

---

## 3. Capability-to-Screen Coverage

| Backend Capability | Screen Candidate | Status |
|---|---|---|
| Sales Order Create | SCR-SALES-01 | MAPPED |
| Sales Order Complete | SCR-SALES-02 | MAPPED |
| Warranty Create | SCR-WTY-01 | MAPPED |
| Warranty Process/Swap | SCR-WTY-02 | MAPPED |
| Stock Take | SCR-INV-01 | MAPPED |
| Repair Ticket | — | GAP |
| Purchase Order | — | GAP |
| Warehouse Transfer | — | GAP |

## 4. Unmapped Backend Capabilities (GAPs)
The following GAPs represent Backend Capabilities that have been CONFIRMED/OBSERVED in Phase 01/03 but lack mapped Screen Candidates. They are preserved as candidate work.

- **GAP-SCR-01:** Repair & Service Capability exists (RepairTicketController.cs). At least two candidate screens (e.g., Repair Intake, Repair Processing) are required to represent the currently mapped repair capabilities; final screen decomposition is deferred to later UI design phases.
- **GAP-SCR-02:** Procurement Capability exists (PurchaseOrderController.cs). Missing Purchase Order Management candidate screen.
- **GAP-SCR-03:** Warehouse Transfer Capability exists (WarehouseTransferController.cs). Missing Warehouse Transfer candidate screen.

> **Status Update:**
> - Mapped Screen Traceability: **COMPLETE**
> - Product Screen Coverage: **INCOMPLETE** (3 Unmapped Backend Capabilities)

