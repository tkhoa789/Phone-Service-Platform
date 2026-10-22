# PC-09A Implementation Report

## Architecture
- Transformed legacy POS to PC-02/FSD architecture.
- Created `src/features/pos/` directory.
- Migrated data fetching from local `useEffect` calls to React Query (`usePosCatalog`, `usePosCheckout`).

## UI Rebuild
- **PosPage**: Rewritten using PC-03 `Card`, `Badge`, and split-pane flex/grid layouts. All `--neu-bg-base` styling removed.
- **PosPaymentModal**: Rebuilt using `Dialog` and `react-hook-form`.
- **PosK80Receipt**: Preserved EXACTLY as a print contract to avoid breaking physical printer layouts.

## Invariant Preservation
- **Checkout API**: 2-step process preserved (`createOrder` -> `updateOrderStatus`) inside `usePosCheckout` mutation.
- **Idempotency**: `idempotencyKeyRef` preserved and carefully passed into the mutation, resetting only upon success.
- **Cart Logic**: Kept completely identical. Subtotal, voucher math, and change given math were mapped directly to the new UI structure.
