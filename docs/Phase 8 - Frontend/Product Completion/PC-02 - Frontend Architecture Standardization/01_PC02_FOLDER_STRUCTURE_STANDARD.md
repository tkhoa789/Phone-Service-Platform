# PC-02 FOLDER STRUCTURE STANDARD

## 1. Global Directory Layout
The frontend will strictly enforce the following top-level directory structure inside `src/`. No exceptions are permitted.

```text
src/
├── assets/          # Static media (images, fonts, global SVGs).
├── components/      # STRICTLY global, domain-agnostic UI primitives.
│   ├── common/      # Structural non-UI (ErrorBoundary, Pagination, SEO).
│   ├── layout/      # Application shells (MainLayout, Sidebar, Navbar).
│   └── ui/          # Pure Design System (Button, Card, Dialog). NO BUSINESS LOGIC.
├── constants/       # Global constants, Enums, Environment variables.
├── features/        # Feature-Sliced Design domains (Business Logic & Domain UI).
│   ├── [domain]/    # e.g., products, repairs, pos, inventory.
├── locales/         # i18n dictionaries.
├── pages/           # Route definitions. Only aggregates features. No complex logic.
├── stores/          # Global Client State (Zustand). Auth, Theme, System settings.
├── types/           # STRICTLY global utility types (ApiResponse, PagedResult).
└── utils/           # Pure functional utilities (cn, date formatting, axiosClient).
```

## 2. Forbidden Structures (The "Drop Zone")
The following patterns discovered in PC-01 are explicitly banned and will be migrated/deleted:

- ❌ `src/components/[domain]/` (e.g., `components/repairs`, `components/products`). Domain UI must live inside `features/[domain]/components/`.
- ❌ `src/services/` as a catch-all. API calls must live inside `features/[domain]/api/`.
- ❌ `src/types/api.types.ts` as a monolithic God file. DTOs must live inside `features/[domain]/types/`.

## 3. The `components/` Directory Rules
- A component is only allowed in `src/components/ui/` if it is completely unaware of the application's business domains. 
- A `Button` goes here. A `ProductCard` does **not**. 

## 4. The `pages/` Directory Rules
- Pages act solely as Routers and Composition Roots.
- A Page may fetch URL parameters, pass them to a Feature Hook, and render Feature Components.
- A Page must **not** contain raw `<form>` tags, complex `useState` logic, or inline API calls.
