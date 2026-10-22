# PC-09B Rebuild Plan

## Phase 1: Foundation (FSD)
- Create `src/features/inventory/hooks/useInventory.ts` using React Query.
- Map DTOs to `types/inventory.types.ts`.

## Phase 2: Modals Rebuild
- Rebuild `StockAuditModal`, `TransferTrackerModal`, `WarehouseTransferModal` using PC-03 `Dialog` and `react-hook-form`.
- Preserve the `setTimeout` mock logic for transfers.

## Phase 3: List Pages Rebuild
- Rebuild `InventoryPage` using PC-03 `Card`, `Badge`, PC-06 `Pagination`.
- Rebuild `StockTakePage` using PC-03 table layouts and optimize the input rendering.

## Phase 4: Integration
- Wire up the new FSD pages to `App.tsx` routing.
- Delete legacy files.
