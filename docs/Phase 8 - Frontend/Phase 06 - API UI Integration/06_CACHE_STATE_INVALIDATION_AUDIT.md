# 06.11 CACHE / STATE INVALIDATION AUDIT

## 1. Feature-Sliced Architecture (React Query)
- Modules in src/features/ correctly use useMutation with onSuccess: () => queryClient.invalidateQueries(...). This ensures data freshness post-mutation.

## 2. Legacy Architecture (src/pages/)
- Modules using raw useState rely on manually triggering loadData() functions after mutations (e.g., onSuccess callback in Modals).
- **POS Checkout:** Because the API workflow is broken (Draft instead of Completed), inventory is not deducted, meaning the product list does not need invalidating. If fixed, it must invalidate ['products'] or manually refresh the catalog.
