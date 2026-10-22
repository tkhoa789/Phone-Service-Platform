# PC-10 Remediation Blueprint

## Phase 1: Semantic Landmarks (Low Risk)
- Target: `MainLayout.tsx`, `Header.tsx`, `Sidebar.tsx`.
- Action: Replace generic `<div>` with `<main>`, `<header>`, and add `aria-label` to `<aside>`.
- Invariant Impact: 0%.

## Phase 2: Accessible Names (Low Risk)
- Target: All occurrences of `<Button size="icon">`.
- Action: Inject `aria-label={t.actionName}` or literal strings (e.g., `"Edit"`, `"Delete"`, `"Toggle Theme"`).
- Invariant Impact: 0%.

## Phase 3: Responsive Tables (Medium Risk)
- Target: `CustomerListPage.tsx`, `ProductListPage.tsx`, `SupplierListPage.tsx`, `BranchListPage.tsx`, `UserListPage.tsx`, `WarehouseListPage.tsx`, `RepairListPage.tsx`, `SalesOrderListPage.tsx`, `VoucherListPage.tsx`, `WarrantyListPage.tsx`.
- Action: Wrap all `<table>` elements inside `<div className="overflow-x-auto w-full">`.
- Invariant Impact: 0% (Purely CSS layout adjustment).

## Execution Strategy
These remediations can be applied in a single batch. No business logic, API calls, or state management hooks will be touched.