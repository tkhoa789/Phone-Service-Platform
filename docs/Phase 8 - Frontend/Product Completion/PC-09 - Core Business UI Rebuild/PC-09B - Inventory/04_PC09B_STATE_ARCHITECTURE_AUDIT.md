# PC-09B State Architecture Audit

## Current State
- **Server State**: Managed via `useState<InventoryDto[]>` populated by `useEffect`. This is fragile and lacks caching/invalidation.
- **Form State**: Managed via controlled React inputs (`onChange={(e) => setValue(e.target.value)}`).
- **Bulk Grid State**: `StockTakePage` uses a `Record<string, number>` dictionary to track modified stock quantities.

## Target Architecture (Rebuild)
- **Server State**: Migrate to TanStack React Query (`useInventoryList`, `useCreateStockTake`).
- **Form State**: Migrate forms/modals to `react-hook-form` + `zod`.
- **Bulk Grid State**: Can remain local `useState` or `useForm` if scaled properly, but local state dictionary is acceptable for performance if no validation is needed per cell.
