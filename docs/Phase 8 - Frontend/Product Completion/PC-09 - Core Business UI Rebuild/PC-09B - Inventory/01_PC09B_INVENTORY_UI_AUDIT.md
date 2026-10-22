# PC-09B Inventory UI Audit

## Scope Discovered
- **InventoryPage**: The main stock overview list. Supports filtering by branch, low stock alert toggle, and a lookup for IMEI.
- **StockTakePage**: A bulk spreadsheet-like page for auditing stock across an entire warehouse.
- **StockAuditModal**: A single-item stock reconciliation modal (Mocked/Frontend only).
- **WarehouseTransferModal**: A modal to transfer stock between branches (Mocked/Frontend only).
- **TransferTrackerModal**: A tracking timeline modal (Mocked/Frontend only).
- **PurchaseOrderListPage**: Resides in `src/pages/inventory/` but consumes `src/features/purchase-orders/`.

## Architectural State
- **State Management**: Legacy `useState` and `useEffect`.
- **API Client**: Raw `inventoryService.ts` methods. No React Query usage for Inventory.
- **Forms**: Raw HTML forms, no `react-hook-form`, no `zod`.
- **Styling**: Extensive use of Legacy Neumorphism (`var(--neu-bg-base)`, `shadow-[var(--neu-shadow-inset)]`).
- **Pagination**: Client-side using `filteredInventories.slice(...)`.
