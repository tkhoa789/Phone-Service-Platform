# PC-08 Master Data UI Audit

## 1. Executive Summary
The Master Data module consists of 5 core screens: **Customers, Products, Suppliers, Branches, and Users**. 
An exhaustive audit reveals that while some business logic (React Query hooks, Server-side pagination for Customers/Products) was successfully migrated in previous phases, **the UI presentation layer remains heavily anchored in legacy patterns**.

None of the Master Data screens currently utilize the newly established PC-03 Design System (`src/components/ui`) or the PC-06 Shared UX Patterns (`src/components/shared`).

## 2. Key Audit Findings
- **Legacy UI Dominance**: All 5 screens rely on raw HTML `div`, `table`, `button` tags with hardcoded Tailwind neumorphic gradients and shadows.
- **Pagination Discrepancy**: Customers and Products correctly integrate Server-side pagination. However, Suppliers, Branches, and Users still rely on unbounded APIs with client-side `.slice()` logic.
- **Component Fragmentation**: Forms for 4/5 entities successfully use `react-hook-form` + `zodResolver`. The exception is `UserFormModal`, which still uses raw `useState` and is misplaced in `src/components/users/` rather than following Feature-Sliced Design (FSD).
- **Shared UX Deficit**: `PageHeader`, `DataTable`, `SearchInput`, and `AppPagination` (from PC-06) are completely absent in the Master Data domain.

## 3. The Path Forward
PC-08 will systematically replace the legacy UI blocks in these 5 screens with the target PC-03/PC-06 components, preserving all underlying API contracts, RBAC routing, and functional baselines.
