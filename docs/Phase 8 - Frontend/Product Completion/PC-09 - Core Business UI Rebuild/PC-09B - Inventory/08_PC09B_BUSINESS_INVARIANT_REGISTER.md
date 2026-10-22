# PC-09B Business Invariant Register

## 1. Stock Take Aggregation (CONFIRMED)
`StockTakePage` submits ONLY items that belong to the SAME `warehouseId`. The payload extracts `inventoryList[0].warehouseId` implicitly.

## 2. Negative Stock Prevention (INFERRED)
`StockAuditModal` prevents negative actual stock via a client-side `if (actualQuantity < 0)` check.

## 3. Transfer Mock (CONFIRMED)
Warehouse transfers are purely frontend mock UIs. No API exists for them.

## 4. Bulk Data Structure (CONFIRMED)
`CreateStockTakeCommand` accepts a flat list of `productVariantId` and `actualQuantity`. There is no "difference" submitted, only the absolute physical count.
