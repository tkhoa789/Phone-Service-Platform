# PC-01 ARCHITECTURE INVENTORY

## 1. Source Tree Analysis

The `src/` directory exhibits a split architectural personality:

```text
src/
├── assets/          # Static files
├── components/      # Legacy Monolith + Common UI
│   ├── common/      # Shared components (Pagination, ErrorBoundary) -> Good
│   ├── ui/          # Design System Primitives (Button, Dialog) -> Good
│   └── [domain]/    # Legacy Domain Components (products, repairs, inventory, pos...) -> DEBT
├── constants/       # Global constants
├── features/        # Modern Feature-Sliced Design (FSD) -> Good
│   ├── branches/
│   ├── customers/
│   ├── products/    # Contains api/, components/, hooks/, schemas/, types/
│   ├── purchase-orders/
│   ├── suppliers/
│   └── warehouses/
├── locales/         # i18n
├── pages/           # Route definitions (Page level components)
├── services/        # Legacy API wrappers -> DEBT (Overlap with features/*/api/)
├── stores/          # Zustand global stores -> Good
├── types/           # Legacy God Types (`api.types.ts` is 541 lines) -> DEBT
└── utils/           # Shared utilities (`cn.ts`, `axiosClient.ts`)
```

## 2. Architectural Boundaries

### Good Boundaries
- **Global State vs Server State:** Clean separation. Zustand is strictly used for client state (Auth, Theme, System), while React Query handles all server data fetching.
- **Routing:** `App.tsx` handles lazy loading and route protection cleanly.

### Weak Boundaries (Technical Debt)
- **FSD vs Monolith:** The transition to Feature-Sliced Design (`src/features`) was abandoned halfway. 6 domains are in `features/`, but massive domains like `repairs`, `pos`, `inventory`, `sales`, and `warranties` are still scattered across `src/components/`, `src/services/`, and `src/types/api.types.ts`.
- **Duplicate Implementations:** `components/products/ProductFormModal.tsx` and `features/products/components/ProductFormModal.tsx` exist simultaneously.
- **God Files:** `src/types/api.types.ts` contains DTOs for the entire system, violating bounded contexts.

## 3. Styling Architecture
- **System:** Pure CSS variables (`index.css`) mapped to Neumorphism design tokens (`--neu-bg-base`, `--neu-shadow-button`).
- **Execution:** Highly inconsistent. `components/ui/Button.tsx` encapsulates these tokens, but many pages (e.g., `ProductListPage`, `RepairListPage`) bypass the Design System entirely and write raw Tailwind utility classes inline.
