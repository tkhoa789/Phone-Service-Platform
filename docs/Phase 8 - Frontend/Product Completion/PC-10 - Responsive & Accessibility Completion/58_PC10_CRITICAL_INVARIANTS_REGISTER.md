# PC-10 Critical Invariants Register

During PC-10 Execution, the following behaviors are **FROZEN** and must not be altered in the name of responsive design or accessibility.

## 1. Point of Sale (POS)
- **Cart Calculation**: Must remain entirely local.
- **Idempotency Lifecycle**: The `Idempotency-Key` must only be regenerated after a successful API response, never during a React render cycle.
- **Retail Pricing**: Must strictly consume `ProductVariant.salePrice`.
- **K80 Receipt**: The print structure must remain identical to ensure thermal printer compatibility.

## 2. Inventory (Stock Take)
- **Emission Rule**: Must emit exactly ONE `POST /api/StockTake` request containing the entire payload.
- **Client-Side Pagination**: Must remain client-side; do not switch to server-side.

## 3. Repairs
- **Cost Source of Truth**: The Backend remains the ultimate source of truth for repair costs.
- **State Machine**: The 10-state workflow (Received -> ... -> Delivered) must not be bypassed or truncated.

## 4. Purchase Orders
- **Cost Pricing**: Must strictly consume `ProductVariant.costPrice`.