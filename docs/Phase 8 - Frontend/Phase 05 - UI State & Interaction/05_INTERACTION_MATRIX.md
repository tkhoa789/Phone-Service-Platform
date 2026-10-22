# 05.3 INTERACTION MATRIX

> **Evidence Level Taxonomy:**
> - **OBSERVED:** Directly verified in frontend implementation.
> - **GAP:** Missing or incomplete compared to backend capabilities.
> - **CONTRADICTION:** Frontend behaves contrary to established rules.

| Screen | User Action | UI Response | API / Backend Effect | Success State | Failure State | Evidence Status |
|---|---|---|---|---|---|---|
| **SCR-SALES-01** | Add Product to Cart | Updates local cart state. | None (Local only). | Item added to list. | N/A | OBSERVED |
| **SCR-SALES-01** | Complete Payment | Closes modal immediately, triggers salesService.createOrder. | POST /api/SalesOrder (Creates Draft). | Toast Success, loads receipt modal. | Toast Error. | CONTRADICTION (UI claims "Paid" but only created Draft. Never calls updateOrderStatus). |
| **SCR-WTY-02** | Submit Swap IMEI | Sets loading=true, calls API. | PUT /api/WarrantyTicket/{id}/status | Toast Success, closes modal. | Toast Error. | GAP (Fails to pass RowVersion for concurrency control). |
| **SCR-INV-01** | Save Bulk Audit | Sets saving=true, fakes delay. | NONE (Stubbed setTimeout). | Toast Success, reloads UI. | Toast Error. | GAP (Does not call POST /api/StockTake). |
