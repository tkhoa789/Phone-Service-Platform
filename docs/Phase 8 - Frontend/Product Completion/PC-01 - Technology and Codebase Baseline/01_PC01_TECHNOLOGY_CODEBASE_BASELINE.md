# PC-01 TECHNOLOGY & CODEBASE BASELINE

## 1. Objective
Establish an evidence-based baseline of the existing frontend technology stack and codebase for the Phone Service Platform, confirming the FROZEN FUNCTIONAL BASELINE after Phase 10.

## 2. Technology Stack Inventory

| Category | Current Technology | Version | Actual Usage | Assessment |
|---|---|---|---|---|
| **Framework** | React | 19.2.7 | 100% | Stable. |
| **Language** | TypeScript | 6.0.2 | 100% | Strict mode enabled. |
| **Build Tool** | Vite | 8.1.1 | 100% | Fast, standard. |
| **Router** | React Router DOM | 7.18.1 | 100% | Lazy loaded routes in `App.tsx`. |
| **Server State** | React Query | 5.101.4 | High | Used in `hooks/`, but some raw Axios exists. |
| **Global State** | Zustand | 5.0.14 | Medium | `authStore`, `themeStore`, `branchStore`. Good boundary. |
| **HTTP Client** | Axios | 1.18.1 | 100% | Wrapped in `axiosClient.ts`. |
| **Forms** | React Hook Form | 7.82.0 | Partial | Used in `features/*`, bypassed in older components. |
| **Validation** | Zod | 4.4.3 | Partial | Used alongside RHF in `features/*`. |
| **Styling** | Tailwind CSS | 4.3.3 | 100% | Utilizes v4 Vite plugin. |
| **UI Primitives** | Custom (Lucide/clsx) | N/A | Mixed | Custom Design System (Neumorphism) in `components/ui`. |
| **Icons** | Lucide React | 1.25.0 | 100% | Standardized. |
| **Charts** | Recharts | 3.10.0 | High | Dashboard usage. |
| **Testing** | Vitest / Testing Lib | 4.1 / 16 | Unknown | Found in `package.json`, e2e script present. |
| **Linting** | Oxlint | 1.71.0 | 100% | Ultra-fast linter replacing ESLint. |

## 3. Core Discoveries
1. **Half-Migrated Feature-Sliced Design (FSD):** The codebase is caught between a legacy monolithic structure (`src/components`, `src/services`) and a modern FSD structure (`src/features`).
2. **Bypassed Design System:** `components/ui/Button.tsx` exists and perfectly encapsulates the Neumorphism design tokens, yet major pages (e.g., `ProductListPage`, `RepairListPage`) bypass it and hardcode identical Tailwind gradient/shadow classes inline.
3. **Form Architecture Split:** Newer domains use `react-hook-form` + `zod` (`features/products/components/ProductFormModal.tsx`). Older domains use raw `useState` (`components/products/ProductFormModal.tsx`).

## 4. Frozen Functional Contracts
The following must **NOT** be broken during the UI rebuild (PC-02+):
1. **Auth & RBAC:** The JWT lifecycle and role-based route protection in `App.tsx` and `ProtectedRoute.tsx`.
2. **React Query Caching:** The 5-minute stale time and invalidation patterns.
3. **API Contracts:** The Axios interceptors and the exact JSON payloads expected by the .NET backend.
4. **Idempotency:** The transaction keys passed during POS Checkout and Repair Deposits.
5. **Phase 10 Hardening:** The newly implemented Server-Side Pagination in `Product` and `Customer`.
