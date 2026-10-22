# PC-09B Screen Inventory

## 1. Inventory List Page (`InventoryPage.tsx`)
- Features: IMEI lookup, Branch select, Low stock toggle, Pagination, Table of variants.
- Actions: Audit (opens StockAuditModal).

## 2. Stock Take Page (`StockTakePage.tsx`)
- Features: Loads all inventory into a map, renders an editable spreadsheet grid.
- Actions: Save Audit (fires `createStockTake`).

## 3. Transfer & Mock Modals
- `WarehouseTransferModal.tsx`: Form to select source/dest warehouse and transfer items. purely frontend setTimeout mock.
- `TransferTrackerModal.tsx`: Timeline UI purely frontend mock.
- `StockAuditModal.tsx`: Single item audit, purely frontend mock (interestingly, only the bulk Stock Take calls the real API).
- `BatchProductSelectModal.tsx`: Helper to pick products for the transfer modal.
