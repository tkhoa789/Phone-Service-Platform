# Master Data Rebuild Plan

## Execution Strategy
To minimize regression, we will execute screen by screen:

1. **Phase A: The Paged Entities (Customer, Product)**
   - Replace top bar with `PageHeader` + `SearchInput`.
   - Replace `<table>` with `DataTable`.
   - Replace `Pagination` with `AppPagination`.
   - Update Form UI to use `Dialog` / `Drawer` and PC-03 `Input` components.

2. **Phase B: The Client-Paginated Entities (Supplier, Branch)**
   - Same structural UI replacements as Phase A.
   - Wire `AppPagination` safely to the existing `.slice()` logic.

3. **Phase C: The Tech-Debt Entity (Users)**
   - Move files to FSD (`src/features/users`).
   - Standardize `UserFormModal` to `zod`.
   - Replace UI structure.
