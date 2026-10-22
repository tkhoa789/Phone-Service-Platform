# PC-09B API and Data Flow Map

## Endpoints in `inventoryService.ts`
1. `GET /Inventory`: Returns `InventoryDto[]`. No pagination parameters.
2. `POST /StockTake`: Submits `CreateStockTakeCommand`.
3. `GET /Warehouse`: Returns `WarehouseDto[]`.
4. `GET /Inventory/imei/{imei}`: Returns `ImeiDto`.
5. `PUT /Inventory/imei/{id}/status`: Updates IMEI status.

## Data Flow
- **Load**: `InventoryPage` and `StockTakePage` both call `getInventory()` on mount.
- **Bulk Save**: `StockTakePage` maps all modified inputs into an array of `CreateStockTakeItemCommand` and `POST`s to `createStockTake`.
- **Mock Flows**: `WarehouseTransferModal` sets a `setTimeout` and fires a success toast. No API data flow exists for transfers.
