# 04.5 NAVIGATION FLOWS

> **Evidence Level Taxonomy:**
> - **CONFIRMED:** Navigation strictly required by backend state machine.
> - **PROPOSED:** UI UX design for smoothing user journeys.

This document describes how users transition between screens to accomplish Business Workflows.

## Flow 1: Complete Sales Cycle
**Confidence:** PROPOSED (UX) based on OBSERVED backend capabilities.

1. User opens /sales/pos (SCR-SALES-01).
2. User adds items, selects customer, and clicks "Create Order".
3. UI calls POST /api/SalesOrder.
4. On success (HTTP 200, returns ID), UI auto-navigates to /sales/orders/:id (SCR-SALES-02) **(PROPOSED navigation)**.
5. User reviews the draft order and clicks "Complete Payment".
6. UI calls PUT /api/SalesOrder/:id/status.
7. On success, UI displays receipt modal and provides a button "Back to POS" which navigates back to /sales/pos.

## Flow 2: Warranty Swap Process
**Confidence:** PROPOSED (UX).

1. User opens /warranty/tickets and selects a ticket, navigating to /warranty/tickets/:id (SCR-WTY-02).
2. User selects "Swap Device", inputs NewImei.
3. UI calls PUT /api/WarrantyTicket/:id/status.
4. On success (HTTP 200), the UI does NOT navigate away **(PROPOSED navigation)**. Instead, it re-fetches the ticket data (GET /api/WarrantyTicket/:id) and re-renders the same screen in a "Read-Only Completed" state.
