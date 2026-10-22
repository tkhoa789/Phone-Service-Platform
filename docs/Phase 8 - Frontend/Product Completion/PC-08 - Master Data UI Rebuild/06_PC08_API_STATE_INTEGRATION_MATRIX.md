# API / State Integration Matrix

## Pagination Architecture Special Check (Phase 10 verification)

| Entity | API Endpoint | Data Fetching | Pagination Type | Status |
|---|---|---|---|---|
| **Customer** | `/api/Customer` | `useCustomers(page, size)` | **Server-side** (PagedResult) | ✅ Properly migrated |
| **Product** | `/api/Product` | `useProducts(page, size)` | **Server-side** (PagedResult) | ✅ Properly migrated |
| **Supplier** | `/api/Supplier` | `useSuppliers()` | **Client-side** (`.slice()`) | 🟡 Legacy unbounded fetch |
| **Branch** | `/api/Branch` | `useBranches()` | **Client-side** (`.slice()`) | 🟡 Legacy unbounded fetch |
| **User** | `/api/User` | `userService.getAll()` | **Client-side** (`.slice()`) | 🔴 Legacy service + no React Query |

> **Note on Strategy:** We will **NOT** change backend endpoints or API contracts during PC-08. For Client-side paginated entities, we will continue passing the `.slice()` array to the new `DataTable`, documenting it as a known Backend debt.
