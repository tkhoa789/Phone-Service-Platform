# PC-09A POS Rebuild Plan

## Phase 1: Foundation (No UI Change)
1. Initialize `src/features/pos/` FSD structure.
2. Port existing API calls to `usePosCatalog` and `usePosCheckout` React Query hooks. Ensure Idempotency Key logic is wired into the mutation.

## Phase 2: Cart & Layout
1. Construct the split-pane POS layout using `Card`.
2. Build the Product Grid and Category Filters using standard `Badge` and `SearchInput`.
3. Build the Cart pane (Item rows, quantity toggles, IMEI input).

## Phase 3: Checkout Modals
1. Migrate `PosPaymentModal` to PC-03 `Dialog`, using `react-hook-form` for cash calculation.
2. Wrap `PosK80Receipt` safely without disrupting print CSS.

## Phase 4: Wiring & QA
1. Bind Cart state to the new UI.
2. Execute test transactions to verify idempotency and checkout sequence.
3. Validate responsive behavior.