# PC-10 Defect Register

*Updated after P2 Remediation Execution*

| ID | Category | Severity | Location | Defect Description | Required Remediation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-10-01** | Accessibility | P1 - High | Global UI | Icon-only buttons (Edit, Delete, Theme Toggle) lack `aria-label`. | Added `aria-label` to all icon-only `<Button>` components. | 🟢 FIXED |
| **DEF-10-02** | Accessibility | P2 - Medium | `MainLayout.tsx` | Missing `<main>` semantic landmark. | Change `<div className="w-full...">` containing `<Outlet/>` to `<main>`. | 🟢 FIXED (Compliant) |
| **DEF-10-03** | Responsive | P1 - High | All `*ListPage.tsx` | Tables lack horizontal overflow handling. | Wrapped `<table>` inside `<div className="overflow-x-auto">`. | 🟢 FIXED |
| **DEF-10-04** | Responsive | P1 - High | `SupplierDebtLedgerModal` | Internal table breaks dialog width on mobile. | Wrapped inner table in `overflow-x-auto`. | 🟢 FIXED |
| **DEF-10-05** | Accessibility | P2 - Medium | `Header.tsx` | Missing `<header>` semantic landmark. | Change root `<div>` to `<header>`. | 🟢 FIXED (Compliant) |
| **DEF-10-06** | Accessibility | P2 - Medium | `Sidebar.tsx` | `<aside>` lacks `aria-label`. | Add `aria-label="Sidebar"`. | 🟢 FIXED |