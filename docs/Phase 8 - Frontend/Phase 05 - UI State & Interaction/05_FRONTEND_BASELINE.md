# 05.1 EXISTING FRONTEND BASELINE

> **Objective:** Establish a trustworthy snapshot of the existing frontend codebase before any UI/UX or architectural modifications.

## 1. Technical Stack (CONFIRMED)
- **Repository:** src/frontend/
- **Framework:** React 19.2 (eact, eact-dom)
- **Language:** TypeScript (	sx)
- **Package Manager:** npm
- **Build System:** Vite
- **Routing:** eact-router-dom
- **API Client:** xios (with global interceptors in utils/axiosClient.ts)
- **State Management (Client):** zustand (e.g., uthStore.ts, 	hemeStore.ts)
- **State Management (Server):** @tanstack/react-query (Configured with 5m staleTime)
- **Forms & Validation:** eact-hook-form + zod
- **Styling:** Tailwind CSS (@tailwindcss/vite)
- **Realtime / Websockets:** @microsoft/signalr

## 2. Architectural Patterns (OBSERVED)
- **Feature-sliced Design Transition:** The codebase appears to be in a transition phase. Newer modules (e.g., products, customers, purchase-orders) use a src/features/ architecture with eact-hook-form and eact-query hooks. Older screens (e.g., PosPage, StockTakePage) are located in src/pages/ and use raw useState.
- **Global Error Handling:** xiosClient.ts intercepts network errors, 401 (triggers token refresh), 403 (Forbidden toast), 409 (Concurrency toast), and 500. 400 Bad Request is passed to components.
- **Authorization Guard:** ProtectedRoute.tsx wraps routes, checking useAuthStore().roles and hasPermission.

## 3. Screen Inventory (OBSERVED vs Phase 04)
The frontend currently implements MORE screens than the Phase 04 Baseline documented.
- **Mapped in Phase 04:**
  - PosPage.tsx (SCR-SALES-01)
  - WarrantyReplacementModal.tsx (SCR-WTY-02)
  - StockTakePage.tsx (SCR-INV-01)
- **Undocumented in Phase 04 (Existing in Frontend):**
  - RepairIntakePage.tsx, RepairListPage.tsx (Fills Phase 04 GAP-SCR-01)
  - PurchaseOrderListPage.tsx, PurchaseOrderFormModal.tsx (Fills Phase 04 GAP-SCR-02)
  - WarehouseTransferModal.tsx (Fills Phase 04 GAP-SCR-03)
  - Various CRUD list pages (ProductListPage, CustomerListPage, etc.)

## 4. Known Technical Debt & Deficiencies (OBSERVED)
1. **Mocked Mutations:** StockTakePage.tsx uses a setTimeout fake API call instead of integrating with POST /api/StockTake.
2. **Missing Concurrency Tokens:** WarrantyReplacementModal.tsx updates status but does NOT pass RowVersion to the API client, breaking EF Core concurrency protection.
3. **Incomplete Business Workflows:** PosPage.tsx only calls createOrder (Draft status) and falsely reports "Order paid successfully" without ever calling updateOrderStatus to transition to Completed.
4. **Missing Loading Locks:** PosPaymentModal.tsx lacks isSubmitting state, allowing potential duplicate submissions.
