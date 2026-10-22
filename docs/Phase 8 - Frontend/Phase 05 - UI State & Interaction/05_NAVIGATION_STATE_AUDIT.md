# 05.4 NAVIGATION STATE AUDIT

## 1. Route Entry & Guards (OBSERVED)
- **Mechanism:** eact-router-dom with <ProtectedRoute>.
- **Unauthenticated:** Redirects to /login with state={{ from: location }} to preserve deep links.
- **Unauthorized:** Renders <AccessDeniedScreen> directly without changing URL.

## 2. Post-Mutation Navigation (OBSERVED)
- **POS Checkout (SCR-SALES-01):** Does NOT navigate to /sales/orders/:id as proposed in Phase 04. Instead, it stays on the POS page and opens a Receipt Modal (PosK80Receipt.tsx).
- **Warranty Swap (SCR-WTY-02):** Closes modal and triggers a parent reload (onSuccess callback), staying on the same list/detail view.

## 3. Unsaved Changes / Dirty Navigation
- **Status (UNKNOWN):** No global eact-router block transitions (usePrompt / unstable_useBlocker) were immediately observed in the legacy src/pages/ components for preventing accidental navigation away from dirty forms.
