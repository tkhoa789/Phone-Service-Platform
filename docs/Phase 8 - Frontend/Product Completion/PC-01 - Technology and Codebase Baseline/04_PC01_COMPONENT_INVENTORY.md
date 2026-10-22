# PC-01 COMPONENT INVENTORY

## 1. UI Primitives (Design System)
Located in `src/components/ui/`:

| Component | Status | Assessment |
|---|---|---|
| `Button.tsx` | Present | Good encapsulation of Neumorphism variants. Heavily bypassed in pages. |
| `Card.tsx` | Present | Used in Dashboard and some list pages. |
| `Dialog.tsx` | Present | Radix-style dialog primitive. |
| `Modal.tsx` | Present | **DUPLICATE** of Dialog. Has 0 usages across the codebase. |
| `Input.tsx` | Present | Basic input. Bypassed frequently for raw HTML `<input>`. |
| `FormField.tsx` | Present | React-Hook-Form wrapper. |
| `Badge.tsx` | Present | Used for status indicators. |
| `EmptyState.tsx`| Present | Used in tables. |
| `Skeleton.tsx` | Present | Used for loading states. |

## 2. Common Components
Located in `src/components/common/`:

| Component | Status | Assessment |
|---|---|---|
| `Pagination.tsx` | Present | Bound to Server-Side Pagination. Functionally stable. |
| `PageSkeleton.tsx`| Present | Excellent global loading state. |
| `ProtectedRoute.tsx`| Present | Essential RBAC guard. DO NOT TOUCH. |
| `ErrorBoundary.tsx` | Present | Functional crash boundary. |
| `SearchableSelect.tsx`| Present | Complex custom dropdown. Needs review for accessibility/performance. |

## 3. Form Component Inconsistencies
| Component | Location | State Management | Assessment |
|---|---|---|---|
| `ProductFormModal` | `features/products/components/` | `react-hook-form` + `zod` | Modern, standard. |
| `ProductFormModal` | `components/products/` | `useState` (formData) | **ORPHANED LEGACY**. Never imported. |
| `RepairChecklistModal` | `components/repairs/` | Unknown / Raw HTML | Legacy structure. Bypasses FSD. |

## 4. Bypassed Design System Instances
Pages like `ProductListPage.tsx` and `RepairListPage.tsx` contain massive blocks of inline Tailwind that directly duplicate the CSS present in `components/ui/Button.tsx`.

Example from `RepairListPage.tsx`:
```tsx
<button className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-[11px] shadow-[var(--neu-shadow-button)] hover:scale-105 transition-all cursor-pointer">
```
*(This is identical to `<Button size="sm" variant="primary">`)*
