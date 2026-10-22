# PC-01 KEEP / OPTIMIZE / REBUILD / REMOVE MATRIX

This matrix serves as the foundation for the PC-02+ phases.

| Area | KEEP | OPTIMIZE | REBUILD | REMOVE | Reason |
|---|:---:|:---:|:---:|:---:|---|
| **Vite / React 19 / TS 6** | ✅ | | | | Modern, ultra-fast baseline. |
| **Auth & RBAC Guards** | ✅ | | | | Essential frozen functional boundary. Works perfectly. |
| **React Query / Zustand** | ✅ | | | | Excellent state management separation. |
| **Tailwind + Neumorphism** | ✅ | | | | The `var(--neu-*)` variables in `index.css` are the core identity of the brand. |
| **Design System (components/ui)** | | ✅ | | | Primitives are good, but some are missing or lack variant coverage causing developers to bypass them. |
| **Feature-Sliced Design (FSD)** | | ✅ | | | Expand `features/` to encompass all domains. |
| **API Client (Axios)** | | ✅ | | | Interceptors are fine, but DTO types need to be colocated. |
| **List Pages (UI)** | | | ✅ | | Pages like `ProductListPage` and `RepairListPage` need to be rewritten to strictly use the Design System instead of inline Tailwind. |
| **Legacy Forms (useState)** | | | ✅ | | Migrate all raw `useState` forms to `react-hook-form` + `zod`. |
| **`components/products/`** | | | | ❌ | Orphaned dead code. |
| **`components/ui/Modal.tsx`** | | | | ❌ | Duplicate of `Dialog.tsx` with 0 usages. |
| **`types/api.types.ts`** | | | | ❌ | Monolithic God File. Split into `features`. |
