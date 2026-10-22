# PC-02 FEATURE-SLICED DESIGN (FSD) RULES

## 1. Feature Definition
A "Feature" is a cohesive business domain (e.g., `products`, `customers`, `repairs`, `pos`). 
All business logic, DTOs, API wrappers, React Query hooks, and Domain-Specific UI components must be colocated within their respective feature folder.

## 2. Internal Feature Structure
Every feature must adhere to the following internal blueprint:

```text
src/features/[feature-name]/
├── api/             # Axios API wrapper functions (e.g., product.api.ts)
├── components/      # Domain-specific UI (e.g., ProductFormModal.tsx)
├── hooks/           # React Query custom hooks (e.g., useProducts.ts)
├── schemas/         # Zod validation schemas (e.g., product.schema.ts)
├── types/           # TypeScript interfaces & DTOs (e.g., product.types.ts)
└── utils/           # Domain-specific helpers (optional)
```

## 3. Strict Import Boundaries
To prevent circular dependencies and spaghetti code, the following import rules are enforced:

### Rule 1: Upward Dependency Only
- Features can import from global layers (`src/components/ui`, `src/utils`, `src/types`).
- Global layers **CANNOT** import from features. (e.g., `src/components/ui/Button` cannot import `features/products/types`).

### Rule 2: Cross-Feature Boundaries
- Feature A should avoid importing directly from Feature B's internal files.
- If Feature A needs Feature B, it should only import from a designated entry point or public interface, OR the shared logic should be moved to a global layer if it is truly generic.
- **Exception:** Aggregator features like `pos` (Point of Sale) are allowed to import DTOs and Hooks from `products` and `customers`, as POS is an orchestration layer.

### Rule 3: The Page Composition Rule
```text
[PAGE] -> imports -> [FEATURE HOOKS] + [FEATURE COMPONENTS] + [GLOBAL UI]
[PAGE] -> NEVER imports -> [API CLIENT] directly.
```
Pages orchestrate. Features execute.
