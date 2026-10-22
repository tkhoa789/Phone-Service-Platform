# PC-09B Keep, Optimize, Rebuild, Remove

- **KEEP**: The core business logic of `StockTakePage` aggregating inputs into `CreateStockTakeCommand`. Client-side pagination `.slice()`.
- **OPTIMIZE**: Fetching logic -> Migrate to React Query to cache the massive inventory list.
- **REBUILD**: All UIs to PC-03 Design System.
- **REMOVE**: Neumorphism CSS classes. `PurchaseOrderListPage.tsx` should be relocated to `src/features/purchase-orders/pages/`.
