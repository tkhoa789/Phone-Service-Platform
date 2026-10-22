# 04.6 SCREEN UNKNOWNS & CONTRADICTIONS

> **Evidence Level Taxonomy:**
> - **UNKNOWN:** Missing capability or evidence required to finalize a screen design.
> - **CONTRADICTION:** Conflicting evidence between backend layers.

## 1. Active Unknowns

| Unknown ID | Description | Impact on Screen Map | Proposed Resolution Path |
|---|---|---|---|
| U-SCR-01 | **Live Dashboard Feasibility:** No SignalR domain events were identified. | Blocks creation of a realtime /dashboard/live-sales screen. | Build the screen using short-polling (PROPOSED), or wait for Backend to implement Domain Events. |
| U-SCR-02 | **Procurement Canonical Workflow:** Is the transition from Draft ➔ Confirmed ➔ Completed strict for PurchaseOrders? | Blocks the exact "Next Button" logic on the Procurement Screen. | Keep UI flexible. Expose available transition buttons dynamically based on current backend state. |
| U-SCR-03 | **Stock Take Concurrency:** Can a POS Checkout (SCR-SALES-01) occur while SCR-INV-01 is performing a Stock Take? | Affects whether the POS screen needs a "Lockout" state during Inventory events. | Check database trigger / RowVersion logic in Phase 05/06 testing. For now, rely on CONCURRENCY_ERROR 409 handling. |

## 2. Active Contradictions

- **0 CONTRADICTIONS IDENTIFIED.** The mapping from Backend Capabilities to Frontend Screens is strictly traceable and logical.
