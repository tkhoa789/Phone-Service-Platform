# 04.2 UI WORKFLOWS AND STATE

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Backend behavior backed by explicit code.
> - **OBSERVED:** Implementation behavior observed in handlers.
> - **INFERRED:** Architectural implication.
> - **PROPOSED:** Frontend design and navigation strategy.
> - **UNKNOWN:** Backend capability is unclear or missing.

## 1. Sales Order UI Workflow
*Traceability: Code Evidence ➔ API Capability ➔ UI Workflow ➔ UI State*

**Backend Capability (OBSERVED):** UpdateSalesOrderStatusCommand technically allows transitioning from Draft / Confirmed / Processing directly to Completed without strict intermediate state-by-state progression checks (other than Current != Cancelled).

**Proposed UI Workflow (PROPOSED):**
To align UX with the observed capability, the UI does not enforce undocumented intermediate transitions.
1. **Cart State (Local UI):** User builds cart.
2. **Checkout (POST /api/SalesOrder):** UI transitions to **Draft** order view.
3. **Payment & Handover (PUT /api/SalesOrder/{id}/status ➔ Completed):** Since the backend accepts Draft ➔ Completed, the UI provides a "Complete Payment" button directly on the Draft screen.
4. **Receipt State:** UI displays Success receipt. Cart is cleared.

## 2. Warranty Ticket Intake Workflow
**Backend Capability (CONFIRMED):** CreateWarrantyTicketCommand enforces BR-901 (SalesOrder must be completed) and BR-902 (< 12 months) synchronously during creation.

**Proposed UI Workflow (PROPOSED):**
1. **Search UI:** User inputs IMEI. UI queries IMEI history (PROPOSED API call).
2. **Intake Validation UI:** If UI detects > 12 months, it should pre-warn the user. However, backend acts as the ultimate enforcer.
3. **Creation:** Upon POST /api/WarrantyTicket, if successful, UI navigates to Ticket Details (Received state).
4. **Error State:** If Backend throws 400 BAD_REQUEST (e.g., exceeded 12 months), UI displays the business error modal inline.

## 3. UI State Management (PROPOSED)
Due to the **Observed Architectural Coupling** (monolithic EF transactions modifying multiple entities synchronously), the UI architecture adopts the following state management recommendations:
- **Server-Confirmed UI State:** Cross-module mutations should initially use server-confirmed UI state rather than optimistic state updates, because the audited backend operation performs multiple synchronous side effects and may fail on cross-entity validation.
- **Action-Level Blocking:** Use mutation-scoped loading/blocking until the server response is received. After successful mutation, invalidate/refetch affected client-side queries as appropriate.
