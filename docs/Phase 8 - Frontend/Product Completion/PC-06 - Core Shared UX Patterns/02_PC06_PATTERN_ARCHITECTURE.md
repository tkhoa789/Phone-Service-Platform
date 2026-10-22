# PC-06 PATTERN ARCHITECTURE

## 1. The Separation of Powers
- **`components/ui` (Design System):** Dumb, stateless UI primitives (`Button`, `Card`, `Input`, `Dialog`).
- **`components/shared` (UX Patterns):** Compositions of `ui` primitives that establish layout and behavior (`PageHeader`, `DataTable`, `ConfirmDialog`). They are completely domain-agnostic.
- **`pages/*` (Business Features):** The orchestrators. They fetch data via React Query and pass it to `shared` patterns.

## 2. Directory Structure
```text
src/components/shared/
 ├── index.ts
 ├── PageHeader.tsx
 ├── SearchInput.tsx
 ├── DataTable.tsx
 ├── AppPagination.tsx
 └── ConfirmDialog.tsx
```

## 3. Strict Rules
- **No Feature Imports:** A file in `shared` cannot import anything from `features` or `pages`.
- **No Server State:** Patterns do not fetch data. `AppPagination` only receives `currentPage` and `onPageChange` callbacks.
- **No Parallel Design Systems:** Patterns must not declare inline Hex shadows. They must use standard `ui` components or semantic `var(--neu-...)` tokens.
