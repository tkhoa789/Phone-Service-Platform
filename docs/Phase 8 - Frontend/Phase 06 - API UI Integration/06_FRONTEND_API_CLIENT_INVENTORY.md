# 06.2 FRONTEND API CLIENT INVENTORY

> **Audit Scope:** src/frontend/src/services & src/frontend/src/features/*/api

## Client Mapping Matrix

| Backend Route | Frontend Client | Frontend Function | Status | Notes |
|---|---|---|---|---|
| POST /api/SalesOrder | salesService.ts | createOrder | INTEGRATED | Misses Idempotency-Key header |
| PUT /api/SalesOrder/{id}/status | salesService.ts | updateOrderStatus | NOT INTEGRATED | UI POS flow never calls this |
| POST /api/WarrantyTicket | serviceService.ts| createWarrantyTicket | INTEGRATED | - |
| PUT /api/WarrantyTicket/{id}/status| serviceService.ts| updateWarrantyStatus | PARTIAL | UI ignores RowVersion payload |
| POST /api/StockTake | inventoryService.ts | N/A | MOCKED | UI uses setTimeout |
| POST /api/RepairTicket | serviceService.ts | createRepairTicket | INTEGRATED | Misses Idempotency-Key header |
| POST /api/PurchaseOrder | eatures/purchase-orders/api/ | createPurchaseOrder | INTEGRATED | Uses useMutation correctly |

## Observations
1. Frontend API services are fragmented between legacy services/ and modern eatures/*/api/.
2. Multiple critical integration gaps exist in the legacy services (salesService, inventoryService, serviceService).
