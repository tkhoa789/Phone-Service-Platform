# Screen Inventory

| Entity | Route | Component File | FSD Compliant? | Current Status |
|---|---|---|---|---|
| **Customers** | `/customers` | `src/pages/customers/CustomerListPage.tsx` | ✅ Yes (`src/features/customers`) | Legacy UI, Server Pagination |
| **Products** | `/products` | `src/pages/products/ProductListPage.tsx` | ✅ Yes (`src/features/products`) | Legacy UI, Server Pagination |
| **Suppliers** | `/suppliers` | `src/pages/suppliers/SupplierListPage.tsx` | ✅ Yes (`src/features/suppliers`) | Legacy UI, Client Pagination |
| **Branches** | `/branches` | `src/pages/branches/BranchListPage.tsx` | ✅ Yes (`src/features/branches`) | Legacy UI, Client Pagination |
| **Users** | `/users` | `src/pages/users/UserListPage.tsx` | ❌ No (`src/components/users`) | Legacy UI, Client Pagination, Legacy State |
