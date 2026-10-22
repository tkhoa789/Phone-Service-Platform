# PC-09A Acceptance Criteria

1. **Architecture**: All POS code resides in `src/features/pos` or `src/features/sales`.
2. **Visual**: The UI strictly utilizes PC-03 components and removes all `--neu-` classes.
3. **Functional Preservation**:
   - Barcode scanning adds items to the cart.
   - Cart calculates Subtotal, Discount (via Voucher), and Total accurately.
   - Payment Modal calculates Change accurately.
   - Checkout sequence fires exactly two API calls: `POST /SalesOrder` and `PUT /SalesOrder/{id}/status`.
   - Idempotency key is regenerated only after a successful checkout.
   - Thermal Receipt prints correctly.