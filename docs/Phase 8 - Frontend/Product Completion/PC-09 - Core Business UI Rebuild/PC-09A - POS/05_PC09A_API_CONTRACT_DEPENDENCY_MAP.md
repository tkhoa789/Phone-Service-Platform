# PC-09A API Contract Dependency Map

## Required Endpoints
| Action | Service Method | Backend Endpoint | Method | Note |
|---|---|---|---|---|
| Load Products | `productService.getAll` | `/Product` | GET | Requires variants included. |
| Load Customers| `customerService.getAll`| `/Customer`| GET | |
| Validate Code | `voucherService.validateVoucher`| `/Voucher/validate/{code}` | GET | Validates discount rules. |
| Create Order | `salesService.createOrder` | `/SalesOrder` | POST | Requires `Idempotency-Key` header. |
| Complete Order| `salesService.updateOrderStatus`| `/SalesOrder/{id}/status` | PUT | |

## Payload Constraints
`CreateSalesOrderCommand` requires:
- `customerId?: string`
- `voucherCode?: string`
- `items: { productVariantId: string, quantity: number, unitPrice: number, imei?: string }[]`