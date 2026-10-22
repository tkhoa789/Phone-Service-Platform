# PC-09B FSD Migration Map

## Target Structure: `src/features/inventory/`

- `components/InventoryTable.tsx`
- `components/StockAuditModal.tsx`
- `components/TransferTrackerModal.tsx`
- `components/WarehouseTransferModal.tsx`
- `components/BatchProductSelectModal.tsx`
- `pages/InventoryPage.tsx` (Routed from `src/pages/inventory/`)
- `pages/StockTakePage.tsx`
- `hooks/useInventory.ts` (React Query definitions)
- `services/inventory.service.ts` (Migrated from `src/services/inventoryService.ts`)
- `types/inventory.types.ts` (Migrated from `src/types/api.types.ts`)
- `schemas/inventory.schema.ts` (Zod schemas for StockTake and Transfers)
