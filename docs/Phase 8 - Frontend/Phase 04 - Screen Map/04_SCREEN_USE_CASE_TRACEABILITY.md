# 04.2 SCREEN TO USE CASE TRACEABILITY

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Direct link established in existing frontend code (None).
> - **OBSERVED:** Link logically derived from backend Handler workflows.
> - **INFERRED:** Deduced mapping for standard CRUD/List screens.
> - **PROPOSED:** UI design choice for better UX.

This matrix ensures every proposed screen is directly backed by a verified backend use case and capability, preventing the UI from inventing unsupported features.

| Screen ID | Screen Name | Related Application Use Case | Backend Capability (OBSERVED) | Confidence Level |
|---|---|---|---|---|
| SCR-SALES-01 | POS Checkout | Create Sales Order (Draft Initiation) | CreateSalesOrderCommand | **OBSERVED** |
| SCR-SALES-02 | Order Payment | Complete Sales Order (Payment & Handover) | UpdateSalesOrderStatusCommand (Draft ➔ Completed) | **OBSERVED** |
| SCR-WTY-01 | Warranty Intake | Register Warranty Ticket | CreateWarrantyTicketCommand (with BR-901/BR-902 checks) | **OBSERVED** |
| SCR-WTY-02 | Warranty Processing | Process Warranty (Swap Device) | UpdateWarrantyStatusCommand (with RowVersion check) | **OBSERVED** |
| SCR-INV-01 | Stock Take Execution | Execute Stock Take | StockTakeCommandHandlers (Generates ADJUSTMENT) | **OBSERVED** |

## Missing Capabilities (Negative Traceability)
If the business requests a screen that has no corresponding backend capability, it is documented here to block UI development until the backend is updated.
- **Example:** SCR-ANALYTICS-01 (Realtime Sales Dashboard via SignalR). **Status: BLOCKED.** Evidence shows NotificationHub does not broadcast domain state changes.
