# PC-06 SHARED UX AUDIT

## 1. Audit Scope
Inventory of current UI duplication across Business Modules (`src/pages/*`).

## 2. Findings

### 2.1 Page Headers
- **Status:** Severely duplicated.
- **Observation:** `ProductListPage.tsx`, `SupplierListPage.tsx`, `UserListPage.tsx`, etc., all manually implement a `<div className="p-6 rounded-3xl ...">` to show a title, icon, and action buttons.
- **Resolution:** Centralized into `<PageHeader>` in `components/shared/`.

### 2.2 Search Bars
- **Status:** Duplicated raw HTML.
- **Observation:** Every list page uses `<input type="text" className="w-full bg-[var(--neu-bg-base)] border ... pl-11">` with an absolute positioned `<Search>` icon.
- **Resolution:** Centralized into `<SearchInput>` in `components/shared/`.

### 2.3 Data Tables (Empty & Loading States)
- **Status:** Inconsistent mapping.
- **Observation:** Pages check `if (loading && !data.length) return <PageSkeleton />`. This abruptly unmounts the page header. 
- **Resolution:** Created `<DataTable>` wrapper that safely renders `Table` primitives, skeleton rows, and the `EmptyState`.

### 2.4 Pagination
- **Status:** Hardcoded Hex values.
- **Observation:** `components/common/Pagination.tsx` existed but used hardcoded `#b8c4d4` shadows, breaking Dark Mode.
- **Resolution:** Re-implemented as `AppPagination` in `components/shared/` using `Button` and `Badge`.

### 2.5 Confirmation Dialogs
- **Status:** Using `window.confirm`.
- **Observation:** E.g., `ProductListPage.tsx` calls `window.confirm('Xóa biến thể SKU?')`. This is inaccessible and un-styleable.
- **Resolution:** Created `<ConfirmDialog>` in `components/shared/` based on `Dialog` primitive.
