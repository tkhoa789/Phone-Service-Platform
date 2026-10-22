# PC-09B Technical Debt Register

## 1. Client-Side Pagination (TEMPORARY COMPATIBILITY)
**Location**: `src/features/inventory/pages/InventoryPage.tsx`
**Issue**: The API `GET /Inventory` returns an unbounded array of `InventoryDto[]`. The frontend slices it locally via `(currentPage - 1) * pageSize`. 
**Mitigation**: Kept as-is per PC-09B mandate to avoid altering API contracts. Needs backend optimization in future phases.

## 2. Frontend Mocked Transfers
**Location**: `src/features/inventory/components/WarehouseTransferModal.tsx` & `TransferTrackerModal.tsx`
**Issue**: Transferring stock between branches is purely a UI simulation using `setTimeout` and `toast`.
**Mitigation**: Preserved mock behavior intentionally as no backend endpoint exists. Must be implemented in backend eventually.

## 3. Lack of Zod / react-hook-form in Stock Take
**Location**: `src/features/inventory/pages/StockTakePage.tsx`
**Issue**: Due to the spreadsheet-like nature with potentially hundreds of inputs, wrapping each in `react-hook-form` would degrade performance. We opted to maintain the local `Record<string, number>` dictionary for fast updates.
