# PC-09A State & Workflow Audit

## State Assessment
- **Catalog State**: Loaded manually on mount. Should migrate to React Query `useProducts`.
- **Customer State**: Loaded manually on mount. Should migrate to React Query `useCustomers`.
- **Cart State**: Array of `CartItem` managed locally in `PosPage`. This is acceptable to remain local if the POS is a single standalone route. If cart must persist across routes, a Zustand `useCartStore` is required. Given current architecture, local state is safer to prevent cross-session leaks.
- **Transaction State**: Idempotency key stored in a React Ref. Must be preserved exactly.

## Checkout Workflow Sequence
1. `salesService.createOrder(command, idempotencyKey)` -> Returns `orderId`.
2. `salesService.updateOrderStatus(orderId, 'Completed')`.
3. Refresh idempotency key.
4. Set `lastOrderDetails` and open Receipt Modal.

*CRITICAL: This sequence cannot be interrupted or altered.*