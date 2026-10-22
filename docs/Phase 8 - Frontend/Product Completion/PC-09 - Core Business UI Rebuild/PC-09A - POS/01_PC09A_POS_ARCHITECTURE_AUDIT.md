# PC-09A POS Architecture Audit

## Current State
The Point of Sale (POS) domain is currently housed primarily in:
- `src/pages/sales/PosPage.tsx`
- `src/components/pos/PosPaymentModal.tsx`
- `src/components/pos/PosK80Receipt.tsx`

## Key Characteristics
- **State Management**: Heavily relies on local `useState` (for cart, search, selection) and `useEffect` (for initial data loading).
- **Data Fetching**: Manual calls to `productService`, `customerService`, `salesService`, `voucherService`. **React Query is NOT utilized.**
- **Idempotency Protection**: Uses a `useRef(crypto.randomUUID())` to prevent double-submit on the checkout API.
- **Workflow Mechanics**: 
  1. Add items to cart (manual click or barcode input).
  2. Modify quantities/IMEI.
  3. Select Customer / Apply Voucher.
  4. Proceed to Payment (opens `PosPaymentModal`).
  5. API sequence: `createOrder` -> `updateOrderStatus('Completed')`.
  6. Opens `PosK80Receipt` modal for printing.

## Rebuild Imperative
The POS screen is the most critical operational UI. The rebuild must transition the POS to the PC-02/FSD standard, introducing React Query and Zustand (if necessary for cart global state, or keep local if strictly bound to the page), while **absolutely ensuring the transactional sequence, API payloads, and idempotency guarantees remain untouched.**